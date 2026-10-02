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
import { entities as seedEntities } from "@/lib/data";
import {
  buildEntityCandidates,
  classifyEntityInput,
  createCanonicalSlug,
  createCollisionSafeSlug,
  entityTypeForInput,
  metadataForResolution,
  resolveExistingEntity,
  type EntityCandidate
} from "./entity-resolution";
import { queueProgressByStage } from "./display";
import {
  isCompletedFeedEligible,
  isPublicationEligible
} from "@deeptechly/research";
import {
  buildInputFingerprint,
  buildJobLockKey,
  isActiveResearchStatus,
  MAX_RESEARCH_JOB_ATTEMPTS
} from "./orchestration";
import { buildTargetEntityAnchor } from "./entity-anchor";
import {
  isV2PostgresStoreSelected,
  readV2PostgresStore,
  writeV2PostgresStore
} from "./postgres-store";

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

// Deterministic development fallback. Configured deployments use PostgreSQL.
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
  if (isV2PostgresStoreSelected()) {
    const data = await readV2PostgresStore();
    globalThis.__deeptechlyResearchStore = data;
    return data;
  }

  return getMemoryStore();
}

export async function writeStore(data: ResearchStoreData) {
  const normalizedData = normalizeStoreData(data);

  if (isV2PostgresStoreSelected()) {
    await writeV2PostgresStore(normalizedData);
    globalThis.__deeptechlyResearchStore = normalizedData;
    return;
  }

  globalThis.__deeptechlyResearchStore = normalizedData;
}

export function slugify(value: string) {
  return createCanonicalSlug(value);
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
  const inputType = classifyEntityInput(query);
  const targetEntity = buildTargetEntityAnchor({
    query,
    requestedEntityType: inputType
  });
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
    entityInputType: inputType,
    requested_entity_name: targetEntity.requestedEntityName,
    requested_entity_query: targetEntity.requestedEntityQuery,
    requested_entity_type: targetEntity.requestedEntityType,
    normalized_requested_entity_name: targetEntity.normalizedRequestedEntityName,
    stageStartedAt: now,
    active_started_at: null,
    stage_started_at: now,
    last_heartbeat_at: null,
    retry_count: 0,
    previous_failure_code: null,
    previous_failure_stage: null,
    previous_failure_message_internal: null,
    publicResearchReadyAt: null,
    cancellationRequested: false,
    failedStage: null,
    failure_code: null,
    failure_stage: null,
    failure_message_internal: null,
    failure_generated_entity_name: null,
    failure_generated_slug: null,
    failure_suspected_source_publisher: null,
    profile_status: "missing",
    article_status: "missing",
    dossier_status: "missing",
    completion_mode: undefined,
    profile_error_internal: null,
    article_error_internal: null,
    dossier_error_internal: null,
    error: null,
    articleId: null,
    entityId: null,
    dossierId: null,
    articleUrl: null,
    profileUrl: null,
    dossierUrl: null,
    orchestration: {
      lockKey: buildJobLockKey({ query, normalizedQuery }),
      inputFingerprint: buildInputFingerprint(query),
      attemptCount: 0,
      maxAttempts: MAX_RESEARCH_JOB_ATTEMPTS,
      lastRunStartedAt: null,
      lastRunFinishedAt: null,
      nextRetryAt: null,
      retryable: false,
      failureType: null,
      stuckMarkedAt: null
    },
    feed: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null
  };

  data.jobs = [job, ...data.jobs].slice(0, 50);
  await writeStore(data);
  return job;
}

