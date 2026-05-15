import "server-only";

import { randomUUID } from "node:crypto";
import type {
  PublishedStatus,
  ResearchJob,
  ResearchMode,
  ResearchOutput,
  ResearchStage,
  ResearchStoreData,
  StoredDossier,
  StoredResearchArticle
} from "./types";
import type { ResearchEntity } from "@/lib/types";
import { queueProgressByStage } from "./display";
import { MIN_SOURCE_COUNT_TO_PUBLISH } from "./limits";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? null;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
const redisRestUrl =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? null;
const redisRestToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? null;
const storeKey =
  process.env.DEEPTECHLY_RESEARCH_STORE_KEY ?? "deeptechly:research-store:v1";

const initialStore: ResearchStoreData = {
  jobs: [],
  entities: [],
  articles: [],
  dossiers: [],
  searchEvents: []
};

declare global {
  var __deeptechlyResearchStore: ResearchStoreData | undefined;
}

// WARNING:
// In-memory storage is not reliable across Vercel serverless invocations.
// Use Supabase, Vercel Postgres, Neon, or Upstash for production.
// Temporary in-memory queue store.
// Replace with Supabase, Vercel Postgres, Neon, or Upstash for production persistence.
// Temporary in-memory store for Vercel demo mode.
// Replace with Supabase/Vercel Postgres before production persistence.
function getMemoryStore() {
  if (!globalThis.__deeptechlyResearchStore) {
    globalThis.__deeptechlyResearchStore = structuredClone(initialStore);
  }

  return globalThis.__deeptechlyResearchStore;
}

function normalizeStoreData(data: Partial<ResearchStoreData> | null | undefined) {
  return {
    ...structuredClone(initialStore),
    ...(data ?? {}),
    jobs: data?.jobs ?? [],
    entities: data?.entities ?? [],
    articles: data?.articles ?? [],
    dossiers: data?.dossiers ?? [],
    searchEvents: data?.searchEvents ?? []
  } satisfies ResearchStoreData;
}

function hasSupabaseStore() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function supabaseHeaders() {
  return {
    apikey: supabaseServiceRoleKey!,
    authorization: `Bearer ${supabaseServiceRoleKey}`,
    "content-type": "application/json"
  };
}

type ResearchJobRow = {
  data: ResearchJob | null;
};

type EntityRow = {
  id: string;
  slug: string;
  data: ResearchEntity | null;
};

type ArticleRow = {
  data: StoredResearchArticle | null;
};

type DossierRow = {
  data: StoredDossier | null;
};

async function readSupabaseStore() {
  if (!hasSupabaseStore()) {
    return structuredClone(initialStore);
  }

  const [jobs, entities, articles, dossiers] = await Promise.all([
    readSupabaseRows<ResearchJobRow>("research_jobs", "data", "updated_at.desc"),
    readSupabaseRows<EntityRow>("entities", "id,slug,data", "updated_at.desc"),
    readSupabaseRows<ArticleRow>("articles", "data", "updated_at.desc"),
    readSupabaseRows<DossierRow>("dossiers", "data", "updated_at.desc")
  ]);

  return normalizeStoreData({
    jobs: jobs.map((row) => row.data).filter(isPresent),
    entities: entities.map((row) => row.data).filter(isPresent),
    articles: articles.map((row) => row.data).filter(isPresent),
    dossiers: dossiers.map((row) => row.data).filter(isPresent),
    searchEvents: []
  });
}

