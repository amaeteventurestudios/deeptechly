import { APERTURE_METHODOLOGY_VERSION } from "@deeptechly/aperture";
import type {
  ApertureAgency,
  ApertureEvidencePack,
  ApertureOpportunity,
  ApertureProblem,
  ApertureSignal,
  ApertureSource
} from "@deeptechly/aperture";

export const dodAgency: ApertureAgency = {
  slug: "department-of-defense",
  name: "U.S. Department of Defense",
  abbreviation: "DoD",
  officialDomain: "defense.gov",
  summary: "Department-wide demand signals drawn from official defense releases, budget material, and Defense Innovation Unit reporting."
};

const replicatorSources: ApertureSource[] = [
  {
    title: "Hicks Discusses Replicator Initiative",
    url: "https://www.defense.gov/News/News-Stories/Article/Article/3518827/hicks-discusses-replicator-initiative/",
    publisher: "U.S. Department of Defense",
    documentType: "leadership remarks",
    publishedAt: "2023-09-07"
  },
  {
    title: "Implementing the Department of Defense Replicator Initiative at Speed and Scale",
    url: "https://www.diu.mil/latest/implementing-the-department-of-defense-replicator-initiative-to-accelerate",
    publisher: "Defense Innovation Unit",
    documentType: "program implementation update",
    publishedAt: "2023-11-30"
  },
  {
    title: "First Tranche of Replicator Capabilities Focused on All-Domain Attritable Autonomous Systems",
    url: "https://www.defense.gov/News/Releases/Release/Article/3765644/deputy-secretary-of-defense-hicks-announces-first-tranche-of-replicator-capabil/",
    publisher: "U.S. Department of Defense",
    documentType: "official release",
    publishedAt: "2024-05-06"
  },
  {
    title: "Additional Replicator All-Domain Attritable Autonomous Capabilities",
    url: "https://www.defense.gov/News/Releases/Release/Article/3963289/deputy-secretary-of-defense-kathleen-hicks-announces-additional-replicator-all/",
    publisher: "U.S. Department of Defense",
    documentType: "official release",
    publishedAt: "2024-11-13"
  },
  {
    title: "A Pathway to Scaling Unmanned Weapon Systems",
    url: "https://innovation.defense.gov/Portals/63/DIB%20A%20Pathway%20to%20Scaling%20Unmanned%20Weapon%20Systems_250113%20PUBLISHED.pdf",
    publisher: "Defense Innovation Board",
    documentType: "public report",
    publishedAt: "2025-01-13"
  }
];

export const replicatorSignal: ApertureSignal = {
  kind: "signal",
  slug: "scalable-attritable-autonomy",
  title: "DoD repeated demand for scalable attritable autonomy",
  summary: "Official DoD and DIU material published from 2023 through 2025 repeatedly emphasized rapid fielding, scalable production, and integrated software for all-domain attritable autonomous systems.",
  agency: dodAgency,
  signalType: "repeated program demand",
  confidenceLabel: "HIGH CONFIDENCE",
  sourceCount: replicatorSources.length,
  firstObservedAt: "2023-09-07",
  lastObservedAt: "2025-01-13",
  agencyAsk: [
    "Field large numbers of comparatively low-cost, attritable autonomous systems across multiple operating domains.",
    "Accelerate validated capabilities from selection into production and warfighter use rather than treating autonomy only as a research activity.",
    "Use commercial and nontraditional suppliers alongside traditional defense vendors to expand the available industrial base."
  ],
  problemStatement: [
    "DoD described a need to counter an adversary's advantage in military mass without relying only on small numbers of individually expensive platforms.",
    "The public material also identified process and production barriers between commercially available technology, validated operational needs, and fielding at meaningful scale."
  ],
  evidenceBase: [
    "The 2023 announcement set an objective of fielding attritable autonomous systems in multiple thousands and multiple domains.",
    "The May and November 2024 releases identified selected air, surface, strike, counter-UAS, test-vehicle, and collaborative-autonomy capabilities and described production or fielding activity.",
    "The 2025 Defense Innovation Board report treated Replicator as one element of a broader unmanned-systems scaling pathway and discussed fragmentation across the ecosystem."
  ],
  technicalRequirements: [
    "Affordable or attritable system economics compatible with deployment in quantity.",
    "Modular payloads and, for relevant programs, open architectures that support iteration and subsystem integration.",
    "Collaborative autonomy and resilient communications able to continue in disconnected, disrupted, low-bandwidth, or intermittent conditions.",
    "Production, test, and integration pathways capable of moving selected systems into operational use on accelerated timelines."
  ],
  repeatedSignals: [
    "Scale and accelerated fielding recur across the initial announcement, implementation update, tranche releases, budget framing, and later Defense Innovation Board analysis.",
    "The source set broadens from autonomous platforms to enabling software, communications, modularity, production, and portfolio coordination."
  ],
  relatedCompanies: [
    "Official releases named AeroVironment, Anduril Industries, Performance Drone Works, Leidos Dynetics, Integrated Solutions for Systems, and Zone 5 Technologies in selected or prototype efforts; naming does not imply future awards."
  ],
  relatedPatents: [],
  relatedLabs: [],
  opportunityRead: [
    "The evidence supports demand for both platforms and enabling layers: resilient autonomy software, communications, modular integration, test infrastructure, and scalable production.",
    "This is a documented capability direction, not a forecast that any specific company will win procurement or reach required readiness."
  ],
  sources: replicatorSources,
  methodologyVersion: APERTURE_METHODOLOGY_VERSION,
  published: true
};

