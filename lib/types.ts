export type ConfidenceLabel =
  | "High"
  | "Moderate"
  | "Limited"
  | "Unverified";

export type SourceType =
  | "Company Website"
  | "Patent"
  | "Research Paper"
  | "Government Source"
  | "News"
  | "Filing"
  | "Job Post"
  | "Social Signal"
  | "Other";

export type ExternalLink = {
  label: string;
  href: string;
};

export type Source = {
  title: string;
  url: string;
  publisher?: string;
  date?: string;
  type: SourceType;
};

export type TaxonomySnapshot = {
  entityType: string;
  primarySector: string;
  secondarySectors: string[];
  technologyLayer: string;
  businessModel: string;
  customerType: string;
  deploymentEnvironment: string;
  capitalIntensity: string;
  regulatoryExposure: string;
  governmentRelevance: string;
};

export type Scenario = {
  title: string;
  whatHappens: string;
  whatMustBeTrue: string;
  keyRisk: string;
  investorRead: string;
};

export type RevenuePath = {
  path: string;
  whatMustBeTrue: string;
  marginPotential: string;
  timeHorizon: string;
  risk: string;
};

export type CompetitiveLandscapeItem = {
  companyOrApproach: string;
  category: string;
  strength: string;
  constraint: string;
  relevance: string;
};

export type ArticleSection = {
  title: string;
  body: string[];
};

export type ComparisonTableData = {
  columns: [string, string, string];
  rows: [string, string, string][];
};

export type Article = {
  headline: string;
  dek: string;
  visualLabel: string;
  visualCaption: string;
  sections: ArticleSection[];
  comparisonTable: ComparisonTableData;
};

export type Snapshot = {
  entityType: string;
  primarySector: string;
  secondarySectors: string[];
  region: string;
  stage: string;
  sourceCount: number;
  confidence: ConfidenceLabel;
  researchStatus: string;
};

export type Dossier = {
  executiveSummary: string[];
  taxonomySnapshot: TaxonomySnapshot;
  companyOverview: string[];
  productAndTechnology: string[];
  productTechnologyFacts: {
    coreSystem: string;
    primaryTechnicalAdvantage: string;
    keyDependencies: string;
    validationNeeded: string;
    deploymentEnvironment: string;
  };
  marketResearch: string[];
  customerSegments: {
    customerSegment: string;
    need: string;
    adoptionConstraint: string;
  }[];
  dataSnapshot: {
    sourceCount: number;
    confidenceScore: number;
    trl: number;
    mrl: number;
    riskScore: number;
    sectorActivity: number;
  };
  accuracyAndConfidence: {
    label: ConfidenceLabel;
    confirmed: string[];
    inferred: string[];
    unverified: string[];
  };
  competitiveLandscape: CompetitiveLandscapeItem[];
  companyPositioning: {
    whereItCompetes: string;
    whereItMayDifferentiate: string;
    whereItIsExposed: string;
    likelyBuyer: string;
    strategicWedge: string;
  };
  opportunity: {
    commercial: string[];
    government: string[];
    technical: string[];
    partnerships: string[];
  };
  scenarios: Scenario[];
  investorRead: string[];
  foundersAndTeam: string[];
  seniorTeam: string[];
  teamSignalForInvestors: string[];
  cultureAndTeamHealth: string[];
  hiringSignal: string[];
  tractionAndMetrics: string[];
  socialAndPRSignal: string[];
  revenueAndUnitEconomics: RevenuePath[];
  bestCaseScenario: string[];
  baseCaseScenario: string[];
  downsideScenario: string[];
  risksAndConstraints: string[];
  strategicOutlook: string[];
  sources: Source[];
  relatedResearch: {
    slug: string;
    name: string;
    sector: string;
    summary: string;
  }[];
};

export type ResearchEntity = {
  slug: string;
  name: string;
  entityType: string;
  sector: string;
  secondarySectors: string[];
  region: string;
  stage: string;
  summary: string;
  description: string;
  tags: string[];
  sourceCount: number;
  confidenceScore: number;
  confidenceLabel: ConfidenceLabel;
  lastResearchedAt: string;
  externalLinks: ExternalLink[];
  snapshot: Snapshot;
  taxonomy: TaxonomySnapshot;
  article: Article;
  dossier: Dossier;
  sources: Source[];
  relatedEntities: string[];
};
