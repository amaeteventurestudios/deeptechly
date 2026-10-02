# Aperture UI Foundation

Phase 16 makes Aperture a first-class product line inside DeepTechly without publishing synthetic government findings.

## Routes

The public route family is complete:

- `/aperture`
- `/aperture/signals`
- `/aperture/signals/[slug]`
- `/aperture/signals/[slug].md`
- `/aperture/problems`
- `/aperture/problems/[slug]`
- `/aperture/problems/[slug].md`
- `/aperture/opportunities`
- `/aperture/opportunities/[slug]`
- `/aperture/opportunities/[slug].md`
- `/aperture/agencies`
- `/aperture/agencies/[agency]`
- `/aperture/evidence`
- `/aperture/methodology`

Every index shares a dedicated Aperture sub-navigation. The landing page defines the product promise and explains the Acquire → Extract → Detect → Map flow. Archives use editorial cards and evidence-aware empty states rather than administrative tables.

## Brief contracts

`@deeptechly/aperture` now owns provider-neutral public types for:

- agencies;
- signals;
- problem statements;
- opportunity maps;
- public sources and confidence labels.

The signal brief supports the agency ask, underlying problem, evidence base, framework context, technical requirements, repeated signals, related companies/patents/labs, opportunity read, sources, and confidence. Problem and opportunity briefs use the same evidence-first presentation. Empty optional sections are omitted.

## Publication safety

The public selector requires both `published: true` and at least one source. Dynamic routes and Markdown return 404 for unpublished or missing records. Markdown is assembled only from the public contract and omits the optional institutional-read field.

Phase 16 intentionally ships an empty repository adapter because no evidence-backed Aperture findings exist in the current production store. This is preferable to presenting synthetic solicitations, agencies, or demand patterns as intelligence. Phase 17 connects acquisition, extraction, detection, matching, persistence, and review workflows to this surface.

## Methodology

The public methodology distinguishes:

1. discovery from evidence;
2. explicit agency asks from analyst interpretation;
3. operational problems from proposed solutions;
4. repeated demand from repeated vocabulary;
5. supported requirements from broad policy goals;
6. capability relevance from readiness or procurement probability;
7. confidence from certainty;
8. candidate findings from publication-eligible intelligence.

Known limitations are visible, including non-public demand, policy-language reuse, the non-endorsement nature of matches, and changing official program details.

## Search readiness

The Phase 15 discovery builder already consumes published Aperture signals, problems, and opportunities. When Phase 17 supplies eligible records, they enter Explore without a second search implementation.

## Verification

- `pnpm verify:aperture-ui` covers publication filtering, all route artifacts, markdown source inclusion, and exclusion of institutional analysis.
- Playwright covers the complete route family at 320px, tablet, and desktop widths, plus not-found behavior for unpublished HTML and Markdown artifacts.
