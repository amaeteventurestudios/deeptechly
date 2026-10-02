import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { join } from "node:path";
import {
  autonomyOpportunity,
  autonomyScalingProblem,
  replicatorSignal
} from "../apps/web/lib/aperture/curated-publications";
import { apertureWorkflowPlan } from "../packages/aperture/src/index";
import { apertureMarkdown } from "../apps/web/lib/aperture/markdown";
import { validateEntityAnchor } from "../apps/web/lib/research/entity-anchor";
import {
  classifyPublicSectorSource,
  extractPublicSectorSignals,
  mapPublicSectorSignalsToClaims
} from "../apps/web/lib/research/public-sector-recognition";
import type { DiscoveryDocument } from "../apps/web/lib/discovery/types";
import {
  calculateEvidenceConfidence,
  classifyEntityInput,
  confidenceLabelForScore,
  isPublicationEligible,
  isPublishableSourceUrl,
  normalizeDomain,
  researchWorkflowPlan
} from "../packages/research/src/index";

type GoldenResult = { case: string; checks: number; outcome: string };
const results: GoldenResult[] = [];

const require = createRequire(import.meta.url);
const moduleLoader = require("node:module") as {
  _resolveFilename: (request: string, parent: unknown, isMain: boolean, options?: unknown) => string;
};
const originalResolveFilename = moduleLoader._resolveFilename;
const serverOnlyStubPath = join(process.cwd(), "scripts/server-only-stub.cjs");
moduleLoader._resolveFilename = function resolveServerOnly(request, parent, isMain, options) {
  if (request === "server-only") return serverOnlyStubPath;
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

function completeCandidate(confidenceScore: number, sourceCount: number) {
  return {
    sourceCount,
    confidenceScore,
    name: "Evidence-backed entity",
    summary: "A bounded summary grounded in reviewed public sources.",
    article: { headline: "Evidence-backed research", dek: "Public evidence and open questions.", sections: [1, 2, 3, 4] },
    dossier: { executiveSummary: ["Evidence-backed summary."] }
  };
}

function verifyEstablishedDefenseCompany() {
  assert.equal(classifyEntityInput("shield.ai"), "domain");
  assert.equal(normalizeDomain("https://www.shield.ai"), "shield.ai");
  const anchor = validateEntityAnchor({
    requestedEntityName: "Shield AI",
    generatedEntityName: "Shield AI",
    generatedSlug: "shield-ai",
    sourcePublishers: ["Shield AI", "U.S. Department of Defense"]
  });
  assert.equal(anchor.ok, true);
  const score = calculateEvidenceConfidence(
    { total: 5, official: 3, strongOrBetter: 4, weak: 0, hasReliableEvidence: true },
    { confirmed: 6, unverified: 1 }
  );
  assert.equal(confidenceLabelForScore(score), "HIGH CONFIDENCE");
  assert.equal(isPublicationEligible(completeCandidate(score, 5)), true);
  results.push({ case: "established defense/deep-tech company", checks: 5, outcome: "identity anchored; high-confidence candidate eligible" });
}

function verifyEarlyStageCompany() {
  assert.equal(classifyEntityInput("Aether Forge"), "company");
  const score = calculateEvidenceConfidence(
    { total: 2, official: 0, strongOrBetter: 1, weak: 1, hasReliableEvidence: false },
    { confirmed: 1, unverified: 5 }
  );
  assert.ok(["LOW CONFIDENCE", "LIMITED PUBLIC DATA"].includes(confidenceLabelForScore(score)));
  assert.equal(isPublicationEligible(completeCandidate(score, 2)), false);
  results.push({ case: "early-stage deep-tech company", checks: 3, outcome: "sparse evidence degrades gracefully and does not publish" });
}

function verifyGovernmentTechnology() {
  assert.equal(classifyEntityInput("NASA SiGe on sapphire technology"), "government_program");
  const valid = validateEntityAnchor({
    requestedEntityName: "NASA SiGe on sapphire",
    generatedEntityName: "NASA SiGe on sapphire",
    generatedSlug: "nasa-sige-on-sapphire",
    sourcePublishers: ["NASA"],
    extractedAliases: ["SiGe on sapphire technology"]
  });
  const collapse = validateEntityAnchor({
    requestedEntityName: "NASA SiGe on sapphire",
    generatedEntityName: "NASA",
    generatedSlug: "nasa",
    sourcePublishers: ["NASA"]
  });
  assert.equal(valid.ok, true);
  assert.equal(collapse.ok, false);
  results.push({ case: "NASA/government technology", checks: 3, outcome: "specific technology retained; agency-name collapse rejected" });
}

function verifyPatent() {
  assert.equal(classifyEntityInput("US 10,123,456 B2 patent"), "patent");
  const signals = extractPublicSectorSignals({
    url: "https://patents.google.com/patent/US10123456B2",
    title: "US Patent 10,123,456 B2"
  });
  const claims = mapPublicSectorSignalsToClaims(signals);
  assert.equal(classifyPublicSectorSource({ url: "https://patents.google.com/patent/US10123456B2" }), "patent");
  assert.ok(claims.includes("patent"));
  assert.ok(!claims.some((claim) => ["patent_assignee", "patent_exclusivity", "patent_license_available"].includes(claim)));
  results.push({ case: "patent", checks: 4, outcome: "recognized as patent evidence without ownership/license inference" });
}

function verifyObscureEntity() {
  assert.equal(classifyEntityInput("Obscure Cryogenic Systems"), "company");
  const score = calculateEvidenceConfidence(
    { total: 1, official: 0, strongOrBetter: 0, weak: 1, hasReliableEvidence: false },
    { confirmed: 0, unverified: 6 }
  );
  assert.equal(confidenceLabelForScore(score), "LOW CONFIDENCE");
  assert.equal(isPublicationEligible(completeCandidate(score, 1)), false);
  assert.equal(isPublishableSourceUrl("https://example.com/unverified"), false);
  results.push({ case: "obscure limited-public-data entity", checks: 4, outcome: "low confidence, placeholder rejected, publication withheld" });
}

function verifyGovernmentDemandSignal() {
  for (const item of [replicatorSignal, autonomyScalingProblem, autonomyOpportunity]) {
    assert.equal(item.published, true);
    assert.ok(item.sources.length >= 2);
    assert.ok(item.sources.every((source) => source.url.startsWith("https://") && !source.url.includes("example.com")));
    const markdown = apertureMarkdown(item);
    assert.match(markdown, /## Sources/);
    assert.doesNotMatch(markdown, /Private institutional analysis/);
  }
  assert.equal(apertureWorkflowPlan[0], "acquiring_government_documents");
  assert.equal(apertureWorkflowPlan.at(-1), "reviewing_publication_eligibility");
  results.push({ case: "government procurement/research signal", checks: 17, outcome: "official provenance, bounded inference, public Markdown, reviewed workflow" });
}

async function verifyDiscoveryAndWorkflow() {
  const { searchLocally } = await import("../apps/web/lib/discovery/search");
  const documents: DiscoveryDocument[] = [
    {
      id: "entity:shield-ai",
      kind: "entity",
      title: "Shield AI",
      slug: "shield-ai",
      summary: "Autonomous defense systems research profile.",
      href: "/startup/shield-ai",
      sector: "Defense",
      published: true
    },
    {
      id: `signal:${replicatorSignal.slug}`,
      kind: "signal",
      title: replicatorSignal.title,
      slug: replicatorSignal.slug,
      summary: replicatorSignal.summary,
      href: `/aperture/signals/${replicatorSignal.slug}`,
      sector: "Defense",
      published: true
    }
  ];
  assert.equal(searchLocally(documents, "attritable autonomy")[0]?.kind, "signal");
  const stages = researchWorkflowPlan.map((step) => step.stage);
  assert.ok(stages.indexOf("verifying_claims") < stages.indexOf("drafting_outputs"));
  assert.ok(stages.indexOf("drafting_outputs") < stages.indexOf("publishing_article"));
  assert.equal(stages.at(-1), "done");
  results.push({ case: "persistence/publication/discovery workflow", checks: 4, outcome: "verification precedes synthesis; published artifacts are searchable" });
}

async function main() {
  verifyEstablishedDefenseCompany();
  verifyEarlyStageCompany();
  verifyGovernmentTechnology();
  verifyPatent();
  verifyObscureEntity();
  verifyGovernmentDemandSignal();
  await verifyDiscoveryAndWorkflow();

  const checks = results.reduce((sum, result) => sum + result.checks, 0);
  console.log(`Golden-path verification passed: ${results.length} cases, ${checks} checks.`);
  for (const result of results) console.log(`- ${result.case}: ${result.outcome}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
