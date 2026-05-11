import type { ResearchJob, StoredResearchArticle } from "@/lib/research/types";
import type { ResearchEntity } from "@/lib/types";

export const deeptechlyAgents = [
  {
    name: "Axon Reyes",
    role: "Systems Intelligence Analyst",
    focus: [
      "systems architecture",
      "robotics",
      "mission-critical infrastructure",
      "deployment risk"
    ]
  },
  {
    name: "Nyra Vale",
    role: "Space Infrastructure Analyst",
    focus: [
      "space",
      "orbital systems",
      "satellites",
      "in-space servicing",
      "cislunar infrastructure"
    ]
  },
  {
    name: "Kairo Bell",
    role: "Defense Technology Analyst",
    focus: ["defense", "dual-use systems", "autonomy", "ISR", "contested environments"]
  },
  {
    name: "Sable Okoro",
    role: "Semiconductor Intelligence Analyst",
    focus: [
      "semiconductors",
      "chip packaging",
      "RF systems",
      "power electronics",
      "materials"
    ]
  },
  {
    name: "Maren Holt",
    role: "Manufacturing Readiness Analyst",
    focus: ["manufacturing", "MRL", "supply chain", "industrial scaling", "qualification"]
  },
  {
    name: "Ilya Stone",
    role: "Patent and Lab Transfer Analyst",
    focus: [
      "patents",
      "research labs",
      "technology transfer",
      "IP position",
      "commercialization"
    ]
  },
  {
    name: "Talia Voss",
    role: "Energy Systems Analyst",
    focus: ["energy", "grid infrastructure", "storage", "thermal systems", "distributed power"]
  },
  {
    name: "Orin Cross",
    role: "Autonomy and Robotics Analyst",
    focus: ["robotics", "autonomy", "field systems", "inspection", "robotic deployment"]
  },
  {
    name: "Lena Marr",
    role: "Bioinfrastructure Analyst",
    focus: [
      "biotech infrastructure",
      "sensing",
      "medical systems",
      "lab automation",
      "health intelligence"
    ]
  },
  {
    name: "Daxon Pierce",
    role: "Capital and Commercialization Analyst",
    focus: ["business model", "capital intensity", "market entry", "procurement", "customer adoption"]
  },
  {
    name: "Eris Calder",
    role: "Risk and Constraints Analyst",
    focus: [
      "technical risk",
      "regulatory risk",
      "certification",
      "deployment constraints",
      "failure modes"
    ]
  },
  {
    name: "Nova Mensah",
    role: "Deep-Tech Narrative Analyst",
    focus: ["feature articles", "company profiles", "market framing", "research synthesis"]
  }
] as const;

export const fundingStageTags = [
  "PRE-SEED",
  "SEED",
  "SERIES A",
  "SERIES B",
  "SERIES C",
  "SERIES D+",
  "GROWTH",
  "BOOTSTRAPPED",
  "GRANT-FUNDED",
  "SBIR",
  "NON-DILUTIVE",
  "PUBLIC",
  "ACQUIRED",
  "UNKNOWN"
] as const;

export const readinessTags = [
  "TRL 1-3",
  "TRL 4-5",
  "TRL 6-7",
  "TRL 8-9",
  "MRL LOW",
  "MRL MEDIUM",
  "MRL HIGH",
  "PROTOTYPE",
  "PILOT",
  "FIELD TEST",
  "DEPLOYED"
] as const;

export const primarySectorTags = [
  "SPACE",
  "DEFENSE",
  "ROBOTICS",
  "ENERGY",
  "SEMICONDUCTORS"
] as const;

export const sectorTags = [
  "AEROSPACE",
  "AI INFRASTRUCTURE",
  "AUTONOMY",
  "BIOINFRASTRUCTURE",
  "CLIMATE SYSTEMS",
  "CYBER-PHYSICAL SYSTEMS",
  "DEEPTECH",
  "DEFENSE",
  "ENERGY",
  "HARDWARE",
  "INDUSTRIAL SYSTEMS",
  "MANUFACTURING",
  "MATERIALS",
  "PHOTONICS",
  "QUANTUM",
  "ROBOTICS",
  "SENSORS",
  "SEMICONDUCTORS",
  "SPACE",
  "SUPPLY CHAIN",
  "WATER SYSTEMS"
] as const;

export const regionTags = [
  "NORTH AMERICA",
  "UNITED STATES",
  "CANADA",
  "LATIN AMERICA",
  "WESTERN EUROPE",
  "EASTERN EUROPE",
  "UNITED KINGDOM",
  "MIDDLE EAST",
  "AFRICA",
  "WEST AFRICA",
  "EAST AFRICA",
  "SOUTHERN AFRICA",
  "NORTH AFRICA",
  "ASIA",
  "EAST ASIA",
  "SOUTH ASIA",
  "SOUTHEAST ASIA",
  "OCEANIA",
  "GLOBAL",
  "UNKNOWN"
] as const;

