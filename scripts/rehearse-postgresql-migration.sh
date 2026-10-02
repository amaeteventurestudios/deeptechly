#!/usr/bin/env bash
set -euo pipefail

REPOSITORY_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_PATH="${LEGACY_BACKUP_PATH:-$REPOSITORY_ROOT/migration/legacy-supabase/db_cluster-19-08-2026@15-19-13.backup.gz}"
REHEARSAL_ROOT="$REPOSITORY_ROOT/migration/legacy-supabase/rehearsal"
PORT="${DEEPTECHLY_REHEARSAL_PORT:-55432}"
WEB_PORT="${DEEPTECHLY_REHEARSAL_WEB_PORT:-3018}"
if [[ -n "${DEEPTECHLY_PG_BIN:-}" ]]; then
  PG_BIN="$DEEPTECHLY_PG_BIN"
elif [[ -x "/Applications/Postgres.app/Contents/Versions/17/bin/postgres" ]]; then
  PG_BIN="/Applications/Postgres.app/Contents/Versions/17/bin"
elif [[ -x "/Volumes/Postgres-2.9.6-17/Postgres.app/Contents/Versions/17/bin/postgres" ]]; then
  PG_BIN="/Volumes/Postgres-2.9.6-17/Postgres.app/Contents/Versions/17/bin"
elif brew list --versions postgresql@17 >/dev/null 2>&1; then
  PG_BIN="$(brew --prefix postgresql@17)/bin"
else
  echo "PostgreSQL 17 server binaries are required; set DEEPTECHLY_PG_BIN" >&2
  exit 1
fi
CURRENT_DATA_DIR=""
CURRENT_WEB_PID=""

cleanup_active_server() {
  if [[ -n "$CURRENT_WEB_PID" ]]; then
    kill "$CURRENT_WEB_PID" >/dev/null 2>&1 || true
    wait "$CURRENT_WEB_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$CURRENT_DATA_DIR" && -d "$CURRENT_DATA_DIR" ]]; then
    "$PG_BIN/pg_ctl" --pgdata="$CURRENT_DATA_DIR" --wait stop >/dev/null 2>&1 || true
  fi
}
trap cleanup_active_server EXIT

if [[ ! -f "$BACKUP_PATH" ]]; then
  echo "Legacy backup not found: $BACKUP_PATH" >&2
  exit 1
fi

for executable in initdb pg_ctl createdb psql; do
  if [[ ! -x "$PG_BIN/$executable" ]]; then
    echo "Required PostgreSQL executable is missing: $PG_BIN/$executable" >&2
    exit 1
  fi
done

safe_reset() {
  local target="$1"
  case "$target" in
    "$REHEARSAL_ROOT"/run-1|"$REHEARSAL_ROOT"/run-2)
      rm -rf "$target"
      ;;
    *)
      echo "Refusing to reset unexpected path: $target" >&2
      exit 1
      ;;
  esac
}

