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

const storeKey =
  process.env.DEEPTECHLY_RESEARCH_STORE_KEY ?? "deeptechly:research-store:v1";
const redisRestUrl =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? null;
const redisRestToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? null;

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
// Temporary in-memory store for Vercel demo mode.
// Replace with Supabase/Vercel Postgres before production persistence.
function getMemoryStore() {
  if (!globalThis.__deeptechlyResearchStore) {
    globalThis.__deeptechlyResearchStore = structuredClone(initialStore);
  }

  return globalThis.__deeptechlyResearchStore;
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
    return { ...structuredClone(initialStore), ...JSON.parse(body.result) } as ResearchStoreData;
  }

  return { ...structuredClone(initialStore), ...body.result };
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

export const progressByStage: Record<ResearchStage, number> = {
  queued: 2,
  searching_web: 8,
  reading_homepage: 18,
  reading_technical_pages: 28,
  distilling_facts: 38,
  filling_gaps: 52,
  verifying_claims: 68,
  mapping_technology_stack: 76,
  mapping_government_relevance: 82,
  estimating_readiness: 88,
  drafting_outputs: 93,
  publishing_article: 96,
  publishing_profile: 98,
  finalizing_dossier: 99,
  done: 100,
  failed: 100
};

const statusLabelByStage: Record<ResearchStage, ResearchJob["statusLabel"]> = {
  queued: "QUEUED",
  searching_web: "SEARCHING",
  reading_homepage: "SEARCHING",
  reading_technical_pages: "SEARCHING",
  distilling_facts: "ANALYZING",
  filling_gaps: "ANALYZING",
  verifying_claims: "ANALYZING",
  mapping_technology_stack: "ANALYZING",
  mapping_government_relevance: "ANALYZING",
  estimating_readiness: "ANALYZING",
  drafting_outputs: "WRITING",
  publishing_article: "PUBLISHING",
  publishing_profile: "PUBLISHING",
  finalizing_dossier: "PUBLISHING",
  done: "DONE",
  failed: "FAILED"
};

export function stageMessage(stage: ResearchStage, domain?: string | null) {
  const targetDomain = domain ?? "source domain";
  const mapping: Record<ResearchStage, { message: string; detail: string }> = {
    queued: { message: "Queued", detail: "Research job accepted" },
    searching_web: {
      message: "Searching the web",
      detail: "Collecting public source candidates"
    },
    reading_homepage: {
      message: `Reading homepage of ${targetDomain}`,
      detail: "Extracting title, meta description, images, and important internal links"
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
        "Drafting article (Viral Bernstein), public profile (Rhea Mendoza), and investor profile (Marcus Okonkwo) in parallel",
      detail: "AI analyst personas are preparing public and institutional outputs"
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
    done: { message: "Done", detail: "Research complete" },
    failed: { message: "Research failed", detail: "The research job could not be completed" }
  };

  return mapping[stage];
}

export async function readStore(): Promise<ResearchStoreData> {
  if (hasRedisStore()) {
    try {
      return await readRedisStore();
    } catch (error) {
      console.error("Persistent research store unavailable", error);
    }
  }

  return getMemoryStore();
}

export async function writeStore(data: ResearchStoreData) {
  if (hasRedisStore()) {
    try {
      await writeRedisStore(data);
      return;
    } catch (error) {
      console.error("Persistent research store unavailable", error);
    }
  }

  globalThis.__deeptechlyResearchStore = data;
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

export async function createResearchJob(query: string, mode: ResearchMode) {
  const now = new Date().toISOString();
  const normalizedQuery = normalizeQuery(query);
  const stage = "queued" satisfies ResearchStage;
  const copy = stageMessage(stage, normalizedQuery.includes(".") ? normalizedQuery : null);
  const data = await readStore();

  const job: ResearchJob = {
    id: `job_${randomUUID().slice(0, 8)}`,
    query,
    normalizedQuery,
    mode,
    stage,
    progress: progressByStage[stage],
    message: copy.message,
    detail: copy.detail,
    statusLabel: statusLabelByStage[stage],
    sourceCount: 0,
    error: null,
    articleId: null,
    entityId: null,
    dossierId: null,
    articleUrl: null,
    profileUrl: null,
    dossierUrl: null,
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
  const updated: ResearchJob = {
    ...data.jobs[index],
    ...patch,
    progress: patch.progress ?? progressByStage[nextStage],
    statusLabel: patch.statusLabel ?? statusLabelByStage[nextStage],
    message: patch.message ?? copy?.message ?? data.jobs[index].message,
    detail: patch.detail ?? copy?.detail ?? data.jobs[index].detail,
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

export async function listResearchJobs() {
  const data = await readStore();
  return data.jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
    entity.sourceCount >= 3 &&
      entity.article.headline &&
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
      dossierUrl: `/startup/${entity.slug}`,
      completedAt: now,
      updatedAt: now
    };
  }

  await writeStore(data);
  return { entity, article, dossier };
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
