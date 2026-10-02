import assert from "node:assert/strict";
import {
  calculateEvidenceConfidence,
  classifyEntityInput,
  computeRetryDelay,
  confidenceLabelForScore,
  createCanonicalSlug,
  isActiveResearchStatus,
  isCompletedFeedEligible,
  isPublicationEligible,
  isPublishableSourceUrl,
  normalizeDomain,
  normalizeEntityName,
  normalizeResearchStatus,
  normalizeSourceUrl,
  qualityForSourceType,
  redactInternalFailure,
  safePublicErrorMessage
} from "../packages/research/src/index";

assert.equal(normalizeDomain("https://www.Example.com/path"), "example.com");
assert.equal(normalizeEntityName("Acme Technologies, Inc."), "acme");
assert.equal(classifyEntityInput("US 1234567 B2 patent"), "patent");
assert.equal(classifyEntityInput("DARPA NOM4D program"), "government_program");
assert.equal(classifyEntityInput("NASA SiGe on sapphire technology"), "government_program");
assert.equal(createCanonicalSlug("Acme Technologies, Inc."), "acme");

assert.equal(
  normalizeSourceUrl("http://WWW.Example.edu/path/?utm_source=x&b=2&a=1#section"),
  "https://example.edu/path?a=1&b=2"
);
assert.equal(isPublishableSourceUrl("https://example.com/report"), false);
assert.equal(isPublishableSourceUrl("https://www.nasa.gov/report"), true);
assert.equal(qualityForSourceType("government"), "official");
assert.equal(qualityForSourceType("news"), "moderate");

const weakConfidence = calculateEvidenceConfidence(
  { total: 4, official: 0, strongOrBetter: 0, weak: 4, hasReliableEvidence: false },
  { confirmed: 8, unverified: 0 }
);
assert.equal(weakConfidence, 34, "Weak-only evidence remains capped below publication confidence");
assert.equal(confidenceLabelForScore(weakConfidence), "LOW CONFIDENCE");

const candidate = {
  sourceCount: 3,
  confidenceScore: 68,
  name: "Acme",
  summary: "Evidence-backed summary",
  article: { headline: "Acme research", dek: "Technical read", sections: [{}, {}, {}, {}] },
  dossier: { executiveSummary: ["Supported summary"] }
};
assert.equal(isPublicationEligible(candidate), true);
assert.equal(isCompletedFeedEligible(candidate), true);
assert.equal(isPublicationEligible({ ...candidate, sourceCount: 2 }), false);

assert.equal(normalizeResearchStatus("completed"), "done");
assert.equal(isActiveResearchStatus("public_research_ready"), true);
assert.equal(computeRetryDelay(20), 15 * 60 * 1000);
assert.equal(
  safePublicErrorMessage("Authorization: Bearer secret", "Research failed."),
  "Research failed."
);
assert.ok(!redactInternalFailure("Authorization=secret sk-example").includes("secret"));

console.log("Research kernel verification passed.");
