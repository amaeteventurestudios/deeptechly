import "server-only";

import {
  extractEntityFacts,
  summarizeSources,
  verifyClaims
} from "./extract";
import { generateResearchOutput } from "./generate";
import {
  MAX_GLOBAL_CONCURRENT_JOBS,
  MAX_PAGES_READ,
  MAX_SOURCE_COUNT,
  MAX_STAGE_TIME,
  MAX_TECHNICAL_PAGES,
  MAX_TOTAL_JOB_TIME,
  MAX_WEB_SEARCHES,
  MIN_SOURCE_COUNT_TO_PUBLISH
} from "./limits";
import {
  buildEntityCandidates,
  classifyEntityInput,
  entityTypeForInput
} from "./entity-resolution";
import {
  getResearchJob,
  isActiveResearchStage,
  listResearchJobs,
  progressByStage,
  recordSearchEvent,
  resolveCanonicalEntity,
  savePublicResearchReady,
  saveResearchOutput,
  updateResearchJob
} from "./store";
import {
  buildInputFingerprint,
  buildJobLockKey,
  getMaxAttempts,
  nextAttempt,
  RETRYABLE_RESEARCH_FAILURE_COPY,
  safeMarkJobFailed
} from "./orchestration";
import {
  domainToUrl,
  fetchReadablePage,
  isProbableDomain,
  pickImportantInternalLinks,
  searchWeb,
  selectHeroImage
} from "./search";
import { normalizeSearchResults } from "./source-quality";
import type { ReadablePage, ResearchStage, SearchResult } from "./types";

const stageDelayMs = Number(process.env.RESEARCH_STAGE_DELAY_MS ?? 450);

class ResearchCancelledError extends Error {
  constructor() {
    super("Research job cancelled");
  }
}

class ResearchTimeoutError extends Error {
  constructor() {
    super("Research job exceeded the maximum allowed runtime");
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function elapsed(startedAt: number) {
  return Date.now() - startedAt;
}

async function ensureRunnable(jobId: string, startedAt: number) {
  const job = await getResearchJob(jobId);
  if (!job || job.stage === "cancelled" || job.cancellationRequested) {
    throw new ResearchCancelledError();
  }

  if (elapsed(startedAt) > MAX_TOTAL_JOB_TIME) {
    throw new ResearchTimeoutError();
  }

  return job;
}

async function withStageLimit<T>(operation: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    operation,
    wait(MAX_STAGE_TIME).then(() => fallback)
  ]);
}

async function waitForGlobalTurn(jobId: string, startedAt: number) {
  while (true) {
    await ensureRunnable(jobId, startedAt);
    const jobs = await listResearchJobs();
    const activeJobs = jobs.filter((job) => isActiveResearchStage(job.stage));
    const position = activeJobs.findIndex((job) => job.id === jobId);

    if (position < 0 || position < MAX_GLOBAL_CONCURRENT_JOBS) {
      return;
    }

    await updateResearchJob(jobId, {
      detail: `BUSY QUEUE: there are ${position} research jobs ahead of yours. You can safely close this tab and come back later.`
    });
    await wait(5000);
  }
}

async function move(
  jobId: string,
  stage: ResearchStage,
  startedAt: number,
  patch: Partial<Awaited<ReturnType<typeof getResearchJob>>> = {}
) {
  await ensureRunnable(jobId, startedAt);
  await updateResearchJob(jobId, {
    stage,
    progress: progressByStage[stage],
    ...patch
  });
  await wait(stageDelayMs);
  await ensureRunnable(jobId, startedAt);
}

async function safeFetch(url: string) {
  try {
    return await withStageLimit(fetchReadablePage(url), null);
  } catch {
    return null;
  }
}

async function safeSearch(query: string) {
  try {
    return await withStageLimit(searchWeb(query), [] as SearchResult[]);
  } catch {
    return [];
  }
}

