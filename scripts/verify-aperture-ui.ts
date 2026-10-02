import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type {
  ApertureOpportunity,
  ApertureProblem,
  ApertureSignal
} from "../packages/aperture/src/index";
import {
  APERTURE_METHODOLOGY_VERSION,
  publicApertureItems
} from "../packages/aperture/src/index";
import { apertureMarkdown } from "../apps/web/lib/aperture/markdown";

const source = {
  title: "Official agency document",
  url: "https://agency.gov/document",
  publisher: "Agency",
  documentType: "solicitation"
};
const agency = {
  slug: "agency",
  name: "Agency",
  abbreviation: "AGY",
  officialDomain: "agency.gov",
  summary: "Official agency intelligence."
};
const signal: ApertureSignal = {
  kind: "signal",
  slug: "verified-signal",
  title: "Verified signal",
  summary: "A source-backed summary.",
  agency,
  signalType: "solicitation",
  confidenceLabel: "MODERATE CONFIDENCE",
  sourceCount: 1,
  agencyAsk: ["Explicit ask"],
  problemStatement: ["Supported problem"],
  evidenceBase: ["Evidence summary"],
  technicalRequirements: ["Supported requirement"],
  repeatedSignals: [],
  relatedCompanies: [],
  relatedPatents: [],
  relatedLabs: [],
  opportunityRead: ["Bounded opportunity read"],
  institutionalRead: ["Private institutional analysis"],
  sources: [source],
  methodologyVersion: APERTURE_METHODOLOGY_VERSION,
  published: true
};
const problem: ApertureProblem = {
  kind: "problem",
  slug: "verified-problem",
  title: "Verified problem",
  summary: "Supported summary.",
  problemText: "Supported operational need.",
  agency,
  confidenceLabel: "MODERATE CONFIDENCE",
  sourceCount: 1,
  evidence: ["Evidence summary"],
  technicalRequirements: [],
  relatedSignalSlugs: [signal.slug],
  sources: [source],
  methodologyVersion: APERTURE_METHODOLOGY_VERSION,
  published: true
};
const opportunity: ApertureOpportunity = {
  kind: "opportunity",
  slug: "verified-opportunity",
  title: "Verified opportunity",
  summary: "Supported summary.",
  confidenceLabel: "LIMITED PUBLIC DATA",
  sourceCount: 1,
  problemStatement: [problem.problemText],
  demandPattern: [],
  requirementMap: [],
  companyMatches: [],
  patentMatches: [],
  labMatches: [],
  opportunityRead: ["Bounded opportunity"],
  sources: [source],
  methodologyVersion: APERTURE_METHODOLOGY_VERSION,
  published: true
};

assert.deepEqual(publicApertureItems([signal]), [signal]);
assert.deepEqual(publicApertureItems([{ ...signal, published: false }]), []);
assert.deepEqual(publicApertureItems([{ ...signal, sources: [] }]), []);

for (const item of [signal, problem, opportunity]) {
  const markdown = apertureMarkdown(item);
  assert.match(markdown, new RegExp(`# ${item.title}`));
  assert.match(markdown, /## Sources/);
  assert.match(markdown, /Official agency document/);
  assert.doesNotMatch(markdown, /Private institutional analysis/);
}

const expectedRoutes = [
  "apps/web/app/aperture/signals/page.tsx",
  "apps/web/app/aperture/signals/[slug]/page.tsx",
  "apps/web/app/aperture/problems/page.tsx",
  "apps/web/app/aperture/problems/[slug]/page.tsx",
  "apps/web/app/aperture/opportunities/page.tsx",
  "apps/web/app/aperture/opportunities/[slug]/page.tsx",
  "apps/web/app/aperture/agencies/page.tsx",
  "apps/web/app/aperture/agencies/[agency]/page.tsx",
  "apps/web/app/aperture/evidence/page.tsx",
  "apps/web/app/aperture/methodology/page.tsx"
];
for (const route of expectedRoutes) assert.ok(readFileSync(route, "utf8").length > 0, route);

const nextConfig = readFileSync("apps/web/next.config.mjs", "utf8");
for (const kind of ["signals", "problems", "opportunities"]) {
  assert.match(nextConfig, new RegExp(`/aperture/${kind}/:slug\\.md`));
}

console.log("Aperture UI verification passed.");
