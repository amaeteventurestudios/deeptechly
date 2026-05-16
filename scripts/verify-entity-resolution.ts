import type { ResearchEntity } from "@/lib/types";
import {
  buildEntityCandidates,
  classifyEntityInput,
  compareEntityCandidates,
  createCanonicalSlug,
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

console.log("Entity resolution verification passed.");
