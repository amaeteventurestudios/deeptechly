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
import { isCompletedResearchFeedEligible, isPublishable, slugify } from "./store";
import {
  inferRegionTag,
  inferStageTag,
  selectDeeptechlyAgent,
  storySectorTags
} from "@/lib/story-metadata";
import type {
  ArticleSection,
  ConfidenceLabel,
  ExternalLink,
  ResearchEntity,
  Source
} from "@/lib/types";
import {
  normalizeStoredSources,
  sourceMix,
  type EnrichedSourceSummary
} from "./source-quality";
import type { EntityResolutionMetadata, EntityInputType } from "./entity-resolution";

const profilePersona = "Axon Reyes";
const dossierPersona = "Daxon Pierce";
const defaultOpenAIModel = "gpt-5.4-mini";

const articleSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    dek: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          body: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["title", "body"]
      }
    },
    openQuestions: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["headline", "dek", "sections", "openQuestions"]
};

const dossierHighlightsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    executiveSummary: {
      type: "array",
      items: { type: "string" }
    },
    strategicOutlook: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["executiveSummary", "strategicOutlook"]
};

function confidenceLabel(score: number): ConfidenceLabel {
  if (score >= 80) return "HIGH CONFIDENCE";
  if (score >= 60) return "MODERATE CONFIDENCE";
  if (score >= 35) return "LIMITED PUBLIC DATA";
  return "LOW CONFIDENCE";
}

function asSource(summary: SourceSummary): Source {
  const enriched = summary as EnrichedSourceSummary;
  return {
    title: summary.title || summary.url,
    url: summary.url,
    publisher: enriched.publisher ?? new URL(summary.url).host.replace(/^www\./, ""),
    date: enriched.retrievedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    type: summary.sourceType,
    retrievedAt: enriched.retrievedAt ?? new Date().toISOString(),
    supportsClaims: enriched.supportsClaims
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
        type: url.includes("patent") ? "patent" : "unknown"
      });
    }
  }

  return normalizeStoredSources(sources).slice(0, 14);
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
  return links.slice(0, 8);
}

function confidenceScoreForSources(
  summaries: SourceSummary[],
  verification: ClaimVerification
) {
  const mix = sourceMix(summaries);
  const moderate = Math.max(0, mix.total - mix.strongOrBetter - mix.weak);
  const score =
    18 +
    mix.official * 16 +
    (mix.strongOrBetter - mix.official) * 11 +
    moderate * 5 +
    Math.min(mix.weak, 3) * 2 +
    verification.confirmed.length * 3 -
    verification.unverified.length * 4;
  let bounded = Math.min(100, Math.max(0, score));

  if (!mix.hasReliableEvidence) {
    bounded = Math.min(bounded, 34);
  } else if (mix.official === 0) {
    bounded = Math.min(bounded, 59);
  } else if (mix.official < 2 || mix.strongOrBetter < 3) {
    bounded = Math.min(bounded, 79);
  }

  return bounded;
}

function agencyPhrase(facts: ExtractedEntityFacts) {
  const agencies = facts.publicSector?.detectedAgencies ?? [];
  return agencies.length ? agencies.slice(0, 4).join(", ") : "relevant public-sector agencies";
}

function publicSectorStatus(facts: ExtractedEntityFacts) {
  const governmentCount =
    facts.publicSector?.governmentSourceCount ?? facts.governmentLinks?.length ?? 0;
  if (governmentCount > 0) {
    return `Available government sources suggest contextual relevance to ${agencyPhrase(facts)}; DeepTechly could not confirm funding, procurement, customer status, or endorsement unless separately sourced.`;
  }
  return "Public-sector relevance is not confirmed from government sources; any agency fit should be treated as contextual and unverified.";
}

function patentStatus(facts: ExtractedEntityFacts) {
  const patentCount = facts.publicSector?.patentSourceCount ?? facts.patents?.length ?? 0;
  const patentIds = facts.publicSector?.detectedPatentIds ?? [];
  if (patentCount > 0 || patentIds.length > 0) {
    return `Patent records indicate related IP activity${patentIds.length ? ` (${patentIds.slice(0, 3).join(", ")})` : ""}; this supports technical relevance, not product readiness, ownership, exclusivity, or an active license by itself.`;
  }
  return "Patent position is not confirmed from available public patent sources.";
}

