import postgres, { type Sql } from "postgres";

declare global {
  var __deeptechlyPostgres: Sql | undefined;
}

export function hasPostgresConfiguration() {
  return Boolean(
    process.env.DEEPTECHLY_V2_DATABASE_URL?.trim() ||
      (process.env.DEEPTECHLY_V2_DATABASE_HOST?.trim() &&
        process.env.DEEPTECHLY_V2_DATABASE_NAME?.trim())
  );
}

export function getPostgres(): Sql | null {
  if (!hasPostgresConfiguration()) return null;
  if (globalThis.__deeptechlyPostgres) return globalThis.__deeptechlyPostgres;

  const ssl =
    process.env.DEEPTECHLY_V2_DATABASE_SSL === "disable"
      ? false
      : process.env.DEEPTECHLY_V2_DATABASE_SSL === "require" ||
          process.env.NODE_ENV === "production"
        ? "require"
        : false;
  const sharedOptions = {
    max: Number(process.env.DEEPTECHLY_V2_DATABASE_POOL_SIZE ?? 8),
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 20,
    ssl,
    onnotice: () => undefined
  } as const;
  const databaseUrl = process.env.DEEPTECHLY_V2_DATABASE_URL?.trim();
  const sql = databaseUrl
    ? postgres(databaseUrl, sharedOptions)
    : postgres({
        ...sharedOptions,
        host: process.env.DEEPTECHLY_V2_DATABASE_HOST!.trim(),
        port: Number(process.env.DEEPTECHLY_V2_DATABASE_PORT ?? 5432),
        database: process.env.DEEPTECHLY_V2_DATABASE_NAME!.trim(),
        ...(process.env.DEEPTECHLY_V2_DATABASE_USER?.trim()
          ? { username: process.env.DEEPTECHLY_V2_DATABASE_USER.trim() }
          : {}),
        ...(process.env.DEEPTECHLY_V2_DATABASE_PASSWORD
          ? { password: process.env.DEEPTECHLY_V2_DATABASE_PASSWORD }
          : {})
      });

  globalThis.__deeptechlyPostgres = sql;
  return sql;
}

export function requirePostgres() {
  const sql = getPostgres();
  if (!sql) {
    throw new Error("PostgreSQL is not configured for this environment");
  }
  return sql;
}
