import type {
  Article,
  ConfidenceLabel,
  Dossier,
  ExternalLink,
  ResearchEntity,
  Source,
  TaxonomySnapshot
} from "./types";
import {
  inferRegionTag,
  inferStageTag,
  selectDeeptechlyAgent,
  storySectorTags
} from "./story-metadata";

type EntityInput = {
  slug: string;
  name: string;
  sector: string;
  secondarySectors: string[];
  region: string;
  stage: string;
  descriptor: string;
  wedge: string;
  market: string;
  buyer: string;
  deployment: string;
  risk: string;
  confidenceScore: number;
  confidenceLabel: ConfidenceLabel;
  sourceCount: number;
  lastResearchedAt: string;
};

const externalLinks = (slug: string): ExternalLink[] => [
  { label: "WEBSITE", href: `https://example.com/${slug}` },
  { label: "PATENTS", href: `https://patents.google.com/?q=${slug}` },
  { label: "PAPERS", href: `https://scholar.google.com/scholar?q=${slug}` },
  { label: "SBIR", href: `https://www.sbir.gov/search?term=${slug}` },
  { label: "NASA TECH", href: "https://technology.nasa.gov/" },
  { label: "DARPA", href: "https://www.darpa.mil/" },
  { label: "CAREERS", href: `https://example.com/${slug}/careers` },
  { label: "NEWS", href: `https://example.com/${slug}/news` }
];

const sourcesFor = (entity: EntityInput): Source[] => [
  {
    title: `${entity.name} company website`,
    publisher: "Company website",
    date: "2026-05-10",
    url: `https://example.com/${entity.slug}`,
    type: "company_site"
  },
  {
    title: `${entity.name} public patent search`,
    publisher: "Patent database",
    date: "2026-05-10",
    url: `https://patents.google.com/?q=${entity.slug}`,
    type: "patent"
  },
  {
    title: `${entity.sector} technical literature scan`,
    publisher: "Research index",
    date: "2026-05-10",
    url: `https://scholar.google.com/scholar?q=${encodeURIComponent(entity.sector + " " + entity.wedge)}`,
    type: "academic"
  },
  {
    title: `${entity.secondarySectors[0]} program database search`,
    publisher: "Government source",
    date: "2026-05-10",
    url: "https://www.sbir.gov/",
    type: "government"
  },
  {
    title: `${entity.name} market and hiring signal review`,
    publisher: "DeepTechly mock source index",
    date: "2026-05-10",
    url: `https://example.com/${entity.slug}/signals`,
    type: "unknown"
  }
];

const taxonomyFor = (entity: EntityInput): TaxonomySnapshot => ({
  entityType: "Company",
  primarySector: entity.sector,
  secondarySectors: entity.secondarySectors,
  technologyLayer: entity.wedge,
  businessModel:
    "Component supply, licensing, systems integration, or strategic manufacturing partnership",
  customerType: entity.buyer,
  deploymentEnvironment: entity.deployment,
  capitalIntensity: "High",
  regulatoryExposure: entity.secondarySectors.includes("Defense")
    ? "Moderate to high"
    : "Moderate",
  governmentRelevance: entity.secondarySectors.includes("Defense")
    ? "High"
    : "Medium to high"
});