function fallbackArticleSections(facts: ExtractedEntityFacts): ArticleSection[] {
  return [
    {
      title: "Why this matters",
      body: [
        `Public sources indicate ${facts.name} is operating in ${facts.sector.toLowerCase()}, a category where technical performance, qualification, and supply-chain trust shape buyer decisions. Available evidence suggests a product direction, but the current source set requires deeper validation before any hard commercial claims can be made.`,
        `For DeepTechly, the signal to watch is not novelty alone. The question is whether the entity can turn a narrow technical capability into something buyers can test, procure, and support in real deployment environments.`
      ]
    },
    {
      title: "The technical angle",
      body: [
        `Available evidence suggests the technical approach centers on: ${facts.productSummary}. This should be treated as a public-positioning read, not a verified engineering assessment.`,
        `The diligence burden is to identify the actual technical stack: hardware layers, software controls, materials, manufacturing process, validation data, and the integration dependencies required for customer adoption.`
      ]
    },
    {
      title: "The market position",
      body: [
        `Public sources indicate likely customer segments include ${facts.customerSegments.join(", ").toLowerCase()}. These buyers tend to move cautiously when a technology touches operations, safety, mission assurance, or capital equipment decisions.`,
        `The category may benefit from strategic demand around resilient supply chains and technical differentiation, but adoption will depend on evidence, not narrative.`
      ]
    },
    {
      title: "What could go right",
      body: [
        `If the technical claim survives independent validation and a qualified buyer can integrate the capability without excessive burden, ${facts.name} could move from a research candidate to an active diligence target.`,
        `Government or institutional program fit, patent activity, technical hiring, and named pilot deployments would all be positive signals only when directly source-backed. ${publicSectorStatus(facts)}`
      ]
    },
    {
      title: "What could go wrong",
      body: [
        `DeepTechly could not confirm revenue, repeatable manufacturing, or production-scale customer adoption from available public sources. The main risks are technical validation failure, manufacturing readiness gaps, funding runway constraints, and slow qualification cycles.`,
        `If incumbents improve existing approaches or a systems integrator builds around the problem instead, the addressable window for ${facts.name} narrows. The absence of public customer or deployment evidence is a material gap at this stage.`
      ]
    },
    {
      title: "The next twelve months",
      body: [
        `The next twelve months should clarify whether the public story is becoming a verifiable company-building story. Watch for technical demos, pilot deployments, patent filings, team expansion, government award signals, manufacturing partners, and customer announcements.`,
        `Without those signals, ${facts.name} remains a research candidate rather than a high-conviction institutional profile.`
      ]
    }
  ];
}

