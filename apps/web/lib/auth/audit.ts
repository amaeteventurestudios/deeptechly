import { createHash, randomUUID } from "node:crypto";
import { getPostgres } from "@/lib/database/postgres";

type JsonValue = null | string | number | boolean | readonly JsonValue[] | { readonly [key: string]: JsonValue | undefined };

export async function recordAuthAudit(input: {
  eventType: string;
  outcome: "success" | "failure";
  actorAccountId?: string | null;
  targetAccountId?: string | null;
  identifier?: string | null;
  metadata?: Record<string, JsonValue>;
}) {
  const sql = getPostgres();
  if (!sql) return false;
  const identifierHash = input.identifier
    ? createHash("sha256").update(input.identifier.trim().toLowerCase()).digest("hex")
    : null;
  try {
    await sql`
      insert into deeptechly.auth_audit_events (
        id, event_type, outcome, actor_account_id, target_account_id,
        provider, identifier_hash, metadata, occurred_at
      ) values (
        ${randomUUID()}, ${input.eventType}, ${input.outcome},
        ${input.actorAccountId || null}, ${input.targetAccountId || null},
        'pocketbase', ${identifierHash}, ${sql.json(input.metadata || {})}, now()
      )
    `;
    return true;
  } catch (error) {
    // Authentication must remain available if the audit sink is temporarily unavailable.
    console.error("Unable to persist authentication audit event", error);
    return false;
  }
}