export type StoryMetadata = {
  id: string;
  slug: string;
  entitySlug: string;
  entityName: string;
  title: string;
  dek: string;
  authorPersona: string;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
  sectorTags: string[];
  stageTag?: string;
  regionTag?: string;
  entityTypeTag?: string;
  confidenceLabel?: string;
  isFavorite?: boolean;
  adminFeatured?: boolean;
  sourceCount?: number;
  confidenceScore?: number;
  articleUrl: string;
  profileUrl?: string;
  dossierUrl?: string;
};

export type StoryCardData = StoryMetadata & {
  headline: string;
  summary: string;
  heroImage: string | null;
  isGenerated: boolean;
};

const agentByKeyword: [string, string][] = [
  ["space", "Nyra Vale"],
  ["aerospace", "Nyra Vale"],
  ["defense", "Kairo Bell"],
  ["dual-use", "Kairo Bell"],
  ["robotics", "Orin Cross"],
  ["robot", "Orin Cross"],
  ["autonomy", "Orin Cross"],
  ["semiconductor", "Sable Okoro"],
  ["photonics", "Sable Okoro"],
  ["materials", "Sable Okoro"],
  ["manufacturing", "Maren Holt"],
  ["mrl", "Maren Holt"],
  ["energy", "Talia Voss"],
  ["climate", "Talia Voss"],
  ["sensor", "Axon Reyes"],
  ["bioinfrastructure", "Lena Marr"],
  ["health", "Lena Marr"],
  ["patent", "Ilya Stone"],
  ["lab", "Ilya Stone"],
  ["commercialization", "Daxon Pierce"],
  ["capital", "Daxon Pierce"],
  ["risk", "Eris Calder"]
];

export function selectDeeptechlyAgent(sector?: string | null, signals: string[] = []) {
  const normalizedSector = (sector ?? "").toLowerCase();
  if (normalizedSector.includes("semiconductor") || normalizedSector.includes("photonics")) {
    return "Sable Okoro";
  }
  if (normalizedSector.includes("robotics") || normalizedSector.includes("autonomy")) {
    return "Orin Cross";
  }
  if (normalizedSector.includes("energy") || normalizedSector.includes("climate")) {
    return "Talia Voss";
  }
  if (normalizedSector.includes("defense")) {
    return "Kairo Bell";
  }
  if (normalizedSector.includes("space") || normalizedSector.includes("aerospace")) {
    return "Nyra Vale";
  }
  if (normalizedSector.includes("manufacturing")) {
    return "Maren Holt";
  }
  if (normalizedSector.includes("material")) {
    return "Sable Okoro";
  }
  if (normalizedSector.includes("bio") || normalizedSector.includes("health")) {
    return "Lena Marr";
  }

  const haystack = [sector ?? "", ...signals].join(" ").toLowerCase();
  const match = agentByKeyword.find(([keyword]) => haystack.includes(keyword));
  return match?.[1] ?? "Nova Mensah";
}

export function normalizeDeeptechlyAgent(
  agentName: string | null | undefined,
  sector?: string | null,
  signals: string[] = []
) {
  if (agentName && deeptechlyAgents.some((agent) => agent.name === agentName)) {
    return agentName;
  }

  return selectDeeptechlyAgent(sector, signals);
}

export function formatByline(agentName: string) {
  return `BY ${agentName.toUpperCase()}`;
}

