import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  analyzeGovernmentDemand,
  apertureWorkflowPlan,
  APERTURE_METHODOLOGY_VERSION,
  type ApertureAnalysisInput
} from "../packages/aperture/src/index";

const input: ApertureAnalysisInput = {
  methodologyVersion: APERTURE_METHODOLOGY_VERSION,
  documents: [
    {
      id: "doc_1",
      title: "Official request one",
      url: "https://agency.gov/request-one",
      publisher: "Agency",
      agency: "Agency",
      documentType: "solicitation",
      official: true,
      text: "The department seeks affordable autonomous systems that can operate across multiple domains and scale production rapidly. The challenge is fielding sufficient capability without long maintenance tails."
    },
    {
      id: "doc_2",
      title: "Official request two",
      url: "https://program.agency.gov/request-two",
      publisher: "Agency Program Office",
      agency: "Agency",
      documentType: "strategy",
      official: true,
      text: "The program requires low-cost autonomous systems able to operate across domains and deliver scalable production. The operational need is resilient deployment in disrupted environments."
    }
  ],
  targets: [
    {
      id: "technology_1",
      type: "technology",
      name: "Resilient autonomy stack",
      summary: "Low-cost autonomous systems with resilient deployment, multi-domain operation, and scalable production integration.",
      evidenceIds: ["evidence_1"]
    },
    {
      id: "entity_without_evidence",
      type: "entity",
      name: "Unsupported vendor",
      summary: "Autonomous systems",
      evidenceIds: []
    }
  ]
};

const analysis = analyzeGovernmentDemand(input);
assert.ok(analysis.agencyAsks.length >= 2);
assert.ok(analysis.problemStatements.length >= 2);
assert.ok(analysis.requirements.length >= 2);
assert.ok(analysis.repeatedDemand.length >= 1);
assert.equal(analysis.matches.length, 1);
assert.equal(analysis.matches[0]?.name, "Resilient autonomy stack");
assert.equal(analysis.publicationEligible, true);
assert.ok(["HIGH CONFIDENCE", "MODERATE CONFIDENCE"].includes(analysis.confidenceLabel));
assert.equal(analysis.sources.length, 2);

const insufficient = analyzeGovernmentDemand({ ...input, documents: [input.documents[0]!] });
assert.equal(insufficient.publicationEligible, false);
assert.ok(insufficient.publicationReasons.some((reason) => /two official/i.test(reason)));

assert.equal(apertureWorkflowPlan[0], "acquiring_government_documents");
assert.equal(apertureWorkflowPlan.at(-1), "reviewing_publication_eligibility");
assert.ok(apertureWorkflowPlan.indexOf("detecting_repeated_demand") < apertureWorkflowPlan.indexOf("matching_companies_patents_labs"));

const taskSource = readFileSync("apps/worker/src/trigger/aperture.ts", "utf8");
assert.match(taskSource, /id: "aperture-demand-intelligence"/);
assert.match(taskSource, /concurrencyLimit: 2/);
assert.match(taskSource, /maxAttempts: 3/);
assert.match(taskSource, /documents\.length > 50/);
assert.match(taskSource, /document\.text\.length > 50_000/);

const curatedSource = readFileSync("apps/web/lib/aperture/curated-publications.ts", "utf8");
assert.match(curatedSource, /defense\.gov/);
assert.match(curatedSource, /diu\.mil/);
assert.doesNotMatch(curatedSource, /example\.com/);

console.log("Aperture intelligence verification passed.");