const articleFor = (entity: EntityInput): Article => {
  const sectorTags = storySectorTags({
    sector: entity.sector,
    secondarySectors: entity.secondarySectors,
    tags: [entity.sector, ...entity.secondarySectors]
  });
  const stageTag = inferStageTag({
    stage: entity.stage,
    trl: entity.confidenceScore >= 72 ? 6 : 5,
    mrl: entity.confidenceScore >= 72 ? 4 : 3
  });
  const regionTag = inferRegionTag(entity.region);
  const authorPersona = selectDeeptechlyAgent(entity.sector, [
    ...sectorTags,
    entity.wedge,
    entity.market
  ]);

  return {
    headline: `${entity.name}'s ${entity.wedge} Targets Deep-Tech Bottlenecks`,
    dek: `${entity.descriptor} DeepTechly's public read focuses on technical readiness, market pressure, and the evidence still needed before the company can be treated as institutional-grade infrastructure.`,
    authorPersona,
    publishedAt: "2026-05-10T12:00:00.000Z",
    sectorTags,
    stageTag,
    regionTag,
    entityTypeTag: "Company",
    visualLabel: entity.sector.toUpperCase(),
    visualCaption: `${entity.name} technical signal map`,
    sections: [
    {
      title: "Why it matters",
      body: [
        `${entity.name} matters because ${entity.market.toLowerCase()} is moving from experimental interest into procurement and qualification pressure. Buyers in ${entity.buyer.toLowerCase()} are no longer only asking whether the technology can work; they are asking whether it can survive real operating environments, repeat production, and audit-grade sourcing.`,
        `The public signal is still early, but the category is consequential. If ${entity.name} can convert its technical claim into validated hardware, software, or production capacity, it could sit inside a supply chain that values reliability more than novelty.`
      ]
    },
    {
      title: "The technical wedge",
      body: [
        `The wedge is ${entity.wedge.toLowerCase()}. In practical terms, that means the company appears to be positioning around a specific technical layer rather than a broad platform claim. This is the right shape for deep-tech diligence: narrow enough to test, but close enough to system-level pain that a buyer can imagine adoption.`,
        `The important question is not whether the wedge sounds differentiated. It is whether the underlying process can be validated across thermal, mechanical, electrical, and supply-chain conditions without requiring customers to redesign the rest of their stack.`
      ]
    },
    {
      title: "Market context",
      body: [
        `${entity.market} is being shaped by three pressures: performance ceilings in existing systems, national-interest supply-chain concerns, and a buyer base that increasingly wants domestic or allied technical alternatives. That creates room for companies that can show credible progress without asking buyers to absorb unbounded integration risk.`,
        `The immediate customer path likely runs through ${entity.buyer.toLowerCase()}, where technical teams can tolerate longer evaluation cycles if the capability solves a real deployment constraint.`
      ]
    },
    {
      title: "The landscape of alternatives",
      body: [
        `Alternative approaches include incumbent suppliers improving known materials, research labs pushing novel architectures, and systems integrators treating the problem as a packaging or qualification issue rather than a core technology gap. Each path has a different commercial burden.`,
        `${entity.name}'s opportunity is to prove that its approach is not merely a lab-efficient answer but a manufacturable, supportable, and inspectable part of the broader stack.`
      ]
    },
    {
      title: "The constraints of commercialization",
      body: [
        `The main constraints are ${entity.risk.toLowerCase()}, manufacturing readiness, qualification cycles, and the long buyer trust curve common to deep-tech markets. Public sources do not yet provide enough evidence to confirm production yield, customer deployments, or repeatable economics.`,
        `That does not make the company weak. It means the next stage of diligence should focus on validation artifacts: test reports, pilot terms, manufacturing partners, certifications, and any government or strategic customer signals.`
      ]
    },
    {
      title: "The next twelve months",
      body: [
        `The next twelve months should produce sharper evidence. Watch for prototype validation, pilot deployments, patent movement, technical hiring, government contract signals, and named partner announcements.`,
        `If those signals arrive together, ${entity.name} could move from interesting technical profile to a more investable commercialization story. If they do not, the company remains a watchlist candidate with a meaningful but unproven technical thesis.`
      ]
    }
    ],
    comparisonTable: {
      columns: ["Technology Layer", "Public Signal", "Constraint"],
      rows: [
        [entity.wedge, "Public positioning and technical category alignment", "Process validation required"],
        ["Deployment pathway", entity.deployment, "Qualification and integration testing required"],
        ["Buyer relevance", entity.buyer, "Procurement timeline and customer proof remain uncertain"],
        ["Commercial readiness", entity.stage, "Manufacturing and repeatability evidence not yet public"]
      ]
    }
  };
};