async function writeSupabaseStore(data: ResearchStoreData) {
  if (!hasSupabaseStore()) {
    return false;
  }

  const normalized = normalizeStoreData(data);
  const entityRows = await upsertSupabaseRows<EntityRow>(
    "entities",
    "slug",
    normalized.entities.map(entityToRow),
    "id,slug,data"
  );
  const entityIdsBySlug = new Map(entityRows.map((row) => [row.slug, row.id]));

  const articleRows = await upsertSupabaseRows<{ id: string; slug: string }>(
    "articles",
    "slug",
    normalized.articles.map((article) =>
      articleToRow(article, entityIdsBySlug.get(article.slug) ?? null)
    ),
    "id,slug"
  );
  const articleIdsBySlug = new Map(articleRows.map((row) => [row.slug, row.id]));

  const dossierRows = await upsertSupabaseRows<{ id: string; slug: string }>(
    "dossiers",
    "slug",
    normalized.dossiers.map((dossier) =>
      dossierToRow(dossier, entityIdsBySlug.get(dossier.slug) ?? null)
    ),
    "id,slug"
  );
  const dossierIdsBySlug = new Map(dossierRows.map((row) => [row.slug, row.id]));

  await upsertSupabaseRows(
    "research_jobs",
    "id",
    normalized.jobs.map((job) =>
      jobToRow(
        job,
        job.feed?.slug ? entityIdsBySlug.get(job.feed.slug) ?? null : null,
        job.feed?.slug ? articleIdsBySlug.get(job.feed.slug) ?? null : null,
        job.feed?.slug ? dossierIdsBySlug.get(job.feed.slug) ?? null : null
      )
    ),
    "id"
  );

  await replaceSourceRows(normalized.entities, entityIdsBySlug);

  return true;
}

async function readSupabaseRows<T>(
  table: string,
  select: string,
  order?: string
) {
  const params = new URLSearchParams({ select });
  if (order) {
    params.set("order", order);
  }
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${params}`, {
    headers: supabaseHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Research Supabase read failed for ${table}: ${response.status}`);
  }

  return (await response.json()) as T[];
}

async function upsertSupabaseRows<T>(
  table: string,
  conflictTarget: string,
  rows: Record<string, unknown>[],
  select: string
) {
  if (rows.length === 0) {
    return [] as T[];
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflictTarget)}&select=${encodeURIComponent(select)}`,
    {
      method: "POST",
      headers: {
        ...supabaseHeaders(),
        prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(rows)
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Research Supabase write failed for ${table}: ${response.status} ${body}`);
  }

  return (await response.json()) as T[];
}

async function replaceSourceRows(
  entities: ResearchEntity[],
  entityIdsBySlug: Map<string, string>
) {
  for (const entity of entities) {
    const entityId = entityIdsBySlug.get(entity.slug);
    if (!entityId) {
      continue;
    }

    await fetch(`${supabaseUrl}/rest/v1/sources?entity_id=eq.${entityId}`, {
      method: "DELETE",
      headers: supabaseHeaders()
    });

    const rows = entity.sources.map((source) => ({
      id: randomUUID(),
      entity_id: entityId,
      title: source.title,
      url: source.url,
      publisher: source.publisher ?? null,
      source_type: source.type
    }));

    if (rows.length > 0) {
      await upsertSupabaseRows("sources", "id", rows, "id");
    }
  }
}

function entityToRow(entity: ResearchEntity) {
  const technicalSummary = [
    ...entity.dossier.productAndTechnology,
    ...(entity.dossier.productTechnologyFacts
      ? [entity.dossier.productTechnologyFacts.coreSystem]
      : [])
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    slug: entity.slug,
    name: entity.name,
    entity_type: entity.entityType,
    sector: entity.sector,
    region: entity.region,
    stage: entity.stage,
    summary: entity.summary,
    technical_summary: technicalSummary || entity.description,
    market_position: entity.dossier.companyPositioning.whereItCompetes,
    competitive_landscape: entity.dossier.competitiveLandscape
      .map((item) => `${item.companyOrApproach}: ${item.relevance}`)
      .join("\n"),
    confidence: entity.confidenceLabel,
    source_count: entity.sourceCount,
    published: entity.publishedStatus !== "draft",
    data: entity,
    created_at: entity.createdAt ?? new Date().toISOString(),
    updated_at: entity.updatedAt ?? new Date().toISOString()
  };
}

function articleToRow(article: StoredResearchArticle, entityId: string | null) {
  return {
    entity_id: entityId,
    slug: article.slug,
    title: article.title,
    dek: article.dek,
    body_md: articleToMarkdown(article),
    sector: article.sectorTags?.[0] ?? null,
    author_name: article.authorPersona,
    confidence: null,
    source_count: article.sources.length,
    hero_image_url: article.heroImage,
    published: article.publishedStatus === "published",
    published_at: article.publishedAt,
    data: article,
    created_at: article.createdAt,
    updated_at: article.updatedAt
  };
}