export const autonomyScalingProblem: ApertureProblem = {
  kind: "problem",
  slug: "autonomy-at-operational-scale",
  title: "Moving autonomous systems from selection to operational scale",
  summary: "The public evidence points to a combined fielding problem: quantity, affordability, production, integration, resilient coordination, and accelerated transition into operational use.",
  problemText: "DoD needs to field distributed autonomous capability at meaningful scale while reducing the cost, integration friction, production delay, communications fragility, and long support tails associated with traditional platform acquisition.",
  agency: dodAgency,
  confidenceLabel: "HIGH CONFIDENCE",
  sourceCount: replicatorSources.length,
  evidence: replicatorSignal.evidenceBase,
  technicalRequirements: replicatorSignal.technicalRequirements,
  relatedSignalSlugs: [replicatorSignal.slug],
  sources: replicatorSources,
  methodologyVersion: APERTURE_METHODOLOGY_VERSION,
  published: true
};

export const autonomyOpportunity: ApertureOpportunity = {
  kind: "opportunity",
  slug: "attritable-autonomy-enablers",
  title: "Enabling layers for attritable autonomy at scale",
  summary: "Aperture maps the repeated demand to enabling layers spanning production, modular integration, collaborative autonomy, resilient communications, test, and fielding support.",
  confidenceLabel: "MODERATE CONFIDENCE",
  sourceCount: replicatorSources.length,
  problemStatement: [autonomyScalingProblem.problemText],
  demandPattern: replicatorSignal.repeatedSignals,
  requirementMap: replicatorSignal.technicalRequirements,
  companyMatches: [
    "Official releases named selected or prototype vendors, but company-level matching requires separate evidence for the specific requirement, readiness, and acquisition path."
  ],
  patentMatches: [],
  labMatches: [],
  opportunityRead: [
    "The strongest public signal is not one airframe category; it is the need to integrate and field heterogeneous autonomous systems quickly and in quantity.",
    "Potentially relevant capability layers include resilient coordination software, modular payload integration, low-cost manufacturing, test automation, secure communications, and deployment support.",
    "The map should be treated as a diligence queue. It does not establish a solicitation, addressable market size, award probability, or a match for any unreviewed vendor."
  ],
  sources: replicatorSources,
  methodologyVersion: APERTURE_METHODOLOGY_VERSION,
  published: true
};

export const replicatorEvidencePack: ApertureEvidencePack = {
  slug: "replicator-attritable-autonomy",
  title: "Replicator attritable-autonomy evidence pack",
  summary: "Five official public documents supporting the signal, problem statement, requirement map, and bounded opportunity read.",
  subjectType: "signal",
  subjectSlug: replicatorSignal.slug,
  confidenceLabel: replicatorSignal.confidenceLabel,
  sources: replicatorSources,
  methodologyVersion: APERTURE_METHODOLOGY_VERSION,
  published: true
};

export const curatedApertureSignals = [replicatorSignal];
export const curatedApertureProblems = [autonomyScalingProblem];
export const curatedApertureOpportunities = [autonomyOpportunity];
export const curatedApertureAgencies = [dodAgency];
export const curatedApertureEvidencePacks = [replicatorEvidencePack];
