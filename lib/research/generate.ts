import "server-only";

import { randomUUID } from "node:crypto";
import type {
  ClaimVerification,
  ExtractedEntityFacts,
  ResearchOutput,
  SourceSummary,
  StoredDossier,
  StoredResearchArticle
} from "./types";
import { isPublishable, slugify } from "./store";
import type {
  ArticleSection,
  ConfidenceLabel,
  ExternalLink,
  ResearchEntity,
  Source
} from "@/lib/types";

const articlePersona = "Viral Bernstein";
const profilePersona = "Rhea Mendoza";
const dossierPersona = "Marcus Okonkwo";

function confidenceLabel(score: number): ConfidenceLabel {
  if (score >= 80) return "High";
  if (score >= 55) return "Moderate";
  if (score >= 35) return "Limited";
  return "Unverified";
}

function asSource(summary: SourceSummary): Source {
  return {
    title: summary.title || summary.url,
    url: summary.url,
    publisher: new URL(summary.url).host.replace(/^www\./, ""),
    date: new Date().toISOString().slice(0, 10),
    type: summary.sourceType
  };
}

function compactSources(summaries: SourceSummary[], facts: ExtractedEntityFacts) {
  const sources = summaries.map(asSource);
  const existing = new Set(sources.map((source) => source.url));

  for (const url of facts.sourceUrls) {
    if (!existing.has(url)) {
      sources.push({
        title: url,
        url,
        publisher: safeHost(url),
        date: new Date().toISOString().slice(0, 10),
        type: url.includes("patent") ? "Patent" : "Other"
      });
    }
  }

  return sources.slice(0, 14);
}

function safeHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "Public source";
  }
}

function externalLinks(facts: ExtractedEntityFacts): ExternalLink[] {
  const links: ExternalLink[] = [];
  if (facts.website) links.push({ label: "WEBSITE", href: facts.website });
  if (facts.patents?.[0]) links.push({ label: "PATENTS", href: facts.patents[0] });
  if (facts.papers?.[0]) links.push({ label: "PAPERS", href: facts.papers[0] });
  if (facts.governmentLinks?.[0]) {
    links.push({ label: "GOVERNMENT", href: facts.governmentLinks[0] });
  }
  links.push(
    {
      label: "SBIR",
      href: `https://www.sbir.gov/search?term=${encodeURIComponent(facts.name)}`
    },
    {
      label: "NASA TECH",
      href: `https://technology.nasa.gov/search?search=${encodeURIComponent(facts.name)}`
    },
    {
      label: "DARPA",
      href: `https://www.darpa.mil/search?search=${encodeURIComponent(facts.name)}`
    },
    {
      label: "NEWS",
      href: `https://www.google.com/search?q=${encodeURIComponent(`${facts.name} news`)}`
    }
  );

  return links.slice(0, 8);
}

function fallbackArticleSections(facts: ExtractedEntityFacts): ArticleSection[] {
  return [
    {
      title: "Why it matters",
      body: [
        `${facts.name} matters because its public positioning touches ${facts.sector.toLowerCase()}, a category where technical performance, qualification, and supply-chain trust can shape buyer behavior. Public sources indicate a product direction, but the current evidence still needs deeper validation before any hard commercial claims can be made.`,
        `For DeepTechly, the important signal is not novelty alone. The question is whether the entity can turn a narrow technical capability into something buyers can test, procure, and support in real deployment environments.`
      ]
    },
    {
      title: "The technical wedge",
      body: [
        `The technical wedge appears to be: ${facts.productSummary}. This should be treated as a public-positioning read, not a verified engineering audit.`,
        `The diligence burden is to identify the real stack: hardware layers, software controls, materials, manufacturing process, validation data, and the dependencies required for customer integration.`
      ]
    },
    {
      title: "Market context",
      body: [
        `Likely customer segments include ${facts.customerSegments.join(", ").toLowerCase()}. These buyers tend to move cautiously when a technology touches operations, safety, mission assurance, or capital equipment decisions.`,
        `The category may benefit from strategic demand around resilient supply chains and technical differentiation, but adoption will depend on evidence, not narrative.`
      ]
    },
    {
      title: "The landscape of alternatives",
      body: [
        `Alternative paths include incumbent suppliers improving existing systems, research labs advancing adjacent techniques, and integrators building around the constraint instead of adopting a new supplier.`,
        `${facts.name} would need to show why its approach is meaningfully better, easier to integrate, or more strategically valuable than those alternatives.`
      ]
    },
    {
      title: "The constraints of commercialization",
      body: [
        `The main constraints are manufacturing readiness, customer qualification, funding runway, technical validation, and credible proof of deployment. Public sources do not confirm revenue, repeatable manufacturing, or production-scale customer adoption.`,
        `If the company is deep tech, investors should expect longer cycles around pilots, certifications, reference customers, procurement, and supply-chain qualification.`
      ]
    },
    {
      title: "The next twelve months",
      body: [
        `The next twelve months should clarify whether the public story is becoming a verifiable company-building story. Watch for technical demos, pilot deployments, patents, team expansion, government award signals, manufacturing partners, and customer announcements.`,
        `Without those signals, ${facts.name} remains a research candidate rather than a high-conviction institutional profile.`
      ]
    }
  ];
}

