# Golden-Path Validation

Phase 21 validates the V2 policy and delivery path across seven representative cases. The checks use deterministic fixtures and public curated artifacts; they do not make live provider calls or mutate a database.

| Case | Identity and evidence expectation | Expected outcome |
|---|---|---|
| Established defense/deep-tech company | Exact official-domain/name anchor, multiple official/strong sources | High-confidence candidate may publish when complete. |
| Early-stage deep-tech company | Sparse evidence with unresolved claims | Confidence degrades; incomplete evidence does not publish. |
| NASA/government technology | Preserve the specific technology, not the source agency as the entity | Specific anchor passes; collapse to “NASA” fails. |
| Patent | Recognize patent identifier/source family | Technical/patent relevance only; no ownership, exclusivity, or license inference. |
| Obscure entity | One weak source and unresolved claims | Low confidence; placeholder source rejected; publication withheld. |
| Government demand signal | Multiple official DoD/DIU/DIB documents | Evidence-backed Aperture family, bounded opportunity inference, public Markdown. |
| End-to-end policy chain | Verification before synthesis/publication; public indexing only | Published artifact is discoverable and workflow ordering remains safe. |

## Cross-cutting validation

The standard suite additionally validates queue state and recovery, compatibility persistence, additive migrations, source classification/ranking, entity-anchor protection, claim safety, admin review, publication eligibility, auth adapters, entitlement gating, provider adapters, content redaction, search-index reconciliation, public Markdown, sitemap/robots/LLM routes, and institutional-content exclusion.

Playwright exercises 20 production-rendered scenarios at 320, 375, 390, 430, 768, 1024, 1280, and 1440+ widths. It covers the homepage, archives, Explore, Aperture, queue, article, profile, dossier, patent brief, Markdown, sitemap, LLM guides, keyboard navigation, mobile navigation, 404 handling, callback fail-closed behavior, security headers, health output, and signed-out institutional gating.

The final production dependency audit initially identified patched upstream advisories in the pinned Next.js and WebSocket graph. Next.js and its lint config were upgraded from 16.2.6 to 16.3.8, PostCSS to 8.5.28, and the compatible transitive `ws` release was constrained to 8.21.0. The complete suite was rerun after the upgrade; `pnpm audit --prod` then reported no known vulnerabilities.

## External-system boundary

Live golden paths for Appwrite, PostgreSQL import, Trigger.dev, Crawl4AI, Directus, Meilisearch, Langfuse, Valkey, S3, Lago, and Stripe cannot be truthfully claimed without approved credentials/endpoints and an authorized migration. Each is isolated behind a tested adapter with a local or compatibility path, and the exact activation blocker is recorded in `BLOCKERS.md`.

The compatibility public dataset includes inherited demonstration fixtures so a credential-free checkout remains visually reviewable. Placeholder URLs are excluded from public source bibliographies and Markdown. These fixtures are not a substitute for a reconciled PostgreSQL publication corpus and must be disabled or replaced at production data cutover.