function dossierToRow(dossier: StoredDossier, entityId: string | null) {
  return {
    entity_id: entityId,
    slug: dossier.slug,
    public_md: dossierToPublicMarkdown(dossier),
    institutional_md: dossierToInstitutionalMarkdown(dossier),
    confidence: dossier.dossier.accuracyAndConfidence.label,
    source_count: dossier.dossier.sources.length,
    published: dossier.publishedStatus === "published",
    data: dossier,
    created_at: dossier.createdAt,
    updated_at: dossier.updatedAt
  };
}

function jobToRow(
  job: ResearchJob,
  entityId: string | null,
  articleId: string | null,
  dossierId: string | null
) {
  return {
    id: job.id,
    user_id: job.userId ?? null,
    entity_name: job.feed?.entityName ?? job.resolvedName ?? job.query,
    entity_type: job.mode,
    input_query: job.query,
    status: job.stage,
    stage: stageMessage(job.stage).message,
    progress: job.progress,
    source_count: job.sourceCount,
    confidence: job.feed?.confidenceLabel ?? null,
    article_id: articleId,
    entity_id: entityId,
    dossier_id: dossierId,
    error_message: job.error,
    data: job,
    created_at: job.createdAt,
    updated_at: job.updatedAt
  };
}

function articleToMarkdown(article: StoredResearchArticle) {
  return [
    `# ${article.title}`,
    article.dek,
    ...article.bodySections.map((section) =>
      [`## ${section.title}`, ...section.body].join("\n\n")
    ),
    "## Sources",
    ...article.sources.map((source) => `- [${source.title}](${source.url})`)
  ].join("\n\n");
}

function dossierToPublicMarkdown(dossier: StoredDossier) {
  return [
    "# Research Dossier",
    "## Overview",
    ...dossier.dossier.executiveSummary,
    "## Technical Summary",
    ...dossier.dossier.productAndTechnology,
    "## Market Position",
    ...dossier.dossier.marketResearch,
    "## Competitive Landscape",
    ...dossier.dossier.competitiveLandscape.map(
      (item) => `- ${item.companyOrApproach}: ${item.relevance}`
    ),
    "## Sources",
    ...dossier.dossier.sources.map((source) => `- [${source.title}](${source.url})`)
  ].join("\n\n");
}

