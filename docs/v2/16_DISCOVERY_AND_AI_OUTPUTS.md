# Discovery and AI-Readable Outputs

Phase 18 completes the public discovery surface without exposing institutional-only data.

## Editorial archives and Explore

Articles, profiles, patent source briefs, sectors, and Aperture artifacts remain editorial public pages rather than admin tables. Explore searches one normalized public document set and supports stable type filters for articles, entities, patents, labs, technologies, signals, problems, and opportunities. PostgreSQL remains authoritative; Meilisearch is a derived, optional accelerator.

## Patent source briefs

The patent archive now links to stable internal `/patent/[slug]` briefs and matching `.md` routes. Slugs are deterministic hashes of normalized public source URLs, so no patent ownership or identifier is fabricated. Each brief carries:

- the original public source;
- related entity and sector context;
- confidence inherited from the reviewed entity file;
- an explicit boundary stating that a source alone does not prove ownership, assignment, exclusivity, licensing, readiness, or traction;
- a link back to the public entity profile.

These are deliberately named patent source briefs. A generic patent-search URL is not represented as a confirmed patent grant.

## Machine-readable discovery

The sitemap now includes every eligible article, profile, public dossier, patent source brief, Aperture signal, Aperture problem, Aperture opportunity, agency page, archive, and matching Markdown route. `llms.txt` and `llms-full.txt` publish live artifact indexes and interpretation guidance. `robots.txt` explicitly permits public research surfaces while continuing to exclude admin, account, dashboard, research-job, and API paths.

Markdown routes are built from the same publication-filtered records as their HTML pages. They do not serialize account data, admin review state, private traces, or gated institutional sections.

## SEO and structured metadata

Public articles, profiles, dossiers, patent source briefs, and Aperture briefs emit canonical metadata and JSON-LD with their public URL, description, publisher, subject, dates where available, and source citations. Dynamic search query variants canonicalize to `/explore`.

## Verification

`pnpm verify:public-discovery` checks patent Markdown safety language, rewrites, sitemap coverage, LLM guide coverage, and structured-data support. Playwright verifies live patent HTML/Markdown, sitemap entries, LLM indexes, Aperture routes, and responsive public layouts.
