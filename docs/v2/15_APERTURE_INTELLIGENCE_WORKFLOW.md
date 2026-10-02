# Aperture Intelligence Workflow

Phase 17 adds the proprietary government-demand analysis kernel, a durable execution boundary, and the first public evidence-backed Aperture artifact family.

## Deterministic workflow

`@deeptechly/aperture` owns a bounded stage plan:

1. acquire government documents;
2. read solicitations and official material;
3. extract the agency ask;
4. derive problem statements;
5. retrieve supporting evidence;
6. detect repeated demand;
7. map technical requirements;
8. match companies, patents, labs, and technologies;
9. calculate confidence;
10. assemble an evidence pack;
11. review publication eligibility.

This is one controlled workflow, not a collection of autonomous agents.

## Intelligence modules

The package implements provider-free modules for:

- HTTPS document normalization and URL deduplication;
- sentence-level candidate ask/problem/requirement extraction with document provenance;
- requirement classification across performance, deployment, integration, production, and general needs;
- repeated-demand clustering that requires similar requirements in different documents;
- evidence-required capability matching with explicit match scores and non-endorsement rationale;
- confidence derived from official-source coverage, publisher diversity, extracted asks/problems/requirements, and repetition;
- publication eligibility requiring two official documents, an explicit ask, evidence-linked problem, requirement, and non-low confidence.

The extraction rules create candidates for review; they do not convert matched words into verified truth. `CONFIRMED` means the sentence is explicit in the supplied document, while derived problem statements remain `INFERRED`.

## Durable execution

The worker registers the Trigger.dev task `aperture-demand-intelligence` with:

- concurrency limit 2;
- ten-minute maximum duration;
- three bounded attempts with exponential backoff;
- at most 50 source documents;
- at most 50,000 characters per document;
- at most 200 capability targets;
- HTTPS-only source URLs.

The task returns a candidate analysis. It does not publish automatically. A reviewed persistence command must write normalized PostgreSQL records and publication state, after which the existing search outbox can index them.

## Initial public intelligence family

The first curated family documents repeated DoD demand for scalable attritable autonomy. It includes:

- signal: `scalable-attritable-autonomy`;
- problem: `autonomy-at-operational-scale`;
- opportunity: `attritable-autonomy-enablers`;
- agency page: `department-of-defense`;
- evidence pack: `replicator-attritable-autonomy`.

The family uses five official public sources from the U.S. Department of Defense, Defense Innovation Unit, and Defense Innovation Board, dated 2023–2025:

- [DoD Replicator remarks](https://www.defense.gov/News/News-Stories/Article/Article/3518827/hicks-discusses-replicator-initiative/)
- [DIU implementation update](https://www.diu.mil/latest/implementing-the-department-of-defense-replicator-initiative-to-accelerate)
- [DoD first-tranche release](https://www.defense.gov/News/Releases/Release/Article/3765644/deputy-secretary-of-defense-hicks-announces-first-tranche-of-replicator-capabil/)
- [DoD additional-capabilities release](https://www.defense.gov/News/Releases/Release/Article/3963289/deputy-secretary-of-defense-kathleen-hicks-announces-additional-replicator-all/)
- [Defense Innovation Board unmanned-systems report](https://innovation.defense.gov/Portals/63/DIB%20A%20Pathway%20to%20Scaling%20Unmanned%20Weapon%20Systems_250113%20PUBLISHED.pdf)

Company names appear only where official releases named selected or prototype efforts. The public copy explicitly avoids treating a named company as evidence of future awards, readiness, or procurement probability.

## Persistence boundary

Migration `0002_v2_aperture.sql` already contains agencies, government documents, signals, problems, requirements, repeated-demand clusters, opportunity maps, evidence packs, and capability matches. The live PostgreSQL repository remains blocked because no authorized target or reconciled import is available. The curated publication adapter keeps the evidence-backed launch artifact available without writing production data.

## Verification

`pnpm verify:aperture-intelligence` covers extraction, repeated demand, evidence-required matching, confidence, publication rejection for insufficient evidence, workflow ordering, task bounds, and the prohibition on placeholder sources. Playwright covers every public artifact and its Markdown source bibliography.