export async function createLinkedResearchJob(
  query: string,
  mode: ResearchMode,
  userId: string | null | undefined,
  entity: ResearchEntity
) {
  const data = await readStore();
  const now = new Date().toISOString();
  const inputType = classifyEntityInput(query);
  const targetEntity = buildTargetEntityAnchor({
    query,
    requestedEntityType: inputType
  });
  const candidate = buildEntityCandidates({
    input: query,
    name: entity.name,
    entityType: entity.entityType,
    domain: entity.domain ?? entity.website,
    sources: entity.sources
  });
  const match = resolveExistingEntity(candidate, [entity]);
  const article = data.articles.find((item) => item.slug === entity.slug);
  const dossier = data.dossiers.find((item) => item.slug === entity.slug);
  const publishedAt = article?.publishedAt ?? entity.article.publishedAt ?? now;

  const job: ResearchJob = {
    id: randomUUID(),
    userId: userId ?? null,
    query,
    normalizedQuery: normalizeQuery(query),
    mode,
    stage: "done",
    progress: 100,
    message: "Done",
    detail: "Existing public research matched this entity.",
    statusLabel: "DONE",
    sourceCount: entity.sourceCount,
    resolvedDomain: entity.domain ?? null,
    resolvedName: entity.name,
    resolutionStatus: "resolved",
    entityInputType: inputType,
    requested_entity_name: targetEntity.requestedEntityName,
    requested_entity_query: targetEntity.requestedEntityQuery,
    requested_entity_type: targetEntity.requestedEntityType,
    normalized_requested_entity_name: targetEntity.normalizedRequestedEntityName,
    resolutionMetadata: metadataForResolution(candidate, match),
    stageStartedAt: now,
    active_started_at: null,
    stage_started_at: now,
    last_heartbeat_at: null,
    retry_count: 0,
    previous_failure_code: null,
    previous_failure_stage: null,
    previous_failure_message_internal: null,
    publicResearchReadyAt: publishedAt,
    cancellationRequested: false,
    failedStage: null,
    failure_code: null,
    failure_stage: null,
    failure_message_internal: null,
    failure_generated_entity_name: null,
    failure_generated_slug: null,
    failure_suspected_source_publisher: null,
    profile_status: "published",
    article_status: "published",
    dossier_status: dossier ? "published" : "missing",
    completion_mode: entity.confidenceLabel === "LIMITED PUBLIC DATA" ? "limited_public_data" : "full",
    error: null,
    articleId: article?.id ?? entity.article.entitySlug ?? entity.slug,
    entityId: entity.id ?? entity.slug,
    dossierId: dossier?.id ?? entity.slug,
    articleUrl: `/article/${entity.slug}`,
    profileUrl: `/startup/${entity.slug}`,
    dossierUrl: `/dossier/${entity.slug}`,
    orchestration: {
      lockKey: buildJobLockKey({
        query,
        normalizedQuery: normalizeQuery(query),
        resolvedDomain: entity.domain ?? entity.website,
        resolvedName: entity.name,
        slug: entity.slug
      }),
      inputFingerprint: buildInputFingerprint(query),
      attemptCount: 0,
      maxAttempts: MAX_RESEARCH_JOB_ATTEMPTS,
      lastRunStartedAt: now,
      lastRunFinishedAt: now,
      nextRetryAt: null,
      retryable: false,
      failureType: null,
      stuckMarkedAt: null
    },
    feed: {
      slug: entity.slug,
      entityName: entity.name,
      articleTitle: entity.article.headline,
      articleDek: entity.article.dek,
      summary: entity.summary,
      sector: entity.sector,
      confidenceLabel: entity.confidenceLabel,
      confidenceScore: entity.confidenceScore,
      sourceCount: entity.sourceCount,
      heroImage:
        entity.article.heroImageUrl ??
        entity.article.heroImage ??
        entity.heroImageUrl ??
        entity.heroImage ??
        entity.logoUrl ??
        entity.article.entityLogoUrl ??
        entity.faviconUrl ??
        entity.article.faviconUrl ??
        entity.article.sourceOgImageUrl ??
        null,
      authorPersona: entity.article.authorPersona,
      sectorTags: entity.article.sectorTags ?? entity.sectorTags ?? [],
      stageTag: entity.article.stageTag ?? entity.stageTag ?? "UNKNOWN",
      regionTag: entity.article.regionTag ?? entity.regionTag ?? "UNKNOWN",
      entityTypeTag: entity.article.entityTypeTag ?? entity.entityTypeTag ?? entity.entityType,
      publishedAt
    },
    createdAt: now,
    updatedAt: now,
    completedAt: now
  };

  data.jobs = [job, ...data.jobs].slice(0, 50);
  await writeStore(data);
  return job;
}

