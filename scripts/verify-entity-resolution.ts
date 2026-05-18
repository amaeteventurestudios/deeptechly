import type { ResearchEntity } from "@/lib/types";
import {
  buildEntityCandidates,
  classifyEntityInput,
  compareEntityCandidates,
  createCanonicalSlug,
  createCollisionSafeSlug,
  normalizeDomain,
  normalizeEntityName
} from "@/lib/research/entity-resolution";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function entityFixture(overrides: Partial<ResearchEntity>): ResearchEntity {
  return {
    id: "entity_fixture",
    slug: "anduril",
    name: "Anduril Industries",
    entityType: "Company",
    domain: "anduril.com",
    website: "https://anduril.com",
    sector: "Defense",
    secondarySectors: ["Autonomy"],
    region: "United States",
    stage: "Generated research",
    summary: "Defense technology company.",
    description: "Fixture entity.",
    tags: ["Defense"],
    sourceCount: 1,
    confidenceScore: 80,
    confidenceLabel: "HIGH CONFIDENCE",
    lastResearchedAt: "just now",
    externalLinks: [],
    snapshot: {
      entityType: "Company",
      primarySector: "Defense",
      secondarySectors: ["Autonomy"],
      region: "United States",
      stage: "Generated research",
      sourceCount: 1,
      confidence: "HIGH CONFIDENCE",
      researchStatus: "Fixture"
    },
    taxonomy: {
      entityType: "Company",
      primarySector: "Defense",
      secondarySectors: ["Autonomy"],
      technologyLayer: "Autonomy",
      businessModel: "Not confirmed",
      customerType: "Government",
      deploymentEnvironment: "Defense",
      capitalIntensity: "High",
      regulatoryExposure: "High",
      governmentRelevance: "High"
    },
    article: {
      headline: "Fixture",
      dek: "Fixture",
      visualLabel: "DEFENSE",
      visualCaption: "Fixture",
      sections: [],
      comparisonTable: {
        columns: ["Technology Layer", "Public Signal", "Constraint"],
        rows: []
      }
    },
    dossier: {
      executiveSummary: [],
      taxonomySnapshot: {
        entityType: "Company",
        primarySector: "Defense",
        secondarySectors: ["Autonomy"],
        technologyLayer: "Autonomy",
        businessModel: "Not confirmed",
        customerType: "Government",
        deploymentEnvironment: "Defense",
        capitalIntensity: "High",
        regulatoryExposure: "High",
        governmentRelevance: "High"
      },
      companyOverview: [],
      productAndTechnology: [],
      productTechnologyFacts: {
        coreSystem: "Autonomy",
        primaryTechnicalAdvantage: "Not confirmed",
        keyDependencies: "Not confirmed",
        validationNeeded: "Not confirmed",
        deploymentEnvironment: "Defense"
      },
      marketResearch: [],
      customerSegments: [],
      dataSnapshot: {
        sourceCount: 1,
        confidenceScore: 80,
        trl: 5,
        mrl: 5,
        riskScore: 40,
        sectorActivity: 70
      },
      accuracyAndConfidence: {
        label: "HIGH CONFIDENCE",
        confirmed: [],
        inferred: [],
        unverified: []
      },
      competitiveLandscape: [],
      companyPositioning: {
        whereItCompetes: "Defense",
        whereItMayDifferentiate: "Autonomy",
        whereItIsExposed: "Validation",
        likelyBuyer: "Government",
        strategicWedge: "Autonomy"
      },
      opportunity: {
        commercial: [],
        government: [],
        technical: [],
        partnerships: []
      },
      scenarios: [],
      investorRead: [],
      foundersAndTeam: [],
      seniorTeam: [],
      teamSignalForInvestors: [],
      cultureAndTeamHealth: [],
      hiringSignal: [],
      tractionAndMetrics: [],
      socialAndPRSignal: [],
      revenueAndUnitEconomics: [],
      bestCaseScenario: [],
      baseCaseScenario: [],
      downsideScenario: [],
      risksAndConstraints: [],
      strategicOutlook: [],
      sources: [],
      relatedResearch: []
    },
    sources: [
      {
        title: "Anduril",
        url: "https://www.anduril.com/",
        type: "company_site"
      }
    ],
    relatedEntities: [],
    ...overrides
  };
}

assert(normalizeEntityName("Anduril Industries, Inc.") === "anduril", "normalizes company suffixes");
assert(normalizeDomain("https://www.anduril.com/path?x=1") === "anduril.com", "normalizes domains");
assert(classifyEntityInput("anduril.com") === "domain", "classifies domains");
assert(classifyEntityInput("US 20240123456 patent") === "patent", "classifies patents");
assert(classifyEntityInput("DARPA NOM4D program") === "government_program", "classifies programs");
assert(createCanonicalSlug("LatticeArc Robotics") === "latticearc-robotics", "creates stable slugs");
assert(createCanonicalSlug("DARPA NOM4D program", "government_program") === "darpa-nom4d-program", "keeps program slugs stable");

const existingCompany = entityFixture({});
const domainCandidate = buildEntityCandidates({
  input: "https://www.anduril.com/",
  name: "Anduril",
  domain: "anduril.com",
  sources: [{ title: "Official", url: "https://anduril.com", type: "company_site" }]
});
assert(
  compareEntityCandidates(existingCompany, domainCandidate).confidence === "high",
  "reuses same company by domain"
);

const patentCandidate = buildEntityCandidates({
  input: "Anduril patent US 20240123456",
  name: "Anduril patent US 20240123456",
  sources: [{ title: "Patent", url: "https://patents.google.com/patent/US20240123456A1", type: "patent" }]
});
assert(
  compareEntityCandidates(existingCompany, patentCandidate).confidence !== "high",
  "does not merge patent into company"
);

const punctuationCandidate = buildEntityCandidates({
  input: "ANDURIL INDUSTRIES, INC.",
  name: "Anduril Industries, Inc.",
  sources: [{ title: "Official", url: "https://www.anduril.com/about", type: "company_site" }]
});
assert(
  compareEntityCandidates(existingCompany, punctuationCandidate).confidence === "high",
  "matches punctuation, case, and company suffix variants"
);

const programCandidate = buildEntityCandidates({
  input: "DARPA NOM4D program",
  name: "DARPA NOM4D program",
  sources: [{ title: "DARPA NOM4D", url: "https://www.darpa.mil/program/nom4d", type: "government" }]
});
assert(
  compareEntityCandidates(existingCompany, programCandidate).confidence !== "high",
  "does not merge government program input into company"
);

const conflictingDomainCandidate = buildEntityCandidates({
  input: "Anduril",
  name: "Anduril",
  domain: "anduril-example.com",
  sources: [{ title: "Weak mention", url: "https://example.com/anduril", type: "unknown" }]
});
assert(
  compareEntityCandidates(existingCompany, conflictingDomainCandidate).confidence !== "high",
  "keeps ambiguous same-name conflicting-domain matches below high confidence"
);

const collisionPatentCandidate = buildEntityCandidates({
  input: "US 20240123456 patent",
  name: "Anduril",
  sources: [{ title: "Patent", url: "https://patents.google.com/patent/US20240123456A1", type: "patent" }]
});
assert(
  createCollisionSafeSlug(collisionPatentCandidate, [existingCompany]) === "anduril-patent",
  "adds deterministic collision suffix for non-reused patent entity"
);

console.log("Entity resolution verification passed.");