function followUpQueries(name: string) {
  return [
    `${name} founders`,
    `${name} headquarters founded year`,
    `${name} funding investors`,
    `${name} jobs careers`,
    `${name} patents`,
    `${name} research paper`,
    `${name} government contract SBIR`,
    `${name} NASA DARPA DOE DoD`,
    `${name} customers product technology`
  ];
}

function resolverQueries(name: string) {
  return [
    `${name} official website`,
    `${name} company`,
    `${name} LinkedIn`,
    `${name} startup`,
    `${name} about`,
    `${name} technology`,
    `${name} press`
  ];
}

function hostFromUrl(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isLikelyOfficialResult(result: SearchResult, query: string) {
  const host = hostFromUrl(result.url);
  const lowerUrl = result.url.toLowerCase();
  const lowerTitle = result.title.toLowerCase();
  const queryTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);

  if (!host || lowerUrl.includes("linkedin") || lowerUrl.includes("crunchbase")) {
    return false;
  }
  if (
    host === "example.com" ||
    lowerUrl.includes("patents.google") ||
    lowerUrl.includes("sbir.gov") ||
    lowerUrl.includes("google.com/search") ||
    lowerUrl.includes("wikipedia.org")
  ) {
    return false;
  }

  return queryTokens.some((token) => host.includes(token) || lowerTitle.includes(token));
}

async function resolveEntity(jobId: string, query: string, startedAt: number) {
  const inputType = classifyEntityInput(query);
  const normalized = query.replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  if (isProbableDomain(query)) {
    const domain = normalized.replace(/^www\./, "");
    await updateResearchJob(jobId, {
      resolvedDomain: domain,
      resolutionStatus: "resolved",
      detail: "Domain detected. Beginning homepage research."
    });
    return {
      researchQuery: domain,
      domain,
      inputType,
      searchResults: [] as SearchResult[],
      searchesUsed: 0
    };
  }

  await move(jobId, "resolving_entity", startedAt);

  if (!["company", "domain", "lab"].includes(inputType)) {
    await updateResearchJob(jobId, {
      resolvedDomain: null,
      resolvedName: query,
      resolutionStatus: "limited",
      entityInputType: inputType,
      detail: `Classified input as ${entityTypeForInput(inputType).toLowerCase()}. Continuing with public-source research.`
    });
    return {
      researchQuery: query,
      domain: null,
      inputType,
      searchResults: [] as SearchResult[],
      searchesUsed: 0
    };
  }

  await move(jobId, "finding_official_domain", startedAt);

  const queries = resolverQueries(query).slice(0, 3);
  const resultGroups: SearchResult[][] = [];
  for (const resolverQuery of queries) {
    await ensureRunnable(jobId, startedAt);
    resultGroups.push(await safeSearch(resolverQuery));
    await recordSearchEvent(
      jobId,
      resolverQuery,
      process.env.SEARCH_PROVIDER ?? "openai",
      resultGroups.at(-1)?.length ?? 0
    );
  }
  const searchResults = normalizeSearchResults(resultGroups.flat());
  const official = searchResults.find((result) => isLikelyOfficialResult(result, query));
  const domain = official ? hostFromUrl(official.url) : null;

  await move(jobId, "confirming_company_identity", startedAt, {
    resolvedDomain: domain,
    resolvedName: query,
    resolutionStatus: domain ? "resolved" : "limited",
    message: domain ? "Confirming company identity" : "Limited resolution",
    detail: domain
      ? `Official domain candidate identified: ${domain}`
      : "DeepTechly could not confirm an official domain yet. Continuing with public-source research."
  });

  return {
    researchQuery: domain ?? query,
    domain,
    inputType,
    searchResults,
    searchesUsed: queries.length
  };
}