export async function findReusableEntityForInput(query: string) {
  const data = await readStore();
  const candidate = buildEntityCandidates({ input: query });
  const match = resolveExistingEntity(candidate, allKnownResearchEntities(data.entities));

  return match?.confidence === "high" ? match : null;
}

export async function resolveCanonicalEntity(candidate: EntityCandidate) {
  const data = await readStore();
  const knownEntities = allKnownResearchEntities(data.entities);
  const match = resolveExistingEntity(candidate, knownEntities);
  const reusable = match?.confidence === "high" ? match : null;
  const slug = reusable
    ? reusable.entity.slug
    : createCollisionSafeSlug(candidate, knownEntities);

  return {
    slug,
    match: reusable,
    metadata: metadataForResolution(candidate, reusable),
    entityType: reusable?.entity.entityType ?? entityTypeForInput(candidate.inputType)
  };
}

function allKnownResearchEntities(generated: ResearchEntity[]) {
  const generatedSlugs = new Set(generated.map((entity) => entity.slug));
  return [
    ...generated,
    ...seedEntities.filter((entity) => !generatedSlugs.has(entity.slug))
  ];
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
  const stageChanged = Boolean(patch.stage && patch.stage !== data.jobs[index].stage);
  const now = new Date().toISOString();
  const nextIsActive = isActiveResearchStage(nextStage);
  const hasActiveStartedPatch = Object.prototype.hasOwnProperty.call(patch, "active_started_at");
  const hasStageStartedPatch = Object.prototype.hasOwnProperty.call(patch, "stage_started_at");
  const hasHeartbeatPatch = Object.prototype.hasOwnProperty.call(patch, "last_heartbeat_at");
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
      stageChanged
        ? now
        : (patch.stageStartedAt ?? data.jobs[index].stageStartedAt),
    stage_started_at:
      hasStageStartedPatch
        ? patch.stage_started_at
        : (stageChanged ? now : (data.jobs[index].stage_started_at ?? data.jobs[index].stageStartedAt)),
    active_started_at:
      hasActiveStartedPatch
        ? patch.active_started_at
        : (nextIsActive
          ? data.jobs[index].active_started_at ?? now
          : data.jobs[index].active_started_at ?? null),
    last_heartbeat_at:
      hasHeartbeatPatch
        ? patch.last_heartbeat_at
        : (nextIsActive ? data.jobs[index].last_heartbeat_at ?? now : data.jobs[index].last_heartbeat_at ?? null),
    updatedAt: now
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
    if (job.stage === "queued") return 1;
    if (job.stage === "public_research_ready") return 1;
    if (job.stage === "done") return 2;
    return 3;
  };
  const timestamp = (job: ResearchJob) =>
    job.stage === "queued"
      ? job.createdAt
      : job.stage === "done"
      ? job.completedAt ?? job.updatedAt
      : job.updatedAt ?? job.createdAt;

  return [...scopedJobs].sort((a, b) => {
    const rankDelta = rank(a) - rank(b);
    if (rankDelta !== 0) return rankDelta;
    if (a.stage === "queued" && b.stage === "queued") {
      return timestamp(a).localeCompare(timestamp(b));
    }
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
  return isPublicationEligible(entity);
}

export function isCompletedResearchFeedEligible(entity: ResearchEntity) {
  return isCompletedFeedEligible(entity);
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
      failedStage: null,
      failure_code: null,
      failure_stage: null,
      failure_message_internal: null,
      failure_generated_entity_name: null,
      failure_generated_slug: null,
      failure_suspected_source_publisher: null,
      profile_status: "published",
      article_status: "published",
      dossier_status: "published",
      completion_mode: entity.confidenceLabel === "LIMITED PUBLIC DATA" ? "limited_public_data" : "full",
      entityId: entity.id ?? entity.slug,
      articleId: article.id,
      dossierId: dossier.id,
      articleUrl: `/article/${entity.slug}`,
      profileUrl: `/startup/${entity.slug}`,
      dossierUrl: `/dossier/${entity.slug}`,
      orchestration: {
        ...data.jobs[jobIndex].orchestration,
        lockKey:
          data.jobs[jobIndex].orchestration?.lockKey ??
          buildJobLockKey({
            query: data.jobs[jobIndex].query,
            normalizedQuery: data.jobs[jobIndex].normalizedQuery,
            resolvedDomain: entity.domain ?? entity.website,
            resolvedName: entity.name,
            slug: entity.slug
          }),
        inputFingerprint:
          data.jobs[jobIndex].orchestration?.inputFingerprint ??
          buildInputFingerprint(data.jobs[jobIndex].query),
        attemptCount: data.jobs[jobIndex].orchestration?.attemptCount ?? 1,
        maxAttempts: data.jobs[jobIndex].orchestration?.maxAttempts ?? MAX_RESEARCH_JOB_ATTEMPTS,
        lastRunFinishedAt: now,
        nextRetryAt: null,
        retryable: false,
        failureType: null
      },
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
        heroImage:
          article.heroImageUrl ??
          article.heroImage ??
          entity.heroImageUrl ??
          entity.heroImage ??
          entity.logoUrl ??
          article.entityLogoUrl ??
          entity.faviconUrl ??
          article.faviconUrl ??
          article.sourceOgImageUrl ??
          null,
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
      failedStage: null,
      failure_code: null,
      failure_stage: null,
      failure_message_internal: null,
      failure_generated_entity_name: null,
      failure_generated_slug: null,
      failure_suspected_source_publisher: null,
      profile_status: "published",
      article_status: "published",
      dossier_status: "missing",
      completion_mode: entity.confidenceLabel === "LIMITED PUBLIC DATA" ? "limited_public_data" : "partial",
      entityId: entity.id ?? entity.slug,
      articleId: article.id,
      articleUrl: `/article/${entity.slug}`,
      profileUrl: `/startup/${entity.slug}`,
      dossierUrl: null,
      orchestration: {
        ...data.jobs[jobIndex].orchestration,
        lockKey:
          data.jobs[jobIndex].orchestration?.lockKey ??
          buildJobLockKey({
            query: data.jobs[jobIndex].query,
            normalizedQuery: data.jobs[jobIndex].normalizedQuery,
            resolvedDomain: entity.domain ?? entity.website,
            resolvedName: entity.name,
            slug: entity.slug
          }),
        inputFingerprint:
          data.jobs[jobIndex].orchestration?.inputFingerprint ??
          buildInputFingerprint(data.jobs[jobIndex].query),
        attemptCount: data.jobs[jobIndex].orchestration?.attemptCount ?? 1,
        maxAttempts: data.jobs[jobIndex].orchestration?.maxAttempts ?? MAX_RESEARCH_JOB_ATTEMPTS,
        nextRetryAt: null,
        retryable: false,
        failureType: null
      },
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
        heroImage:
          article.heroImageUrl ??
          article.heroImage ??
          entity.heroImageUrl ??
          entity.heroImage ??
          entity.logoUrl ??
          article.entityLogoUrl ??
          entity.faviconUrl ??
          article.faviconUrl ??
          article.sourceOgImageUrl ??
          null,
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
  const job = await getResearchJob(id);
  const failureStage = job?.stage && job.stage !== "cancelled" ? job.stage : null;

  return updateResearchJob(id, {
    stage: "cancelled",
    statusLabel: "CANCELLED",
    message: copy.message,
    detail: copy.detail,
    cancellationRequested: true,
    failedStage: failureStage,
    failure_code: "job_cancelled",
    failure_stage: failureStage,
    failure_message_internal: "Research job cancelled by user.",
    completedAt: new Date().toISOString()
  });
}

export async function removeResearchJob(id: string) {
  const data = await readStore();
  data.jobs = data.jobs.filter((job) => job.id !== id);
  await writeStore(data);
}

export function isActiveResearchStage(stage: ResearchStage) {
  return isActiveResearchStatus(stage);
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