const dossierFor = (entity: EntityInput, taxonomy: TaxonomySnapshot, sources: Source[]): Dossier => ({
  executiveSummary: [
    `${entity.name} is tracked by DeepTechly as a ${entity.sector.toLowerCase()} company with secondary relevance to ${entity.secondarySectors.join(", ").toLowerCase()}. Public material indicates a focus on ${entity.wedge.toLowerCase()}, a technical layer that could matter where performance, reliability, and supply-chain control are tightly linked.`,
    `The company is not yet presented here as a fully verified commercial winner. The available evidence supports a research preview: the category is important, the technical wedge is plausible, and the buyer context is real, but public proof around deployments, revenue, manufacturing readiness, and customer commitments remains limited.`,
    `For institutional readers, the diligence question is whether ${entity.name} can turn a narrow technical advantage into qualified supply. That requires repeatable validation, credible partners, and enough capital discipline to survive long sales and qualification cycles.`
  ],
  taxonomySnapshot: taxonomy,
  companyOverview: [
    `${entity.name} appears to operate in ${entity.region} with a public story centered on ${entity.descriptor.toLowerCase()}`,
    `Public information is limited. DeepTechly has not verified revenue, customer names, full founding history, or manufacturing capacity from the current source set.`,
    `Known offerings are best treated as an emerging technical program rather than a mature product portfolio unless additional source material is provided.`
  ],
  productAndTechnology: [
    `The apparent product thesis is to use ${entity.wedge.toLowerCase()} as a control point inside ${entity.deployment.toLowerCase()}. The commercial value would come from measurable performance improvement, reduced integration burden, or better survivability in demanding environments.`,
    `The enabling technology likely depends on process discipline, test infrastructure, and customer-specific integration work. Public information does not yet confirm whether the company can move from prototype or demonstration into repeatable production.`,
    `A useful diligence path would request technical validation data, bill-of-material sensitivity, manufacturing partner details, and evidence that the product can be inserted into a customer workflow without excessive redesign.`
  ],
  productTechnologyFacts: {
    coreSystem: entity.wedge,
    primaryTechnicalAdvantage:
      "A narrow technical layer that could improve performance, reliability, or integration economics.",
    keyDependencies:
      "Process control, test instrumentation, qualified suppliers, and customer integration support.",
    validationNeeded:
      "Prototype test data, repeatability evidence, environmental validation, and manufacturing yield data.",
    deploymentEnvironment: entity.deployment
  },
  marketResearch: [
    `${entity.market} is attractive because buyers have operational pain that cannot always be solved with generic software or incremental supplier substitution.`,
    `The likely buyer is ${entity.buyer.toLowerCase()}. These customers tend to reward validated reliability, defensible technical claims, and compatibility with existing procurement and qualification systems.`,
    `Adoption friction is material. Deep-tech customers often require extended evaluation, field testing, security reviews, compliance alignment, and proof that the company can support the product over a long operating life.`
  ],
  customerSegments: [
    {
      customerSegment: "Aerospace and space systems",
      need: "High-reliability performance under thermal, vibration, and radiation stress.",
      adoptionConstraint: "Qualification burden and mission assurance review."
    },
    {
      customerSegment: "Defense primes and integrators",
      need: "Trusted technical alternatives with allied supply-chain relevance.",
      adoptionConstraint: "Procurement timing, security review, and program fit."
    },
    {
      customerSegment: "Industrial technology partners",
      need: "Specialized capability that can be embedded into a larger system.",
      adoptionConstraint: "Integration cost and proof of repeatable economics."
    }
  ],
  dataSnapshot: {
    sourceCount: entity.sourceCount,
    confidenceScore: entity.confidenceScore,
    trl: entity.confidenceScore >= 72 ? 6 : 5,
    mrl: entity.confidenceScore >= 72 ? 4 : 3,
    riskScore: entity.confidenceScore >= 80 ? 41 : entity.confidenceScore >= 60 ? 58 : 72,
    sectorActivity: entity.sector === "Semiconductors" ? 82 : entity.sector === "Energy" ? 76 : 68
  },
  accuracyAndConfidence: {
    label: entity.confidenceLabel,
    confirmed: [
      "The entity has a public web presence or source trail.",
      `The sector alignment with ${entity.sector.toLowerCase()} is supported by public positioning.`,
      "The topic has credible relevance to deep-tech diligence."
    ],
    inferred: [
      `The technology appears relevant to ${entity.secondarySectors.join(", ").toLowerCase()} buyers.`,
      "Government relevance is inferred from category overlap, not from confirmed awards unless cited.",
      "Commercial pathways are modeled from comparable deep-tech adoption patterns."
    ],
    unverified: [
      "Revenue, gross margin, and current customer deployments are not confirmed.",
      "Manufacturing readiness and production yield are not confirmed.",
      "Founder background and senior team depth require additional primary-source review."
    ]
  },
  competitiveLandscape: [
    {
      companyOrApproach: "Incumbent supplier optimization",
      category: "Established vendor",
      strength: "Qualification history and customer trust",
      constraint: "Incremental improvement may not solve the core bottleneck",
      relevance: "Baseline alternative"
    },
    {
      companyOrApproach: "University or lab-origin research",
      category: "Research pipeline",
      strength: "Novel technical discovery",
      constraint: "Commercialization and manufacturing path uncertain",
      relevance: "Technical comparator"
    },
    {
      companyOrApproach: "Systems integrator workaround",
      category: "Integration strategy",
      strength: "Can adapt existing architectures around constraints",
      constraint: "May add complexity and cost",
      relevance: "Buyer-side substitute"
    },
    {
      companyOrApproach: `${entity.name}`,
      category: "Focused entrant",
      strength: entity.wedge,
      constraint: entity.risk,
      relevance: "Primary subject"
    }
  ],
  companyPositioning: {
    whereItCompetes: `${entity.sector} infrastructure serving ${entity.buyer.toLowerCase()}.`,
    whereItMayDifferentiate: entity.wedge,
    whereItIsExposed: entity.risk,
    likelyBuyer: entity.buyer,
    strategicWedge:
      "Deep technical specificity paired with possible government and strategic supply-chain relevance."
  },
  opportunity: {
    commercial: [
      "Convert technical validation into component, subsystem, or platform revenue.",
      "Become a specialized supplier to customers with high switching costs once qualified."
    ],
    government: [
      "Pursue SBIR, defense innovation, NASA, DOE, or allied supply-chain programs where the category fits.",
      "Use non-dilutive awards as validation, not as a substitute for product-market proof."
    ],
    technical: [
      "Prove repeatability across environmental conditions and production batches.",
      "Turn the narrow wedge into a reference architecture customers can evaluate quickly."
    ],
    partnerships: [
      "Work with primes, semiconductor partners, space integrators, or industrial OEMs.",
      "Use strategic partners to reduce qualification and channel risk."
    ]
  },
  scenarios: [
    {
      title: "Conservative case",
      whatHappens: "The company remains an interesting technical watchlist item with limited commercial disclosure.",
      whatMustBeTrue: "The technical thesis holds, but validation and customer evidence arrive slowly.",
      keyRisk: "Insufficient public proof to support conviction.",
      investorRead: "Monitor, request primary evidence, and avoid underwriting aggressive adoption."
    },
    {
      title: "Base case",
      whatHappens: "A pilot or strategic partner validates the wedge and narrows the commercialization path.",
      whatMustBeTrue: "The product can be tested inside a real buyer workflow without major redesign.",
      keyRisk: "Long qualification cycles delay revenue.",
      investorRead: "Worth deeper diligence if customer and validation artifacts are accessible."
    },
    {
      title: "Aggressive case",
      whatHappens: "The technology becomes a priority supply-chain or performance layer for multiple buyers.",
      whatMustBeTrue: "Repeatability, manufacturability, and technical superiority are all demonstrated.",
      keyRisk: "Capital needs rise before revenue quality is proven.",
      investorRead: "Could justify institutional access if milestones are independently verified."
    },
    {
      title: "Strategic acquisition case",
      whatHappens: "A prime, OEM, or materials platform acquires the company to secure the capability.",
      whatMustBeTrue: "The wedge is hard to replicate and fits an urgent roadmap gap.",
      keyRisk: "Strategic value depends on proprietary evidence not yet public.",
      investorRead: "Track patents, partnership language, and senior technical hiring."
    }
  ],
  investorRead: [
    `${entity.name} is a diligence candidate when viewed as a technical wedge with strategic adjacency, not as a fully proven operating company.`,
    "The investment case depends on source quality, primary customer evidence, manufacturing proof, and the team's ability to survive long sales cycles.",
    "Institutional users should request founder analysis, customer pipeline notes, patent claim review, and a manufacturing readiness memo before assigning high conviction."
  ],
  foundersAndTeam: [
    "Founder data is limited in public sources.",
    "Known founders: not reliably confirmed in the current source set.",
    "Background signals, operator-market fit, and technical leadership should be verified through primary-source diligence."
  ],
  seniorTeam: [
    "Leadership depth is not fully visible from public sources.",
    "Technical depth appears important to the thesis but requires confirmation through biographies, publications, patents, or hiring records.",
    "Commercial leadership and government sales experience remain open diligence items."
  ],
  teamSignalForInvestors: [
    "Founder-market fit: incomplete public evidence.",
    "Execution credibility: requires customer, milestone, and hiring review.",
    "Technical credibility: potentially material, but should be validated against patents, publications, and reference calls.",
    "Governance concerns: no public red flag identified from this mock source set."
  ],
  cultureAndTeamHealth: [
    "Insufficient public data to assess culture or team health.",
    "Hiring pattern and retention signal require role history, employee movement, and public sentiment review.",
    "Operating risk remains tied to whether the company has enough technical and commercial leadership depth."
  ],
  hiringSignal: [
    "No reliable hiring signal was identified in the available public sources.",
    "Open roles, role categories, and hiring velocity should be checked before any institutional memo is finalized.",
    "Technical hiring would be a positive signal if it maps to validation, manufacturing, or customer integration."
  ],
  tractionAndMetrics: [
    "Revenue signals are not confirmed.",
    "Customer signals are not confirmed.",
    "Funding signals require additional source verification.",
    "Prototype maturity, pilot status, manufacturing readiness, and qualification status remain open."
  ],
  socialAndPRSignal: [
    "Media mentions are limited in the current source set.",
    "Founder visibility, research visibility, conference presence, and government visibility should be monitored.",
    "A sudden increase in technical conference or government program visibility would improve the signal quality."
  ],
  revenueAndUnitEconomics: [
    {
      path: "Component sales",
      whatMustBeTrue: "The product can be qualified and produced repeatably.",
      marginPotential: "Medium to high",
      timeHorizon: "24-48 months",
      risk: "Manufacturing and qualification burden"
    },
    {
      path: "Licensing",
      whatMustBeTrue: "The technical wedge is defensible and transferable.",
      marginPotential: "High",
      timeHorizon: "18-36 months",
      risk: "IP strength and partner dependence"
    },
    {
      path: "Government contracts",
      whatMustBeTrue: "The capability maps to a funded program need.",
      marginPotential: "Medium",
      timeHorizon: "12-36 months",
      risk: "Procurement timing"
    },
    {
      path: "Pilot deployments",
      whatMustBeTrue: "A buyer can test the system without full platform redesign.",
      marginPotential: "Low to medium initially",
      timeHorizon: "6-18 months",
      risk: "Pilot-to-production conversion"
    },
    {
      path: "Strategic partnership",
      whatMustBeTrue: "A larger platform owner sees roadmap urgency.",
      marginPotential: "Variable",
      timeHorizon: "12-30 months",
      risk: "Negotiation leverage and exclusivity"
    }
  ],
  bestCaseScenario: [
    "What happens: the company validates the technical wedge with a credible buyer and shows a repeatable path toward qualification.",
    "Evidence needed: test results, named pilot or partner, technical team depth, and a credible manufacturing plan.",
    "Investor implication: the company moves from watchlist to active diligence with strategic upside."
  ],
  baseCaseScenario: [
    "The company continues developing the technology and wins selective pilots, but institutional confidence remains moderate until manufacturing and revenue evidence improve.",
    "Investor implication: track milestones and source quality before assigning a venture-scale outcome."
  ],
  downsideScenario: [
    "A technical stall, funding gap, customer adoption failure, manufacturing challenge, regulatory delay, or competitive pressure prevents the wedge from becoming a product.",
    "Investor implication: the opportunity remains technically interesting but commercially fragile."
  ],
  risksAndConstraints: [
    "Technical risk: performance claims must survive independent validation.",
    "Manufacturing risk: repeatability, yield, and quality systems are not confirmed.",
    "Supply-chain risk: specialized inputs or vendors may limit scale.",
    "Regulatory risk: defense, space, or critical infrastructure buyers may trigger review.",
    "Certification risk: qualification cycles can delay adoption.",
    "Capital intensity: deep-tech validation can require material upfront spend.",
    "Deployment risk: integration burden may slow buyer adoption.",
    "Government procurement risk: award timing and program fit are uncertain.",
    "Customer adoption risk: buyers may prefer incumbent suppliers.",
    "Data availability risk: public information is incomplete."
  ],
  strategicOutlook: [
    `${entity.name} matters if ${entity.wedge.toLowerCase()} becomes a necessary layer for ${entity.market.toLowerCase()}.`,
    "The entity could become important by proving that the technical advantage is repeatable, ownable, and easy enough for strategic customers to adopt.",
    "Investors and partners should watch validation artifacts, partner language, technical hiring, patent movement, and any non-dilutive or strategic funding signal."
  ],
  sources,
  relatedResearch: [
    {
      slug: "titanym",
      name: "Titanym",
      sector: "Semiconductors",
      summary: "Sapphire-based integration thesis for RF, power, and compute systems."
    },
    {
      slug: "helioforge-systems",
      name: "HelioForge Systems",
      sector: "Energy",
      summary: "Thermal process hardware for industrial clean energy deployment."
    },
    {
      slug: "latticearc-robotics",
      name: "LatticeArc Robotics",
      sector: "Robotics",
      summary: "Inspection robotics for contested infrastructure and high-risk sites."
    }
  ].filter((item) => item.slug !== entity.slug)
});