async function collectSources({
  jobId,
  originalQuery,
  resolvedQuery,
  resolvedDomain,
  startedAt,
  resolverResults,
  searchesUsed
}: {
  jobId: string;
  originalQuery: string;
  resolvedQuery: string;
  resolvedDomain: string | null;
  startedAt: number;
  resolverResults: SearchResult[];
  searchesUsed: number;
}) {
  const homepageUrl = resolvedDomain
    ? domainToUrl(resolvedDomain)
    : isProbableDomain(originalQuery)
      ? domainToUrl(originalQuery)
      : null;
  const pages: ReadablePage[] = [];
  let searchResults: SearchResult[] = normalizeSearchResults(resolverResults);
  let homepage: ReadablePage | null = null;
  let usedSearches = searchesUsed;

  await move(jobId, "reading_homepage", startedAt, {
    resolvedDomain,
    detail: homepageUrl
      ? "Extracting title, metadata, images, and important internal links."
      : "No official homepage confirmed yet. Continuing with public-source research."
  });
  homepage = homepageUrl ? await safeFetch(homepageUrl) : null;

  await move(jobId, "searching_web", startedAt);
  if (usedSearches < MAX_WEB_SEARCHES) {
    const primaryResults = await safeSearch(resolvedQuery);
    usedSearches += 1;
    searchResults = normalizeSearchResults([...searchResults, ...primaryResults]);
    await recordSearchEvent(
      jobId,
      resolvedQuery,
      process.env.SEARCH_PROVIDER ?? "openai",
      primaryResults.length
    );
  }

  if (!homepage) {
    const firstLikely = searchResults.find((result) =>
      /^https?:\/\//i.test(result.url)
    );
    homepage = firstLikely ? await safeFetch(firstLikely.url) : null;
  }

  if (homepage) {
    pages.push(homepage);
  }

  await move(jobId, "reading_technical_pages", startedAt);
  const internalLinks = homepage ? pickImportantInternalLinks(homepage) : [];
  const technicalPages = (
    await Promise.all(
      internalLinks
        .slice(0, Math.min(MAX_TECHNICAL_PAGES, MAX_PAGES_READ - pages.length))
        .map((link) => safeFetch(link))
    )
  ).filter((page): page is ReadablePage => Boolean(page));
  pages.push(...technicalPages);

  return {
    homepage,
    pages: pages.slice(0, MAX_PAGES_READ),
    searchResults: normalizeSearchResults(searchResults).slice(0, MAX_SOURCE_COUNT),
    searchesUsed: usedSearches
  };
}