function comparisonRows(facts: ExtractedEntityFacts): [string, string, string][] {
  return [
    ["Technology layer", facts.productSummary, "Needs independent validation"],
    ["Customer segment", facts.customerSegments.join(", "), "Buyer workflow adoption remains uncertain"],
    ["Government relevance", facts.governmentLinks?.length ? "Government source candidates found" : "Not confirmed", "Funding, procurement, customer, and endorsement claims require explicit evidence"],
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
      deploymentEnvironment: "High-reliability, industrial, public-sector, or technical operating environments",
      capitalIntensity: facts.sector === "Software" ? "Moderate" : "High",
      regulatoryExposure: secondary.includes("Defense") ? "Moderate to high" : "Moderate",
      governmentRelevance: facts.governmentLinks?.length ? "Contextual source-backed relevance; transactional status unconfirmed" : "Unverified"
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
      patentStatus(facts),
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
      "Demand drivers may include reliability, technical differentiation, automation, supply-chain resilience, and public-sector modernization priorities where source-backed.",
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
      unverified: [
        ...verification.unverified,
        "Patent ownership, exclusivity, active license status, government funding, contracts, customers, partnerships, and procurement interest require explicit source support."
      ]
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
        "Technical specificity with possible strategic relevance if validated by customers or explicitly sourced public-sector programs."
    },
    opportunity: {
      commercial: [
        "Convert technical validation into product, component, or platform revenue.",
        "Build a trusted supplier position in a market where qualification can create defensibility."
      ],
      government: [
        publicSectorStatus(facts),
        "Treat SBIR, STTR, DARPA, NASA, DoD, DOE, and allied program references as agency relevance unless an official source confirms award, contract, funding, procurement, or customer status.",
        "DeepTechly could not confirm active procurement interest from available public sources unless listed in confirmed facts."
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
      "Founder visibility, conference presence, research visibility, and government/public-sector source visibility should be monitored.",
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
        whatMustBeTrue: "An official source confirms a contract, award, customer relationship, or funded program need.",
        marginPotential: "Medium",
        timeHorizon: "12-36 months",
        risk: "Procurement, funding, and customer status are not assumed from contextual agency relevance"
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
      "Government relevance risk: source context may not translate into funding, procurement, customer activity, endorsement, or revenue.",
      "Customer adoption risk: buyers may prefer incumbents.",
      "Data availability risk: public information is incomplete."
    ],
    strategicOutlook: [
      `${facts.name} becomes important if its public technical claim becomes validated customer value.`,
      "What must be proven: repeatability, buyer urgency, defensibility, and a credible path to deployment.",
      "Investors and partners should watch validation artifacts, partner language, patents, hiring, and explicit government source movement."
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

async function callOpenAIJson(
  prompt: string,
  schemaName: string,
  schema: Record<string, unknown>
) {
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
      model: process.env.OPENAI_MODEL ?? defaultOpenAIModel,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema
        }
      }
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

Write a feature article based ONLY on the provided source summaries and structured facts.
RULES:
- Never invent founders, funding, investors, customers, patents, revenue, or technical metrics
- Never claim government funding, contracts, customers, partnerships, endorsement, procurement interest, patent ownership, exclusivity, or active license unless explicitly source-backed
- Patent sources may support technical relevance, not market traction or product readiness by themselves
- Government sources may support public-sector relevance, not funding/procurement/customer status by themselves
- If a fact cannot be confirmed from public sources, write: "DeepTechly could not confirm..." or "Not confirmed in public sources"
- Use only these approved phrases: "Public sources indicate...", "The company states...", "Available evidence suggests...", "DeepTechly could not confirm...", "No public source was found for...", "This appears to...", "This may indicate..."
- NEVER use: "This proves...", "Guaranteed...", "Revolutionary...", "Unmatched...", "Definitive...", "The company will...", "government-backed", "DoD-funded", "NASA-backed", "DARPA-backed", "government customer", "procurement-ready"
- Use calm, institutional, hedged language throughout

The article must follow this exact section structure:
1. Why this matters
2. The technical angle
3. The market position
4. What could go right
5. What could go wrong
6. The next twelve months

Also return openQuestions: an array of 2-4 specific questions that institutional analysts would need answered before reaching a high-confidence conclusion.

Return JSON only:
{"headline":"","dek":"","sections":[{"title":"","body":["",""]}],"openQuestions":[""]}

Facts:
${JSON.stringify(facts)}

Source summaries:
${JSON.stringify(summaries.slice(0, 8))}`;

  const response = await callOpenAIJson(
    prompt,
    "deeptechly_article",
    articleSchema
  );
  const sections = response?.sections as ArticleSection[] | undefined;
  const headline = typeof response?.headline === "string" ? response.headline : null;
  const dek = typeof response?.dek === "string" ? response.dek : null;
  const openQuestions = Array.isArray(response?.openQuestions)
    ? (response.openQuestions as string[]).filter((q) => typeof q === "string")
    : [];

  if (!headline || !dek || !sections || sections.length < 4) {
    return null;
  }

  return { headline, dek, sections, openQuestions };
}

async function aiDossierHighlights(
  facts: ExtractedEntityFacts,
  verification: ClaimVerification,
  summaries: SourceSummary[]
) {
  const prompt = `You are an institutional deep-tech diligence analyst writing for DeepTechly.

Generate only the executive summary and strategic outlook for a research dossier.
RULES:
- Never invent founders, funding, investors, customers, patents, revenue, or technical metrics
- Never claim government funding, contracts, customers, partnerships, endorsement, procurement interest, patent ownership, exclusivity, or active license unless explicitly source-backed
- Patent records can support technical relevance but not ownership, exclusivity, licensing status, market traction, or product readiness unless the source explicitly says so
- Government records can support public-sector relevance but do not imply funding, procurement, customer status, endorsement, or revenue
- Explicitly separate: confirmed facts (source-backed), inferred signals (publicly suggested), and unverified claims (not confirmed)
- Use: "Public sources indicate...", "Available evidence suggests...", "DeepTechly could not confirm...", "This appears to..."
- NEVER use: "This proves...", "Guaranteed...", "Revolutionary...", "Definitive...", "government-backed", "DoD-funded", "NASA-backed", "DARPA-backed", "government customer", "procurement-ready"
- Unknown fields must say: "Not confirmed in public sources"
- Keep language institutional and hedged — no promotional claims

Return JSON only:
{"executiveSummary":["","",""],"strategicOutlook":["","",""]}

Facts:
${JSON.stringify(facts)}

Verification:
${JSON.stringify(verification)}

Source summaries:
${JSON.stringify(summaries.slice(0, 8))}`;

  const response = await callOpenAIJson(
    prompt,
    "deeptechly_dossier_highlights",
    dossierHighlightsSchema
  );
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
  heroImage,
  resolution
}: {
  query: string;
  facts: ExtractedEntityFacts;
  verification: ClaimVerification;
  summaries: SourceSummary[];
  heroImage: string | null;
  resolution?: {
    slug: string;
    entityId?: string | null;
    entityType: string;
    inputType: EntityInputType;
    metadata: EntityResolutionMetadata;
  };
}): Promise<ResearchOutput> {
  const now = new Date().toISOString();
  const slug = resolution?.slug ?? slugify(facts.name || query);
  const sources = compactSources(summaries, facts);
  const sourceCount = Math.max(sources.length, facts.sourceUrls.length);
  const score = confidenceScoreForSources(summaries, verification);
  const label = confidenceLabel(score);
  const secondary = facts.secondarySectors.length
    ? facts.secondarySectors
    : ["Technology", "Government Relevance"];
  const aiArticle = await aiArticleSections(facts, summaries);
  const aiDossier = await aiDossierHighlights(facts, verification, summaries);
  const sections = aiArticle?.sections ?? fallbackArticleSections(facts);
  const openQuestions = aiArticle?.openQuestions?.length
    ? aiArticle.openQuestions
    : verification.unverified.length > 0
      ? verification.unverified.slice(0, 4)
      : [];
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
  const tags = [facts.sector, ...secondary].slice(0, 5);

  dossier.sources = sources;
  const sectorTags = storySectorTags({
    sector: facts.sector,
    secondarySectors: secondary,
    tags
  });
  const stageTag = inferStageTag({
    fundingStage: facts.fundingStage,
    stage: facts.fundingStage ?? "Generated research",
    sourceText: `${facts.productSummary} ${summaries
      .flatMap((summary) => [summary.title, ...summary.keyFacts, ...summary.claims])
      .join(" ")}`,
    trl: dossier.dataSnapshot.trl,
    mrl: dossier.dataSnapshot.mrl
  });
  const regionTag = inferRegionTag(
    facts.headquarters ?? facts.domain ?? facts.website ?? "UNKNOWN"
  );
  const articlePersona = selectDeeptechlyAgent(facts.sector, [
    ...sectorTags,
    facts.productSummary,
    ...facts.customerSegments
  ]);

  const entity: ResearchEntity = {
    id: resolution?.entityId ?? `entity_${randomUUID().slice(0, 8)}`,
    slug,
    name: facts.name,
    entityType: resolution?.entityType ?? "Company",
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
    sectorTags,
    stageTag,
    regionTag,
    entityTypeTag: resolution?.entityType ?? "Company",
    sourceCount,
    confidenceScore: score,
    confidenceLabel: label,
    lastResearchedAt: "just now",
    heroImage,
    publishedStatus: "draft",
    searchCount: 1,
    resolutionMetadata: resolution?.metadata,
    createdAt: now,
    updatedAt: now,
    externalLinks: externalLinks(facts),
    snapshot: {
      entityType: resolution?.entityType ?? "Company",
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
      dossierUrl: `/dossier/${slug}`,
      visualLabel: facts.sector.toUpperCase(),
      visualCaption: `${facts.name} extracted source visual`,
      sections,
      bodySections: sections,
      comparisonTable: {
        columns: ["Technology Layer", "Public Signal", "Constraint"],
        rows: comparisonRows(facts)
      },
      tags,
      sectorTags,
      stageTag,
      regionTag,
      entityTypeTag: resolution?.entityType ?? "Company",
      sources,
      openQuestions,
      publishedStatus: "draft"
    },
    dossier,
    sources,
    relatedEntities: []
  };

  const publishable = isPublishable(entity) || isCompletedResearchFeedEligible(entity);
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
    sectorTags,
    stageTag,
    regionTag,
    entityTypeTag: resolution?.entityType ?? "Company",
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