function comparisonRows(facts: ExtractedEntityFacts): [string, string, string][] {
  return [
    ["Technology layer", facts.productSummary, "Needs independent validation"],
    ["Customer segment", facts.customerSegments.join(", "), "Buyer workflow adoption remains uncertain"],
    ["Government relevance", facts.governmentLinks?.length ? "Government source candidates found" : "Not confirmed", "Award or program fit must be verified"],
    ["Commercial readiness", facts.fundingStage ?? "Not confirmed in public sources", "Revenue and deployment signals remain unverified"]
  ];
}

function fallbackDossier(
  facts: ExtractedEntityFacts,
  verification: ClaimVerification,
  sources: Source[],
  score: number
): ResearchEntity["dossier"] {
  const secondary = facts.secondarySectors.length ? facts.secondarySectors : ["Government Relevance", "Advanced Systems"];
  const trl = score >= 72 ? 6 : score >= 55 ? 5 : 4;
  const mrl = score >= 72 ? 5 : score >= 55 ? 4 : 3;

  return {
    executiveSummary: [
      `${facts.name} is tracked as a ${facts.sector.toLowerCase()} entity with public signals around ${facts.productSummary}`,
      `The current source set supports a research profile, not a complete diligence conclusion. Several high-value fields remain unconfirmed in public sources.`,
      `Institutional diligence should focus on technical validation, customer evidence, manufacturing readiness, team depth, and any government or strategic partnership signals.`
    ],
    taxonomySnapshot: {
      entityType: "Company",
      primarySector: facts.sector,
      secondarySectors: secondary,
      technologyLayer: facts.productSummary,
      businessModel: facts.businessModel ?? "Not confirmed in public sources",
      customerType: facts.customerSegments.join(", "),
      deploymentEnvironment: "High-reliability, industrial, government, or technical operating environments",
      capitalIntensity: facts.sector === "Software" ? "Moderate" : "High",
      regulatoryExposure: secondary.includes("Defense") ? "Moderate to high" : "Moderate",
      governmentRelevance: facts.governmentLinks?.length ? "Potentially high" : "Unverified"
    },
    companyOverview: [
      `${facts.name} appears to operate through ${facts.website ?? "a public web presence that was not fully confirmed"}.`,
      facts.foundedYear
        ? `A public date signal was detected around ${facts.foundedYear}, but founding context should still be verified.`
        : "Founding year is not confirmed in public sources.",
      facts.headquarters
        ? `Headquarters signal: ${facts.headquarters}.`
        : "Public information is limited. Headquarters, revenue, and customer deployments were not confirmed."
    ],
    productAndTechnology: [
      `The product and technology read centers on ${facts.productSummary}`,
      "DeepTechly treats this as a technical-positioning signal until primary technical validation, customer deployments, or formal documentation confirms the claim.",
      "Integration dependencies likely include product validation, buyer workflow fit, supply-chain readiness, and support capability."
    ],
    productTechnologyFacts: {
      coreSystem: facts.productSummary,
      primaryTechnicalAdvantage:
        "A focused technical layer that may address performance, reliability, automation, or deployment constraints.",
      keyDependencies:
        "Technical validation, customer integration, qualified suppliers, and team execution.",
      validationNeeded:
        "Independent test data, pilot outcomes, customer references, manufacturing or deployment evidence.",
      deploymentEnvironment:
        "Industrial, aerospace, defense, energy, robotics, or other high-reliability environments depending on buyer fit."
    },
    marketResearch: [
      `The likely market includes ${facts.customerSegments.join(", ").toLowerCase()}.`,
      "Demand drivers may include reliability, technical differentiation, automation, supply-chain resilience, and government-backed modernization.",
      "Adoption friction is material because deep-tech buyers often need proof, integration support, procurement fit, and long-term supplier confidence."
    ],
    customerSegments: facts.customerSegments.map((segment) => ({
      customerSegment: segment,
      need: "Validated technical capability that improves reliability, performance, cost, or operating reach.",
      adoptionConstraint: "Qualification, integration, procurement, and support risk."
    })),
    dataSnapshot: {
      sourceCount: sources.length,
      confidenceScore: score,
      trl,
      mrl,
      riskScore: Math.max(35, 100 - score + 20),
      sectorActivity: facts.sector === "Deep Tech" ? 60 : 76
    },
    accuracyAndConfidence: {
      label: confidenceLabel(score),
      confirmed: verification.confirmed,
      inferred: verification.inferred,
      unverified: verification.unverified
    },
    competitiveLandscape: [
      {
        companyOrApproach: "Incumbent supplier",
        category: "Established vendor",
        strength: "Customer trust and qualification history",
        constraint: "May not solve the newer technical bottleneck",
        relevance: "Baseline alternative"
      },
      {
        companyOrApproach: "Research lab or university-origin approach",
        category: "Technical research",
        strength: "Novel technical exploration",
        constraint: "Commercialization path may be immature",
        relevance: "Technology comparator"
      },
      {
        companyOrApproach: "Systems integrator workaround",
        category: "Integration substitute",
        strength: "Can adapt existing architecture",
        constraint: "May increase system complexity",
        relevance: "Buyer-side alternative"
      },
      {
        companyOrApproach: facts.name,
        category: "Focused entrant",
        strength: facts.productSummary,
        constraint: "Public validation remains incomplete",
        relevance: "Primary subject"
      }
    ],
    companyPositioning: {
      whereItCompetes: `${facts.sector} and adjacent deep-tech markets.`,
      whereItMayDifferentiate: facts.productSummary,
      whereItIsExposed:
        "Validation, manufacturing or deployment readiness, buyer adoption, and data availability.",
      likelyBuyer: facts.customerSegments.join(", "),
      strategicWedge:
        "Technical specificity with possible strategic relevance if validated by customers or government programs."
    },
    opportunity: {
      commercial: [
        "Convert technical validation into product, component, or platform revenue.",
        "Build a trusted supplier position in a market where qualification can create defensibility."
      ],
      government: [
        "Monitor SBIR, DARPA, NASA, DoD, DOE, and allied program fit.",
        "Use non-dilutive awards as validation only when the award is directly relevant to the technology."
      ],
      technical: [
        "Prove repeatability, reliability, and integration value.",
        "Turn public technical positioning into evidence customers can evaluate."
      ],
      partnerships: [
        "Partner with primes, OEMs, research labs, manufacturing partners, or strategic customers.",
        "Use partners to reduce integration and qualification risk."
      ]
    },
    scenarios: [
      {
        title: "Conservative case",
        whatHappens: "The company remains a watchlist item with limited public proof.",
        whatMustBeTrue: "The technical claim is plausible but validation remains private or incomplete.",
        keyRisk: "Insufficient evidence.",
        investorRead: "Monitor and request primary source artifacts."
      },
      {
        title: "Base case",
        whatHappens: "The company secures pilots or clearer technical validation.",
        whatMustBeTrue: "Buyers can test the capability without excessive integration burden.",
        keyRisk: "Slow qualification.",
        investorRead: "Worth active diligence if validation artifacts are available."
      },
      {
        title: "Aggressive case",
        whatHappens: "The technology becomes a strategic layer in its market.",
        whatMustBeTrue: "Technical advantage, repeatability, and customer demand are all proven.",
        keyRisk: "Capital needs rise before revenue quality is proven.",
        investorRead: "Could justify institutional access and partner mapping."
      },
      {
        title: "Strategic acquisition case",
        whatHappens: "A larger platform owner acquires the capability.",
        whatMustBeTrue: "The wedge is proprietary, hard to replicate, and roadmap-critical.",
        keyRisk: "Strategic value depends on non-public proof.",
        investorRead: "Watch patents, partner language, and senior technical hiring."
      }
    ],
    investorRead: [
      `${facts.name} should be treated as a diligence candidate, not a confirmed breakout company.`,
      "The institutional case depends on source quality, validation artifacts, team depth, and customer evidence.",
      "Primary diligence should request founder background, technical proof, customer pipeline, and manufacturing or deployment readiness."
    ],
    foundersAndTeam: [
      facts.founders?.length
        ? `Known public founder/person signals: ${facts.founders.join(", ")}. These require verification.`
        : "Founder data is limited in public sources.",
      "Background signals, operator-market fit, and technical leadership require primary-source diligence.",
      "Open questions include team depth, hiring plan, and commercial execution capability."
    ],
    seniorTeam: [
      "Leadership depth is not fully visible from public sources.",
      "Technical depth should be verified through patents, publications, bios, or customer references.",
      "Commercial leadership and government sales experience remain open diligence items."
    ],
    teamSignalForInvestors: [
      "Founder-market fit: incomplete public evidence.",
      "Execution credibility: requires milestone and customer review.",
      "Technical credibility: potentially material, but should be validated.",
      "Governance concerns: no public red flag identified from the current source set."
    ],
    cultureAndTeamHealth: [
      "Insufficient public data to assess culture or team health.",
      "Hiring pattern, retention signal, and employee sentiment require further review.",
      "Operating risk remains tied to technical and commercial leadership depth."
    ],
    hiringSignal: [
      facts.openRoles?.length
        ? `Public role signals found: ${facts.openRoles.join(", ")}.`
        : "No reliable hiring signal was identified in the available public sources.",
      "Technical hiring would be positive if it maps to validation, manufacturing, or customer integration.",
      "Commercial hiring would be positive if the company is moving from prototype to pilots."
    ],
    tractionAndMetrics: [
      "Revenue signals are not confirmed.",
      "Customer signals are not confirmed.",
      "Funding signals require additional source verification.",
      "Prototype maturity, pilot status, manufacturing readiness, and qualification status remain open."
    ],
    socialAndPRSignal: [
      "Media and PR visibility are limited in the current source set.",
      "Founder visibility, conference presence, research visibility, and government visibility should be monitored.",
      "A rise in primary technical or government sources would improve confidence."
    ],
    revenueAndUnitEconomics: [
      {
        path: "Component or product sales",
        whatMustBeTrue: "The product can be validated and delivered repeatably.",
        marginPotential: "Medium to high",
        timeHorizon: "24-48 months",
        risk: "Qualification and manufacturing burden"
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
        whatMustBeTrue: "A buyer can test the system without redesigning the full stack.",
        marginPotential: "Low to medium initially",
        timeHorizon: "6-18 months",
        risk: "Pilot-to-production conversion"
      },
      {
        path: "Strategic partnership",
        whatMustBeTrue: "A platform owner sees roadmap urgency.",
        marginPotential: "Variable",
        timeHorizon: "12-30 months",
        risk: "Negotiation leverage"
      }
    ],
    bestCaseScenario: [
      "What happens: the company validates the technical wedge with a credible buyer.",
      "Evidence needed: test results, named pilot or partner, technical team depth, and a credible deployment plan.",
      "Investor implication: the company moves from watchlist to active diligence."
    ],
    baseCaseScenario: [
      "The company continues developing and wins selective pilots, but confidence remains moderate until revenue and validation evidence improve.",
      "Investor implication: track milestones and source quality."
    ],
    downsideScenario: [
      "A technical stall, funding gap, customer adoption failure, manufacturing challenge, regulatory delay, or competitive pressure prevents the wedge from becoming a product.",
      "Investor implication: technically interesting but commercially fragile."
    ],
    risksAndConstraints: [
      "Technical risk: performance claims must survive independent validation.",
      "Manufacturing risk: repeatability and quality systems are not confirmed.",
      "Supply-chain risk: specialized inputs may limit scale.",
      "Regulatory risk: government or critical infrastructure buyers may trigger review.",
      "Certification risk: qualification cycles can delay adoption.",
      "Capital intensity: deep-tech validation can require material upfront spend.",
      "Deployment risk: integration burden may slow adoption.",
      "Government procurement risk: award timing and program fit are uncertain.",
      "Customer adoption risk: buyers may prefer incumbents.",
      "Data availability risk: public information is incomplete."
    ],
    strategicOutlook: [
      `${facts.name} becomes important if its public technical claim becomes validated customer value.`,
      "What must be proven: repeatability, buyer urgency, defensibility, and a credible path to deployment.",
      "Investors and partners should watch validation artifacts, partner language, patents, hiring, and government signal movement."
    ],
    sources,
    relatedResearch: []
  };
}