run_once() {
  local label="$1"
  local run_root="$REHEARSAL_ROOT/$label"
  local data_dir="$run_root/postgres-data"
  local socket_dir="$run_root/socket"
  local staging_sql="$run_root/staging.sql"
  local inventory_json="$run_root/inventory.json"
  local reconciliation_json="$run_root/reconciliation.json"
  local server_log="$run_root/postgres.log"

  safe_reset "$run_root"
  mkdir -p "$socket_dir"
  chmod 700 "$run_root" "$socket_dir"

  pnpm exec tsx scripts/migration/legacy-supabase-dump.ts \
    --backup "$BACKUP_PATH" \
    --output "$staging_sql" \
    --inventory "$inventory_json"

  "$PG_BIN/initdb" --pgdata="$data_dir" --encoding=UTF8 --no-locale --auth=trust >/dev/null
  "$PG_BIN/pg_ctl" \
    --pgdata="$data_dir" \
    --log="$server_log" \
    --options="-F -p $PORT -k $socket_dir -c listen_addresses='127.0.0.1'" \
    --wait start >/dev/null
  CURRENT_DATA_DIR="$data_dir"

  "$PG_BIN/createdb" --host="$socket_dir" --port="$PORT" deeptechly_rehearsal
  for migration in "$REPOSITORY_ROOT"/packages/database/migrations/*.sql; do
    "$PG_BIN/psql" --host="$socket_dir" --port="$PORT" --dbname=deeptechly_rehearsal \
      --set=ON_ERROR_STOP=1 --file="$migration" >/dev/null
  done
  "$PG_BIN/psql" --host="$socket_dir" --port="$PORT" --dbname=deeptechly_rehearsal \
    --set=ON_ERROR_STOP=1 --file="$staging_sql" >/dev/null
  "$PG_BIN/psql" --host="$socket_dir" --port="$PORT" --dbname=deeptechly_rehearsal \
    --set=ON_ERROR_STOP=1 \
    --file="$REPOSITORY_ROOT/scripts/migration/transform-legacy-supabase.sql" >/dev/null
  DEEPTECHLY_RESEARCH_STORE_PROVIDER=v2-postgres \
  DEEPTECHLY_V2_DATABASE_HOST=127.0.0.1 \
  DEEPTECHLY_V2_DATABASE_PORT="$PORT" \
  DEEPTECHLY_V2_DATABASE_NAME=deeptechly_rehearsal \
    pnpm exec tsx scripts/validate-migrated-application.ts \
      --output "$run_root/application-validation.json"

  DEEPTECHLY_RESEARCH_STORE_PROVIDER=v2-postgres \
  DEEPTECHLY_V2_DATABASE_HOST=127.0.0.1 \
  DEEPTECHLY_V2_DATABASE_PORT="$PORT" \
  DEEPTECHLY_V2_DATABASE_NAME=deeptechly_rehearsal \
  NEXT_PUBLIC_SITE_URL="http://127.0.0.1:$WEB_PORT" \
    pnpm --filter @deeptechly/web dev --hostname 127.0.0.1 --port "$WEB_PORT" \
      >"$run_root/web.log" 2>&1 &
  CURRENT_WEB_PID="$!"
  for attempt in {1..60}; do
    if curl --fail --silent "http://127.0.0.1:$WEB_PORT/api/health" >/dev/null; then
      break
    fi
    if [[ "$attempt" -eq 60 ]]; then
      echo "Migrated-data web server did not become ready" >&2
      exit 1
    fi
    sleep 1
  done
  DEEPTECHLY_V2_DATABASE_HOST=127.0.0.1 \
  DEEPTECHLY_V2_DATABASE_PORT="$PORT" \
  DEEPTECHLY_V2_DATABASE_NAME=deeptechly_rehearsal \
  DEEPTECHLY_REHEARSAL_WEB_URL="http://127.0.0.1:$WEB_PORT" \
    pnpm exec tsx scripts/validate-migrated-http.ts \
      --output "$run_root/http-validation.json"
  kill "$CURRENT_WEB_PID" >/dev/null 2>&1 || true
  wait "$CURRENT_WEB_PID" >/dev/null 2>&1 || true
  CURRENT_WEB_PID=""
  "$PG_BIN/psql" --host="$socket_dir" --port="$PORT" --dbname=deeptechly_rehearsal \
    --set=ON_ERROR_STOP=1 --tuples-only --no-align \
    --output="$reconciliation_json" \
    --file="$REPOSITORY_ROOT/scripts/migration/verify-rehearsal.sql"

  cleanup_active_server
  CURRENT_DATA_DIR=""

  # Generated SQL contains production-derived rows. Retain only aggregate reports.
  rm -f "$staging_sql" "$server_log" "$run_root/web.log"
  case "$data_dir" in
    "$run_root"/postgres-data) rm -rf "$data_dir" "$socket_dir" ;;
    *) echo "Refusing to remove unexpected PostgreSQL data directory" >&2; exit 1 ;;
  esac
  echo "Completed isolated rehearsal $label"
}

mkdir -p "$REHEARSAL_ROOT"
chmod 700 "$REHEARSAL_ROOT"
run_once run-1
run_once run-2

if ! cmp -s \
  "$REHEARSAL_ROOT/run-1/inventory.json" \
  "$REHEARSAL_ROOT/run-2/inventory.json"; then
  echo "Inventory output changed between clean rehearsals" >&2
  exit 1
fi

for report in application-validation.json http-validation.json; do
  if ! cmp -s "$REHEARSAL_ROOT/run-1/$report" "$REHEARSAL_ROOT/run-2/$report"; then
    echo "$report changed between clean rehearsals" >&2
    exit 1
  fi
done

if ! cmp -s \
  "$REHEARSAL_ROOT/run-1/reconciliation.json" \
  "$REHEARSAL_ROOT/run-2/reconciliation.json"; then
  echo "Reconciliation output changed between clean rehearsals" >&2
  exit 1
fi

echo "Two clean PostgreSQL rehearsals produced equivalent aggregate results."