function dossierToInstitutionalMarkdown(dossier: StoredDossier) {
  return [
    "## Technology Stack",
    dossier.dossier.productTechnologyFacts.coreSystem,
    "## White-Space Analysis",
    ...dossier.dossier.opportunity.technical,
    "## Government Relevance",
    ...dossier.dossier.opportunity.government,
    "## Patent Position",
    ...dossier.dossier.accuracyAndConfidence.inferred,
    "## Revenue Scenarios",
    ...dossier.dossier.revenueAndUnitEconomics.map(
      (path) => `${path.path}: ${path.whatMustBeTrue}`
    ),
    "## Strategic Outlook",
    ...dossier.dossier.strategicOutlook
  ].join("\n\n");
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function hasRedisStore() {
  return Boolean(redisRestUrl && redisRestToken);
}

async function readRedisStore() {
  if (!hasRedisStore()) {
    return structuredClone(initialStore);
  }

  const response = await fetch(
    `${redisRestUrl}/get/${encodeURIComponent(storeKey)}`,
    {
      headers: {
        authorization: `Bearer ${redisRestToken}`
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(`Research Redis read failed: ${response.status}`);
  }

  const body = (await response.json()) as { result?: string | ResearchStoreData | null };
  if (!body.result) {
    return structuredClone(initialStore);
  }

  if (typeof body.result === "string") {
    return normalizeStoreData(JSON.parse(body.result) as ResearchStoreData);
  }

  return normalizeStoreData(body.result);
}

async function writeRedisStore(data: ResearchStoreData) {
  if (!hasRedisStore()) {
    return false;
  }

  const response = await fetch(
    `${redisRestUrl}/set/${encodeURIComponent(storeKey)}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${redisRestToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    throw new Error(`Research Redis write failed: ${response.status}`);
  }

  return true;
}

export const progressByStage: Record<ResearchStage, number> = queueProgressByStage;

const statusLabelByStage: Record<ResearchStage, ResearchJob["statusLabel"]> = {
  queued: "QUEUED",
  resolving_entity: "SEARCHING",
  finding_official_domain: "SEARCHING",
  confirming_company_identity: "SEARCHING",
  searching_web: "SEARCHING",
  reading_homepage: "SEARCHING",
  reading_technical_pages: "SEARCHING",
  distilling_facts: "SEARCHING",
  filling_gaps: "SEARCHING",
  verifying_claims: "SEARCHING",
  mapping_technology_stack: "ANALYZING",
  mapping_government_relevance: "ANALYZING",
  estimating_readiness: "ANALYZING",
  drafting_outputs: "WRITING",
  publishing_article: "WRITING",
  publishing_profile: "FINALIZING",
  finalizing_dossier: "FINALIZING",
  public_research_ready: "READY",
  done: "DONE",
  failed: "FAILED",
  cancelled: "CANCELLED"
};

export function stageMessage(stage: ResearchStage, domain?: string | null) {
  const targetDomain = domain ?? "source domain";
  const mapping: Record<ResearchStage, { message: string; detail: string }> = {
    queued: { message: "Queued", detail: "Waiting to begin research" },
    resolving_entity: {
      message: "Resolving entity",
      detail: "Checking whether the submission is a domain, company, lab, patent, or public program"
    },
    finding_official_domain: {
      message: "Finding official domain",
      detail: "Searching public sources for the most likely official website"
    },
    confirming_company_identity: {
      message: "Confirming company identity",
      detail: "Comparing source signals before continuing into the research workflow"
    },
    searching_web: {
      message: "Searching the web",
      detail: "Finding public sources, company pages, articles, and technical references"
    },
    reading_homepage: {
      message: `Reading homepage of ${targetDomain}`,
      detail: "Extracting title, metadata, images, and important internal links"
    },
    reading_technical_pages: {
      message: `Reading technical pages from ${targetDomain}`,
      detail: "Scanning product, technology, team, careers, and news pages"
    },
    distilling_facts: {
      message: "Distilling structured facts",
      detail: "Normalizing entity, sector, product, customer, and source fields"
    },
    filling_gaps: {
      message:
        "Filling gaps: founders, headquarters, founded year, funding, patents, papers, open roles",
      detail: "Running follow-up searches for high-value missing fields"
    },
    verifying_claims: {
      message: "Verifying claims",
      detail:
        "8 follow-up searches: team, technology, funding, patents, market, customers, open roles, verify"
    },
    mapping_technology_stack: {
      message: "Mapping technology stack",
      detail:
        "Product, architecture, materials, software, hardware, and deployment environment"
    },
    mapping_government_relevance: {
      message: "Mapping government relevance",
      detail: "DARPA, NASA, SBIR, DoD, DOE, and Space Force relevance"
    },
    estimating_readiness: {
      message: "Estimating readiness",
      detail: "TRL, MRL, certification, manufacturing, and deployment constraints"
    },
    drafting_outputs: {
      message:
        "Drafting article, public profile, and investor dossier in parallel",
      detail: "Axon Reyes, Sable Okoro, and Ilya Stone are preparing public and institutional outputs."
    },
    publishing_article: {
      message: "Article published. Finalizing research dossier",
      detail: "Applying publish rule and feed eligibility checks"
    },
    publishing_profile: {
      message: "Public profile published",
      detail: "Profile is available from the research queue and generated profile route"
    },
    finalizing_dossier: {
      message: "Finalizing institutional dossier",
      detail: "Attaching sources, confidence labels, scenarios, and locked investor sections"
    },
    public_research_ready: {
      message: "Public research ready",
      detail: "Article and profile are published. Institutional dossier is still finalizing."
    },
    done: {
      message: "Research complete",
      detail: "Article, profile, and institutional dossier are ready."
    },
    failed: {
      message: "Research failed",
      detail:
        "DeepTechly could not identify enough reliable public sources to generate a high-confidence profile."
    },
    cancelled: {
      message: "Cancelled",
      detail: "This research job was cancelled before publication."
    }
  };

  return mapping[stage];
}

export async function readStore(): Promise<ResearchStoreData> {
  if (hasSupabaseStore()) {
    try {
      const data = await readSupabaseStore();
      globalThis.__deeptechlyResearchStore = data;
      return data;
    } catch (error) {
      throw error;
    }
  }

  if (hasRedisStore()) {
    try {
      const data = await readRedisStore();
      globalThis.__deeptechlyResearchStore = data;
      return data;
    } catch (error) {
      console.error("Persistent research store unavailable", error);
    }
  }

  return getMemoryStore();
}

export async function writeStore(data: ResearchStoreData) {
  const normalizedData = normalizeStoreData(data);

  if (hasSupabaseStore()) {
    try {
      await writeSupabaseStore(normalizedData);
      globalThis.__deeptechlyResearchStore = normalizedData;
      return;
    } catch (error) {
      throw error;
    }
  }

  if (hasRedisStore()) {
    try {
      await writeRedisStore(normalizedData);
      globalThis.__deeptechlyResearchStore = normalizedData;
      return;
    } catch (error) {
      console.error("Persistent research store unavailable", error);
    }
  }

  globalThis.__deeptechlyResearchStore = normalizedData;
}

export function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || `entity-${Date.now()}`;
}

export function normalizeQuery(query: string) {
  return query.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export async function createResearchJob(
  query: string,
  mode: ResearchMode,
  userId?: string | null
) {
  const now = new Date().toISOString();
  const normalizedQuery = normalizeQuery(query);
  const stage = "queued" satisfies ResearchStage;
  const copy = stageMessage(stage, normalizedQuery.includes(".") ? normalizedQuery : null);
  const data = await readStore();

  const job: ResearchJob = {
    id: randomUUID(),
    userId: userId ?? null,
    query,
    normalizedQuery,
    mode,
    stage,
    progress: progressByStage[stage],
    message: copy.message,
    detail: copy.detail,
    statusLabel: statusLabelByStage[stage],
    sourceCount: 0,
    resolvedDomain: null,
    resolvedName: null,
    resolutionStatus: null,
    stageStartedAt: now,
    publicResearchReadyAt: null,
    cancellationRequested: false,
    error: null,
    articleId: null,
    entityId: null,
    dossierId: null,
    articleUrl: null,
    profileUrl: null,
    dossierUrl: null,
    feed: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null
  };

  data.jobs = [job, ...data.jobs].slice(0, 50);
  await writeStore(data);
  return job;
}

export async function updateResearchJob(
  id: string,
  patch: Partial<ResearchJob> & { stage?: ResearchStage }
) {
  const data = await readStore();
  const index = data.jobs.findIndex((job) => job.id === id);

  if (index < 0) {
    return null;
  }

  const nextStage = patch.stage ?? data.jobs[index].stage;
  const copy = patch.stage ? stageMessage(nextStage, data.jobs[index].normalizedQuery) : null;
  const currentProgress = data.jobs[index].progress;
  const nextProgress =
    nextStage === "failed" || nextStage === "cancelled"
      ? patch.progress ?? currentProgress
      : Math.max(currentProgress, patch.progress ?? progressByStage[nextStage]);
  const updated: ResearchJob = {
    ...data.jobs[index],
    ...patch,
    progress: nextProgress,
    statusLabel: patch.statusLabel ?? statusLabelByStage[nextStage],
    message: patch.message ?? copy?.message ?? data.jobs[index].message,
    detail: patch.detail ?? copy?.detail ?? data.jobs[index].detail,
    stageStartedAt:
      patch.stage && patch.stage !== data.jobs[index].stage
        ? new Date().toISOString()
        : (patch.stageStartedAt ?? data.jobs[index].stageStartedAt),
    updatedAt: new Date().toISOString()
  };

  data.jobs[index] = updated;
  await writeStore(data);
  return updated;
}

export async function getResearchJob(id: string) {
  const data = await readStore();
  return data.jobs.find((job) => job.id === id) ?? null;
}

export async function listResearchJobs(userId?: string | null) {
  const data = await readStore();
  const scopedJobs = userId
    ? data.jobs.filter((job) => job.userId === userId)
    : data.jobs;
  const rank = (job: ResearchJob) => {
    if (isActiveResearchStage(job.stage)) return 0;
    if (job.stage === "public_research_ready") return 1;
    if (job.stage === "done") return 1;
    return 2;
  };
  const timestamp = (job: ResearchJob) =>
    job.stage === "done"
      ? job.completedAt ?? job.updatedAt
      : job.updatedAt ?? job.createdAt;

  return [...scopedJobs].sort((a, b) => {
    const rankDelta = rank(a) - rank(b);
    if (rankDelta !== 0) return rankDelta;
    return timestamp(b).localeCompare(timestamp(a));
  });
}

export async function getResearchJobs() {
  return listResearchJobs();
}

export async function saveGeneratedEntity(entity: ResearchEntity) {
  const data = await readStore();
  data.entities = [
    entity,
    ...data.entities.filter((item) => item.slug !== entity.slug)
  ].slice(0, 100);
  await writeStore(data);
  return entity;
}

export async function saveGeneratedArticle(article: StoredResearchArticle) {
  const data = await readStore();
  data.articles = [
    article,
    ...data.articles.filter((item) => item.slug !== article.slug)
  ].slice(0, 100);
  await writeStore(data);
  return article;
}

export async function saveGeneratedDossier(dossier: StoredDossier) {
  const data = await readStore();
  data.dossiers = [
    dossier,
    ...data.dossiers.filter((item) => item.slug !== dossier.slug)
  ].slice(0, 100);
  await writeStore(data);
  return dossier;
}

export async function listPublishedArticles() {
  const data = await readStore();
  return data.articles
    .filter((article) => article.publishedStatus === "published")
    .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt));
}

export async function listPublishedEntities() {
  const data = await readStore();
  return data.entities
    .filter((entity) => entity.publishedStatus === "published")
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export function isPublishable(entity: ResearchEntity) {
  return Boolean(
    entity.sourceCount >= MIN_SOURCE_COUNT_TO_PUBLISH &&
      entity.article.headline &&
      entity.article.sections.length >= 4 &&
      entity.name &&
      entity.summary &&
      entity.dossier.executiveSummary.length > 0 &&
      entity.confidenceScore >= 50
  );
}

export function isCompletedResearchFeedEligible(entity: ResearchEntity) {
  return Boolean(
    entity.article.headline &&
      entity.article.dek &&
      entity.article.sections.length >= 4 &&
      entity.name &&
      entity.summary &&
      entity.dossier.executiveSummary.length > 0 &&
      entity.confidenceScore >= 50
  );
}

export async function saveResearchOutput(jobId: string, output: ResearchOutput) {
  const data = await readStore();
  const now = new Date().toISOString();
  const publishStatus: PublishedStatus = output.publishable ? "published" : "draft";
  const entity = {
    ...output.entity,
    publishedStatus: publishStatus,
    updatedAt: now
  };
  const article: StoredResearchArticle = {
    ...output.article,
    publishedStatus: publishStatus,
    publishedAt: output.publishable ? output.article.publishedAt ?? now : null,
    updatedAt: now
  };
  const dossier: StoredDossier = {
    ...output.dossier,
    publishedStatus: publishStatus,
    updatedAt: now
  };

  data.entities = [
    entity,
    ...data.entities.filter((item) => item.slug !== entity.slug)
  ].slice(0, 100);
  data.articles = [
    article,
    ...data.articles.filter((item) => item.slug !== article.slug)
  ].slice(0, 100);
  data.dossiers = [
    dossier,
    ...data.dossiers.filter((item) => item.slug !== dossier.slug)
  ].slice(0, 100);

  const jobIndex = data.jobs.findIndex((job) => job.id === jobId);
  if (jobIndex >= 0) {
    data.jobs[jobIndex] = {
      ...data.jobs[jobIndex],
      stage: "done",
      progress: 100,
      statusLabel: "DONE",
      message: "Done",
      detail: publishStatus === "published" ? "Research complete and published" : "Research complete as draft",
      sourceCount: entity.sourceCount,
      entityId: entity.id ?? entity.slug,
      articleId: article.id,
      dossierId: dossier.id,
      articleUrl: `/article/${entity.slug}`,
      profileUrl: `/startup/${entity.slug}`,
      dossierUrl: `/dossier/${entity.slug}`,
      feed: {
        slug: entity.slug,
        entityName: entity.name,
        articleTitle: article.title,
        articleDek: article.dek,
        summary: entity.summary,
        sector: entity.sector,
        confidenceLabel: entity.confidenceLabel,
        confidenceScore: entity.confidenceScore,
        sourceCount: entity.sourceCount,
        heroImage: entity.heroImage ?? article.heroImage ?? null,
        authorPersona: article.authorPersona,
        sectorTags: article.sectorTags ?? entity.article.sectorTags ?? entity.sectorTags ?? [],
        stageTag: article.stageTag ?? entity.article.stageTag ?? entity.stageTag ?? "UNKNOWN",
        regionTag: article.regionTag ?? entity.article.regionTag ?? entity.regionTag ?? "UNKNOWN",
        entityTypeTag:
          article.entityTypeTag ??
          entity.article.entityTypeTag ??
          entity.entityTypeTag ??
          entity.entityType,
        publishedAt: article.publishedAt ?? now
      },
      completedAt: now,
      updatedAt: now
    };
  }

  await writeStore(data);
  return { entity, article, dossier };
}

export async function savePublicResearchReady(jobId: string, output: ResearchOutput) {
  const data = await readStore();
  const now = new Date().toISOString();
  const publishStatus: PublishedStatus = output.publishable ? "published" : "draft";
  const entity = {
    ...output.entity,
    publishedStatus: publishStatus,
    updatedAt: now
  };
  const article: StoredResearchArticle = {
    ...output.article,
    publishedStatus: publishStatus,
    publishedAt: output.publishable ? output.article.publishedAt ?? now : null,
    updatedAt: now
  };

  data.entities = [
    entity,
    ...data.entities.filter((item) => item.slug !== entity.slug)
  ].slice(0, 100);
  data.articles = [
    article,
    ...data.articles.filter((item) => item.slug !== article.slug)
  ].slice(0, 100);

  const jobIndex = data.jobs.findIndex((job) => job.id === jobId);
  if (jobIndex >= 0) {
    data.jobs[jobIndex] = {
      ...data.jobs[jobIndex],
      stage: "public_research_ready",
      progress: Math.max(data.jobs[jobIndex].progress, progressByStage.public_research_ready),
      statusLabel: "READY",
      message: "Public research ready",
      detail: "Article and profile are published. Institutional dossier is still finalizing.",
      sourceCount: entity.sourceCount,
      entityId: entity.id ?? entity.slug,
      articleId: article.id,
      articleUrl: `/article/${entity.slug}`,
      profileUrl: `/startup/${entity.slug}`,
      dossierUrl: null,
      publicResearchReadyAt: now,
      updatedAt: now,
      feed: {
        slug: entity.slug,
        entityName: entity.name,
        articleTitle: article.title,
        articleDek: article.dek,
        summary: entity.summary,
        sector: entity.sector,
        confidenceLabel: entity.confidenceLabel,
        confidenceScore: entity.confidenceScore,
        sourceCount: entity.sourceCount,
        heroImage: entity.heroImage ?? article.heroImage ?? null,
        authorPersona: article.authorPersona,
        sectorTags: article.sectorTags ?? entity.article.sectorTags ?? entity.sectorTags ?? [],
        stageTag: article.stageTag ?? entity.article.stageTag ?? entity.stageTag ?? "UNKNOWN",
        regionTag: article.regionTag ?? entity.article.regionTag ?? entity.regionTag ?? "UNKNOWN",
        entityTypeTag:
          article.entityTypeTag ??
          entity.article.entityTypeTag ??
          entity.entityTypeTag ??
          entity.entityType,
        publishedAt: article.publishedAt ?? now
      }
    };
  }

  await writeStore(data);
  return { entity, article };
}

export async function cancelResearchJob(id: string) {
  const copy = stageMessage("cancelled");
  return updateResearchJob(id, {
    stage: "cancelled",
    statusLabel: "CANCELLED",
    message: copy.message,
    detail: copy.detail,
    cancellationRequested: true,
    completedAt: new Date().toISOString()
  });
}

export async function removeResearchJob(id: string) {
  const data = await readStore();
  data.jobs = data.jobs.filter((job) => job.id !== id);
  await writeStore(data);
}

export function isActiveResearchStage(stage: ResearchStage) {
  return !["done", "failed", "cancelled", "public_research_ready"].includes(stage);
}

export async function recordSearchEvent(jobId: string, query: string, provider: string, resultCount: number) {
  const data = await readStore();
  data.searchEvents = [
    {
      id: `search_${randomUUID().slice(0, 8)}`,
      jobId,
      query,
      provider,
      resultCount,
      createdAt: new Date().toISOString()
    },
    ...data.searchEvents
  ].slice(0, 200);
  await writeStore(data);
}