export function formatRelativeTime(date: string | Date) {
  const timestamp = date instanceof Date ? date.getTime() : new Date(date).getTime();
  if (Number.isNaN(timestamp)) return "JUST NOW";

  const elapsedSeconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return "JUST NOW";

  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}M AGO`;

  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}H AGO`;

  const elapsedDays = Math.round(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}D AGO`;

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function normalizeSectorTag(value?: string | null) {
  if (!value) return null;
  const tag = value
    .replace(/deep[-\s]?tech/i, "DEEPTECH")
    .replace(/semi[-\s]?conductors?/i, "SEMICONDUCTORS")
    .trim()
    .toUpperCase();

  if (tag === "DEEP TECH") return "DEEPTECH";
  if (sectorTags.includes(tag as (typeof sectorTags)[number])) return tag;
  if (primarySectorTags.includes(tag as (typeof primarySectorTags)[number])) return tag;
  return tag.length <= 24 ? tag : null;
}

export function storySectorTags(entity: Pick<ResearchEntity, "sector" | "secondarySectors" | "tags">) {
  const tags = [
    normalizeSectorTag(entity.sector),
    ...entity.secondarySectors.map(normalizeSectorTag),
    ...(entity.tags ?? []).map(normalizeSectorTag)
  ].filter((tag): tag is string => Boolean(tag));

  return Array.from(new Set(tags)).slice(0, 4);
}

export function inferStageTag(input: {
  fundingStage?: string | null;
  stage?: string | null;
  sourceText?: string | null;
  trl?: number | null;
  mrl?: number | null;
}) {
  const text = [input.fundingStage, input.stage, input.sourceText]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("pre-seed")) return "PRE-SEED";
  if (/\bseed\b/.test(text)) return "SEED";
  if (text.includes("series a")) return "SERIES A";
  if (text.includes("series b")) return "SERIES B";
  if (text.includes("series c")) return "SERIES C";
  if (/series\s+(d|e|f)|growth/.test(text)) return "SERIES D+";
  if (text.includes("bootstrapped")) return "BOOTSTRAPPED";
  if (text.includes("sbir")) return "SBIR";
  if (text.includes("grant")) return "GRANT-FUNDED";
  if (text.includes("non-dilutive")) return "NON-DILUTIVE";
  if (text.includes("public company") || text.includes("publicly traded")) return "PUBLIC";
  if (text.includes("acquired")) return "ACQUIRED";
  if (text.includes("pilot")) return "PILOT";
  if (text.includes("prototype")) return "PROTOTYPE";
  if (text.includes("field test")) return "FIELD TEST";
  if (text.includes("deployed")) return "DEPLOYED";

  if (typeof input.trl === "number") {
    if (input.trl <= 3) return "TRL 1-3";
    if (input.trl <= 5) return "TRL 4-5";
    if (input.trl <= 7) return "TRL 6-7";
    return "TRL 8-9";
  }

  if (typeof input.mrl === "number") {
    if (input.mrl <= 3) return "MRL LOW";
    if (input.mrl <= 6) return "MRL MEDIUM";
    return "MRL HIGH";
  }

  return "UNKNOWN";
}

export function inferRegionTag(value?: string | null) {
  if (!value) return "UNKNOWN";
  const text = value.toLowerCase();

  if (text.includes("unknown") || text.includes("not confirmed")) return "UNKNOWN";
  if (text.includes("global")) return "GLOBAL";
  if (
    text.includes("united states") ||
    text.includes("north america") ||
    /\bca\b/.test(text) ||
    /\bny\b/.test(text) ||
    /\btx\b/.test(text)
  ) {
    return "NORTH AMERICA";
  }
  if (text.includes("canada")) return "CANADA";
  if (text.includes("mexico") || text.includes("brazil") || text.includes("latin")) {
    return "LATIN AMERICA";
  }
  if (text.includes("united kingdom") || text.includes("london")) return "UNITED KINGDOM";
  if (
    text.includes("germany") ||
    text.includes("france") ||
    text.includes("spain") ||
    text.includes("italy") ||
    text.includes("netherlands") ||
    text.includes("western europe") ||
    text.includes("europe")
  ) {
    return "WESTERN EUROPE";
  }
  if (text.includes("nigeria") || text.includes("ghana")) return "WEST AFRICA";
  if (text.includes("kenya") || text.includes("ethiopia")) return "EAST AFRICA";
  if (text.includes("south africa")) return "SOUTHERN AFRICA";
  if (text.includes("africa")) return "AFRICA";
  if (text.includes("singapore") || text.includes("southeast asia")) {
    return "SOUTHEAST ASIA";
  }
  if (text.includes("china") || text.includes("japan") || text.includes("korea")) {
    return "EAST ASIA";
  }
  if (text.includes("india") || text.includes("south asia")) return "SOUTH ASIA";
  if (text.includes("australia") || text.includes("oceania")) return "OCEANIA";
  if (text.includes("asia")) return "ASIA";
  if (text.includes("middle east")) return "MIDDLE EAST";

  return "UNKNOWN";
}

export function storyTags(story: Pick<StoryCardData, "sectorTags" | "stageTag" | "regionTag">) {
  return [
    story.sectorTags[0] ?? "DEEPTECH",
    story.stageTag ?? "UNKNOWN",
    story.regionTag ?? "UNKNOWN"
  ].filter(Boolean);
}

export function storyFromEntity(entity: ResearchEntity): StoryCardData {
  const sectorTags = entity.article.sectorTags?.length
    ? entity.article.sectorTags
    : entity.sectorTags?.length
      ? entity.sectorTags
      : storySectorTags(entity);
  const stageTag =
    entity.article.stageTag ??
    entity.stageTag ??
    inferStageTag({
      fundingStage: entity.fundingStage,
      stage: entity.stage,
      trl: entity.dossier.dataSnapshot.trl,
      mrl: entity.dossier.dataSnapshot.mrl
    });
  const regionTag =
    entity.article.regionTag ??
    entity.regionTag ??
    inferRegionTag(entity.headquarters ?? entity.region);
  const authorPersona =
    normalizeDeeptechlyAgent(entity.article.authorPersona, entity.sector, [
      ...sectorTags,
      entity.summary
    ]);

  return {
    id: entity.article.entitySlug ?? entity.slug,
    slug: entity.slug,
    entitySlug: entity.slug,
    entityName: entity.name,
    title: entity.article.headline,
    headline: entity.article.headline,
    dek: entity.article.dek,
    summary: entity.summary,
    authorPersona,
    publishedAt: entity.article.publishedAt ?? entity.updatedAt ?? entity.createdAt ?? "",
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    sectorTags,
    stageTag,
    regionTag,
    entityTypeTag: entity.article.entityTypeTag ?? entity.entityTypeTag ?? entity.entityType,
    confidenceLabel: entity.confidenceLabel,
    adminFeatured: entity.article.adminFeatured,
    sourceCount: entity.sourceCount,
    confidenceScore: entity.confidenceScore,
    articleUrl: `/article/${entity.slug}`,
    profileUrl: `/startup/${entity.slug}`,
    dossierUrl: `/dossier/${entity.slug}`,
    heroImage: entity.heroImage ?? entity.article.heroImage ?? null,
    isGenerated: entity.stage === "Generated research"
  };
}

export function storyFromJob(job: ResearchJob): StoryCardData | null {
  const slug = job.feed?.slug ?? slugFromUrl(job.profileUrl ?? job.articleUrl);
  if (!slug) return null;

  const sectorTags = job.feed?.sectorTags?.length
    ? job.feed.sectorTags
    : [normalizeSectorTag(job.feed?.sector ?? "DEEPTECH") ?? "DEEPTECH"];
  const authorPersona =
    normalizeDeeptechlyAgent(job.feed?.authorPersona, job.feed?.sector, [
      job.feed?.summary ?? "",
      ...sectorTags
    ]);

  return {
    id: job.id,
    slug,
    entitySlug: slug,
    entityName: job.feed?.entityName ?? job.query,
    title: job.feed?.articleTitle ?? `${job.query} research profile is ready`,
    headline: job.feed?.articleTitle ?? `${job.query} research profile is ready`,
    dek:
      job.feed?.articleDek ??
      "DeepTechly generated a public article, profile, and investor dossier from the completed research job.",
    summary: job.feed?.summary ?? "Generated DeepTechly research profile.",
    authorPersona,
    publishedAt: job.feed?.publishedAt ?? job.completedAt ?? job.updatedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    sectorTags,
    stageTag: job.feed?.stageTag ?? "UNKNOWN",
    regionTag: job.feed?.regionTag ?? "UNKNOWN",
    entityTypeTag: job.feed?.entityTypeTag ?? "Company",
    confidenceLabel: job.feed?.confidenceLabel ?? "Generated",
    sourceCount: job.feed?.sourceCount ?? job.sourceCount,
    confidenceScore: job.feed?.confidenceScore,
    articleUrl: job.articleUrl ?? `/article/${slug}`,
    profileUrl: job.profileUrl ?? `/startup/${slug}`,
    dossierUrl: job.dossierUrl ?? `/dossier/${slug}`,
    heroImage: job.feed?.heroImage ?? null,
    isGenerated: true
  };
}

export function articleMetadataFromEntity(entity: ResearchEntity) {
  const story = storyFromEntity(entity);
  return {
    authorPersona: story.authorPersona,
    sectorTags: story.sectorTags,
    stageTag: story.stageTag,
    regionTag: story.regionTag,
    entityTypeTag: story.entityTypeTag
  };
}

export function articleMetadataFromStoredArticle(article: StoredResearchArticle) {
  const sectorTags = article.sectorTags?.length
    ? article.sectorTags
    : article.tags.map(normalizeSectorTag).filter((tag): tag is string => Boolean(tag));

  return {
    authorPersona:
      normalizeDeeptechlyAgent(article.authorPersona, sectorTags[0], article.tags),
    sectorTags,
    stageTag: article.stageTag ?? "UNKNOWN",
    regionTag: article.regionTag ?? "UNKNOWN",
    entityTypeTag: article.entityTypeTag ?? "Company"
  };
}

function slugFromUrl(url: string | null) {
  if (!url) return null;
  return url.split("/").filter(Boolean).at(-1) ?? null;
}
