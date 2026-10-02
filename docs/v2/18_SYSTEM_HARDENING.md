# System Hardening

Phase 20 hardens public delivery, private workflow boundaries, observability, cache coordination, and object storage without activating unapproved infrastructure.

## Public and callback security

All web responses now receive `nosniff`, clickjacking, referrer, permissions, opener, and restrictive structural CSP headers. The framework identity header is disabled. The CSP deliberately constrains framing, form destinations, base URLs, and plugin objects without prematurely imposing script/style directives that would break Next.js rendering.

`/api/health` returns only service liveness and time, is never cached, and contains no dependency topology or credentials. The authenticated durable-workflow callback rejects oversized declared payloads and bounded field lengths before reading job state. Existing constant-time callback authorization and 404 fail-closed behavior remain intact.

## Langfuse tracing

Research and Aperture Trigger tasks emit fail-open workflow spans. The research pipeline emits one span per durable research stage, and OpenAI composition calls emit model, provider, latency, token usage when returned, status, and errors. Prompts and outputs are excluded by default and are captured only when `LANGFUSE_CAPTURE_CONTENT=true` is explicitly set.

Trace export uses the supported Langfuse v4 OpenTelemetry HTTP endpoint (`/api/public/otel/v1/traces`) and ingestion-version header, not the deprecated legacy ingestion API. Credentials use Basic authentication and never enter URLs or payloads. Email addresses, authorization values, cookies, passwords, secrets, API keys, session values, bearer tokens, JWT-like values, cycles, excessive depth, and oversized trace content are redacted or bounded before export. Trace failure cannot fail a research workflow.

## Valkey and object storage

The worker now has production adapters for the existing `CacheStore` and `ObjectStore` ports:

- Valkey/Redis uses the maintained Redis client, lazy connection, a mandatory namespace prefix, bounded TTL, and validated keys. It remains ephemeral and never becomes research truth.
- S3-compatible storage uses AWS Signature V4 through the maintained AWS SDK, server-side AES-256 encryption on writes, validated object keys, private reads, and read URLs capped at one hour. It remains a content/evidence blob store; PostgreSQL retains metadata, provenance, access policy, and hashes.

## Configuration

- Langfuse: `LANGFUSE_BASE_URL`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`; optional `LANGFUSE_CAPTURE_CONTENT` and `LANGFUSE_TIMEOUT_MS`.
- Valkey: `VALKEY_URL` (or compatibility `REDIS_URL`); optional `VALKEY_KEY_PREFIX`.
- S3-compatible storage: `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`; optional `S3_ENDPOINT`, `S3_REGION`, `S3_FORCE_PATH_STYLE`.

All adapters remain absent when unconfigured. Production activation still requires approved endpoints, secret management, network policy, retention, backup/recovery, least privilege, bucket CORS/lifecycle policy, and data-processing review.

## Verification

`pnpm verify:system-hardening` covers recursive redaction, partial-config rejection, Langfuse v4 path/headers/content opt-in, Valkey namespacing/TTL, S3 key and signed-URL bounds, security headers, and callback size limits. Browser tests assert live response headers, minimal health output, public privacy, and all existing responsive/gating behavior.