function extractOutputText(body: {
  output_text?: string;
  output?: { content?: { text?: string }[] }[];
}) {
  return (
    body.output_text ??
    body.output
      ?.flatMap((item) => item.content ?? [])
      .map((item) => item.text ?? "")
      .join("") ??
    ""
  );
}

async function callOpenAIJson(prompt: string) {
  if (!process.env.OPENAI_API_KEY) {
    console.log("OPENAI_API_KEY missing. Running research job in demo mode.");
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.5-mini",
      input: prompt,
      text: { format: { type: "json_object" } }
    })
  });

  if (!response.ok) {
    return null;
  }

  try {
    const body = await response.json();
    return JSON.parse(extractOutputText(body) || "{}") as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function aiArticleSections(
  facts: ExtractedEntityFacts,
  summaries: SourceSummary[]
) {
  const prompt = `You are an institutional deep-tech analyst writing for DeepTechly.

Write a feature article based only on the provided source summaries and structured facts.
Do not invent facts. If a fact is not confirmed, frame it as unconfirmed or omit it.
The article must follow this section structure:
1. Why it matters
2. The technical wedge
3. Market context
4. The landscape of alternatives
5. The constraints of commercialization
6. The next twelve months

Use calm institutional language. Return JSON only:
{"headline":"","dek":"","sections":[{"title":"","body":["",""]}]}

Facts:
${JSON.stringify(facts)}

Source summaries:
${JSON.stringify(summaries.slice(0, 8))}`;

  const response = await callOpenAIJson(prompt);
  const sections = response?.sections as ArticleSection[] | undefined;
  const headline = typeof response?.headline === "string" ? response.headline : null;
  const dek = typeof response?.dek === "string" ? response.dek : null;

  if (!headline || !dek || !sections || sections.length < 4) {
    return null;
  }

  return { headline, dek, sections };
}

async function aiDossierHighlights(
  facts: ExtractedEntityFacts,
  verification: ClaimVerification,
  summaries: SourceSummary[]
) {
  const prompt = `You are an institutional deep-tech diligence analyst.

Generate only the executive summary and strategic outlook for a DeepTechly research dossier based on the provided source summaries and structured facts.
Do not invent missing facts. Separate confirmed, inferred, and unverified in language.
Return JSON only:
{"executiveSummary":["","",""],"strategicOutlook":["","",""]}

Facts:
${JSON.stringify(facts)}

Verification:
${JSON.stringify(verification)}

Source summaries:
${JSON.stringify(summaries.slice(0, 8))}`;

  const response = await callOpenAIJson(prompt);
  const executiveSummary = response?.executiveSummary as string[] | undefined;
  const strategicOutlook = response?.strategicOutlook as string[] | undefined;

  if (!executiveSummary?.length || !strategicOutlook?.length) {
    return null;
  }

  return { executiveSummary, strategicOutlook };
}

export async function generateResearchOutput({
  query,
  facts,
  verification,
  summaries,
  heroImage
}: {
  query: string;
  facts: ExtractedEntityFacts;
  verification: ClaimVerification;
  summaries: SourceSummary[];
  heroImage: string | null;
}): Promise<ResearchOutput> {
  const now = new Date().toISOString();
  const slug = slugify(facts.name || query);
  const sources = compactSources(summaries, facts);
  const sourceCount = Math.max(sources.length, facts.sourceUrls.length);
  const score = Math.min(
    92,
    Math.max(
      38,
      38 +
        sourceCount * 4 +
        verification.confirmed.length * 4 -
        verification.unverified.length * 2
    )
  );
  const label = confidenceLabel(score);
  const secondary = facts.secondarySectors.length
    ? facts.secondarySectors
    : ["Technology", "Government Relevance"];
  const aiArticle = await aiArticleSections(facts, summaries);
  const aiDossier = await aiDossierHighlights(facts, verification, summaries);
  const sections = aiArticle?.sections ?? fallbackArticleSections(facts);
  const headline =
    aiArticle?.headline ??
    `${facts.name}'s ${facts.sector} Signal Moves Into Deep-Tech Diligence`;
  const dek =
    aiArticle?.dek ??
    `${facts.productSummary} DeepTechly's generated read separates public evidence, inferred market relevance, and the questions institutional users still need answered.`;
  const dossier = fallbackDossier(facts, verification, sources, score);
  if (aiDossier) {
    dossier.executiveSummary = aiDossier.executiveSummary;
    dossier.strategicOutlook = aiDossier.strategicOutlook;
  }
  const tags = [facts.sector, ...secondary, label].slice(0, 5);

  dossier.sources = sources;

  const entity: ResearchEntity = {
    id: `entity_${randomUUID().slice(0, 8)}`,
    slug,
    name: facts.name,
    entityType: "Company",
    domain: facts.domain ?? null,
    website: facts.website ?? null,
    sector: facts.sector,
    secondarySectors: secondary,
    region: facts.headquarters ?? "Not confirmed in public sources",
    stage: "Generated research",
    summary: facts.productSummary,
    description: `${facts.name} is a generated DeepTechly research profile based on public source extraction and verification.`,
    foundedYear: facts.foundedYear ?? null,
    headquarters: facts.headquarters ?? null,
    founders: facts.founders ?? [],
    fundingStage: facts.fundingStage ?? null,
    fundingAmount: facts.fundingAmount ?? null,
    employeeCount: facts.employeeCount ?? null,
    investors: facts.investors ?? [],
    tags,
    sourceCount,
    confidenceScore: score,
    confidenceLabel: label,
    lastResearchedAt: "just now",
    heroImage,
    publishedStatus: "draft",
    searchCount: 1,
    createdAt: now,
    updatedAt: now,
    externalLinks: externalLinks(facts),
    snapshot: {
      entityType: "Company",
      primarySector: facts.sector,
      secondarySectors: secondary,
      region: facts.headquarters ?? "Not confirmed",
      stage: "Generated research",
      sourceCount,
      confidence: label,
      researchStatus: "Generated public snapshot complete, institutional sections gated"
    },
    taxonomy: dossier.taxonomySnapshot,
    article: {
      headline,
      title: headline,
      dek,
      entityName: facts.name,
      entitySlug: slug,
      authorPersona: articlePersona,
      publishedAt: now,
      heroImage,
      dossierUrl: `/startup/${slug}`,
      visualLabel: facts.sector.toUpperCase(),
      visualCaption: `${facts.name} extracted source visual`,
      sections,
      bodySections: sections,
      comparisonTable: {
        columns: ["Technology Layer", "Public Signal", "Constraint"],
        rows: comparisonRows(facts)
      },
      tags,
      sources,
      publishedStatus: "draft"
    },
    dossier,
    sources,
    relatedEntities: []
  };

  const publishable = isPublishable(entity);
  entity.publishedStatus = publishable ? "published" : "draft";
  entity.article.publishedStatus = entity.publishedStatus;

  const article: StoredResearchArticle = {
    id: `article_${randomUUID().slice(0, 8)}`,
    slug,
    entityId: entity.id!,
    title: headline,
    dek,
    authorPersona: articlePersona,
    heroImage,
    bodySections: sections,
    tags,
    sources,
    publishedStatus: entity.publishedStatus,
    adminFeatured: false,
    publishedAt: publishable ? now : null,
    createdAt: now,
    updatedAt: now
  };

  const storedDossier: StoredDossier = {
    id: `dossier_${randomUUID().slice(0, 8)}`,
    slug,
    entityId: entity.id!,
    dossier: {
      ...dossier,
      investorRead: [
        `${dossierPersona} flags this as a gated institutional read rather than a public certainty claim.`,
        ...dossier.investorRead
      ],
      companyOverview: [
        `${profilePersona} generated the public profile from extracted sources and unconfirmed-field handling.`,
        ...dossier.companyOverview
      ]
    },
    publishedStatus: entity.publishedStatus,
    createdAt: now,
    updatedAt: now
  };

  entity.dossier = storedDossier.dossier;

  return {
    entity,
    article,
    dossier: storedDossier,
    publishable
  };
}