const makeEntity = (input: EntityInput): ResearchEntity => {
  const taxonomy = taxonomyFor(input);
  const sources = sourcesFor(input);
  const article = articleFor(input);
  const dossier = dossierFor(input, taxonomy, sources);

  return {
    slug: input.slug,
    name: input.name,
    entityType: "Company",
    sector: input.sector,
    secondarySectors: input.secondarySectors,
    region: input.region,
    stage: input.stage,
    summary: input.descriptor,
    description: `${input.name} is tracked as a ${input.sector.toLowerCase()} entity with a focus on ${input.wedge.toLowerCase()}.`,
    tags: [input.sector, ...input.secondarySectors, input.stage],
    sourceCount: input.sourceCount,
    confidenceScore: input.confidenceScore,
    confidenceLabel: input.confidenceLabel,
    lastResearchedAt: input.lastResearchedAt,
    externalLinks: externalLinks(input.slug),
    snapshot: {
      entityType: "Company",
      primarySector: input.sector,
      secondarySectors: input.secondarySectors,
      region: input.region,
      stage: input.stage,
      sourceCount: input.sourceCount,
      confidence: input.confidenceLabel,
      researchStatus: "Public snapshot complete, institutional sections gated"
    },
    taxonomy,
    article,
    dossier,
    sources,
    relatedEntities: dossier.relatedResearch.map((item) => item.slug)
  };
};

