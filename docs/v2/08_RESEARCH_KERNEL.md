# DeepTechly Research Kernel Boundary

## Phase 10 result

The first production-used proprietary policies now live in `@deeptechly/research`, outside Next.js and outside provider adapters. Existing web module paths remain as compatibility façades, so route imports and production behavior do not change abruptly.

Extracted capabilities:

- entity input classification, name/domain normalization, and canonical slugging;
- source URL canonicalization, public-link eligibility, publisher extraction, and authority tiers;
- evidence-weighted confidence calculation and confidence labels;
- article/profile/dossier publication and completed-feed eligibility;
- research limits and concurrency constants;
- workflow status normalization, retry backoff, active/terminal state policy, and error redaction.

`@deeptechly/kernel` remains the narrow capability-port layer for identity, workflow dispatch, acquisition, search, and model providers. `@deeptechly/research` owns deterministic DeepTechly research policy. Provider SDKs, environment access, Next.js APIs, Supabase clients, UI components, and server-only imports are forbidden from the extracted package.

## Compatibility strategy

The web modules `entity-resolution.ts`, `source-quality.ts`, `limits.ts`, `orchestration.ts`, `generate.ts`, and `store.ts` delegate to the package while retaining their established exports. Stateful persistence, fetch/model calls, and server-only orchestration remain in web adapters until their capability phases provide replacements.

This seam keeps Phase 10 behavior-preserving while allowing the worker to consume the same rules in later phases. It also prevents confidence and publication policy from drifting between web requests and durable jobs.

## Invariants

- Weak-only evidence cannot cross the low-confidence ceiling regardless of claim volume.
- No official source limits confidence below high confidence; sparse official/strong evidence is capped.
- Public publication requires the existing source threshold, artifact completeness, and confidence floor.
- Completed-feed eligibility retains the established limited-data path and does not lower its confidence floor.
- Provider IDs and SDK payloads never enter entity resolution or research policy.
- Public errors hide credentials, tokens, stack-like content, and authorization material; internal diagnostics are bounded and redacted.
- Source URL cleanup removes tracking parameters but does not fetch or judge truth.

## Verification

`pnpm verify:research-kernel` runs the package directly and covers entity classification, URL normalization, source authority, confidence caps, publication gates, workflow state, retry ceilings, and error redaction. Existing end-to-end research verification continues to exercise the web compatibility façades.

## Deferred without loss

Full evidence extraction, entity-candidate comparison, public-sector recognition, synthesis prompts, persistence, and acquisition remain behaviorally intact in `apps/web`. They will cross the boundary only when their types and provider contracts can move without duplicating logic or weakening existing tests. This is deliberate incremental replacement, not a second implementation.