export async function runResearchJob(jobId: string, query: string) {
  const startedAt = Date.now();

  try {
    const currentJob = await getResearchJob(jobId);
    if (!currentJob) return;
    await updateResearchJob(jobId, {
      orchestration: {
        ...currentJob.orchestration,
        lockKey:
          currentJob.orchestration?.lockKey ??
          buildJobLockKey({
            query: currentJob.query,
            normalizedQuery: currentJob.normalizedQuery,
            resolvedDomain: currentJob.resolvedDomain,
            resolvedName: currentJob.resolvedName,
            slug: currentJob.feed?.slug ?? null
          }),
        inputFingerprint:
          currentJob.orchestration?.inputFingerprint ?? buildInputFingerprint(query),
        attemptCount: nextAttempt(currentJob),
        maxAttempts: getMaxAttempts(currentJob),
        lastRunStartedAt: new Date(startedAt).toISOString(),
        lastRunFinishedAt: null,
        nextRetryAt: null,
        retryable: false,
        failureType: null
      }
    });

    if (!process.env.OPENAI_API_KEY) {
      console.log("OPENAI_API_KEY missing. Running research job in demo mode.");
    }

    await waitForGlobalTurn(jobId, startedAt);
    const resolution = await resolveEntity(jobId, query, startedAt);
    const { homepage, pages, searchResults, searchesUsed } = await collectSources({
      jobId,
      originalQuery: query,
      resolvedQuery: resolution.researchQuery,
      resolvedDomain: resolution.domain,
      startedAt,
      resolverResults: resolution.searchResults,
      searchesUsed: resolution.searchesUsed
    });

    await move(jobId, "distilling_facts", startedAt, {
      sourceCount: pages.length + searchResults.length
    });
    let summaries = summarizeSources(pages, searchResults).slice(0, MAX_SOURCE_COUNT);
    let facts = extractEntityFacts(resolution.researchQuery, homepage, summaries);

    await move(jobId, "filling_gaps", startedAt, {
      sourceCount: summaries.length
    });
    const missingQueries = followUpQueries(facts.name).slice(
      0,
      Math.max(0, MAX_WEB_SEARCHES - searchesUsed)
    );
    const followUpResults = (
      await Promise.all(missingQueries.map((item) => safeSearch(item)))
    ).flat();
    await recordSearchEvent(
      jobId,
      `${facts.name} gap fill`,
      process.env.SEARCH_PROVIDER ?? "openai",
      followUpResults.length
    );
    summaries = summarizeSources(
      pages,
      normalizeSearchResults([...searchResults, ...followUpResults])
    ).slice(0, MAX_SOURCE_COUNT);
    facts = extractEntityFacts(resolution.researchQuery, homepage, summaries);

    await move(jobId, "verifying_claims", startedAt, {
      sourceCount: summaries.length
    });
    const verification = verifyClaims(facts, summaries);
    const entityCandidate = buildEntityCandidates({
      input: query,
      name: facts.name,
      entityType: entityTypeForInput(resolution.inputType),
      domain: facts.domain ?? resolution.domain,
      sources: summaries
    });
    const canonicalEntity = await resolveCanonicalEntity(entityCandidate);
    await updateResearchJob(jobId, {
      resolvedName: canonicalEntity.match?.entity.name ?? facts.name,
      resolutionStatus: canonicalEntity.match ? "resolved" : "limited",
      entityInputType: resolution.inputType,
      resolutionMetadata: canonicalEntity.metadata
    });

    if (summaries.length < MIN_SOURCE_COUNT_TO_PUBLISH) {
      await updateResearchJob(jobId, { sourceCount: summaries.length });
      await safeMarkJobFailed(jobId, RETRYABLE_RESEARCH_FAILURE_COPY, {
        retryable: false,
        failureType: "permanent"
      });
      return;
    }

    await move(jobId, "mapping_technology_stack", startedAt, {
      sourceCount: summaries.length
    });
    await move(jobId, "mapping_government_relevance", startedAt, {
      sourceCount: summaries.length
    });
    await move(jobId, "estimating_readiness", startedAt, {
      sourceCount: summaries.length
    });

    await move(jobId, "drafting_outputs", startedAt, {
      sourceCount: summaries.length
    });
    const heroImage = selectHeroImage(homepage);
    const output = await generateResearchOutput({
      query: resolution.researchQuery,
      facts,
      verification,
      summaries,
      heroImage,
      resolution: {
        slug: canonicalEntity.slug,
        entityId: canonicalEntity.match?.entity.id ?? null,
        entityType: canonicalEntity.entityType,
        inputType: resolution.inputType,
        metadata: canonicalEntity.metadata
      }
    });

    await move(jobId, "publishing_article", startedAt, {
      sourceCount: output.entity.sourceCount
    });
    await move(jobId, "publishing_profile", startedAt, {
      sourceCount: output.entity.sourceCount
    });
    await savePublicResearchReady(jobId, output);

    await move(jobId, "finalizing_dossier", startedAt, {
      sourceCount: output.entity.sourceCount
    });

    await saveResearchOutput(jobId, output);
  } catch (error) {
    if (error instanceof ResearchCancelledError) {
      return;
    }

    const timeout = error instanceof ResearchTimeoutError;
    await safeMarkJobFailed(jobId, error instanceof Error ? error.message : "Unknown research pipeline failure", {
      retryable: timeout || !(error instanceof Error && /invalid|authorization|cancelled/i.test(error.message)),
      failureType: timeout ? "timeout" : undefined
    });
  }
}