export const entities: ResearchEntity[] = [
  makeEntity({
    slug: "titanym",
    name: "Titanym",
    sector: "Semiconductors",
    secondarySectors: ["Space", "Defense", "RF Systems"],
    region: "North America",
    stage: "Research preview",
    descriptor:
      "Sapphire-based semiconductor integration program for RF, power, and compute systems.",
    wedge: "Sapphire substrate integration for RF, power, and compute packaging",
    market:
      "High-reliability electronics for space, defense, and harsh-environment systems",
    buyer: "Aerospace, defense, semiconductor, and advanced electronics partners",
    deployment: "High-reliability electronics and harsh environments",
    risk: "process validation, packaging proof, and thermal testing",
    confidenceScore: 66,
    confidenceLabel: "MODERATE CONFIDENCE",
    sourceCount: 14,
    lastResearchedAt: "12m ago"
  }),
  makeEntity({
    slug: "helioforge-systems",
    name: "HelioForge Systems",
    sector: "Energy",
    secondarySectors: ["Manufacturing", "Materials", "Climate"],
    region: "United States",
    stage: "Technical watchlist",
    descriptor:
      "Industrial thermal hardware program for high-temperature clean manufacturing.",
    wedge: "Modular high-temperature process heat modules for industrial sites",
    market:
      "Industrial heat, clean manufacturing, and process electrification markets",
    buyer: "Industrial operators, energy developers, materials producers, and government demonstration programs",
    deployment: "Factory, refinery, and industrial materials environments",
    risk: "site integration, duty-cycle proof, and capital project timing",
    confidenceScore: 61,
    confidenceLabel: "MODERATE CONFIDENCE",
    sourceCount: 9,
    lastResearchedAt: "31m ago"
  }),
  makeEntity({
    slug: "latticearc-robotics",
    name: "LatticeArc Robotics",
    sector: "Robotics",
    secondarySectors: ["Defense", "Infrastructure", "Autonomy"],
    region: "North America",
    stage: "Public snapshot",
    descriptor:
      "Field robotics system for inspection and response in constrained infrastructure environments.",
    wedge: "Semi-autonomous inspection stack for damaged, remote, or contested sites",
    market:
      "Infrastructure inspection, emergency response, and defense-adjacent robotics",
    buyer: "Utilities, defense integrators, emergency response teams, and critical infrastructure operators",
    deployment: "Constrained infrastructure, field inspection, and remote sites",
    risk: "autonomy reliability, ruggedization, and buyer workflow adoption",
    confidenceScore: 72,
    confidenceLabel: "MODERATE CONFIDENCE",
    sourceCount: 16,
    lastResearchedAt: "44m ago"
  })
];

export const getEntityBySlug = (slug: string) =>
  entities.find((entity) => entity.slug === slug);
