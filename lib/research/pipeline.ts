import "server-only";

import {
  extractEntityFacts,
  summarizeSources,
  verifyClaims
} from "./extract";
import { generateResearchOutput } from "./generate";
import {
  progressByStage,
  recordSearchEvent,
  saveResearchOutput,
  updateResearchJob
} from "./store";
import {
  domainToUrl,
  fetchReadablePage,
  isProbableDomain,
  pickImportantInternalLinks,
  searchWeb,
  selectHeroImage
} from "./search";
import type { ReadablePage, ResearchStage, SearchResult } from "./types";

const stageDelayMs = Number(process.env.RESEARCH_STAGE_DELAY_MS ?? 450);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function move(jobId: string, stage: ResearchStage, patch = {}) {
  await updateResearchJob(jobId, {
    stage,
    progress: progressByStage[stage],
    ...patch
  });
  await wait(stageDelayMs);
}

async function safeFetch(url: string) {
  try {
    return await fetchReadablePage(url);
  } catch {
    return null;
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
    `${name} customers product technology`,
    `${name} manufacturing aerospace defense semiconductor robotics`
  ];
}

async function collectSources(jobId: string, query: string) {
  const homepageUrl = isProbableDomain(query) ? domainToUrl(query) : null;
  const pages: ReadablePage[] = [];
  let searchResults: SearchResult[] = [];
  let homepage: ReadablePage | null = null;

  await move(jobId, "searching_web");
  searchResults = await searchWeb(query);
  await recordSearchEvent(jobId, query, process.env.SEARCH_PROVIDER ?? "openai", searchResults.length);

  await move(jobId, "reading_homepage");
  homepage = homepageUrl ? await safeFetch(homepageUrl) : null;

  if (!homepage) {
    const firstLikely = searchResults.find((result) =>
      /^https?:\/\//i.test(result.url)
    );
    homepage = firstLikely ? await safeFetch(firstLikely.url) : null;
  }

  if (homepage) {
    pages.push(homepage);
  }

  await move(jobId, "reading_technical_pages");
  const internalLinks = homepage ? pickImportantInternalLinks(homepage) : [];
  const technicalPages = (
    await Promise.all(internalLinks.slice(0, 4).map((link) => safeFetch(link)))
  ).filter((page): page is ReadablePage => Boolean(page));
  pages.push(...technicalPages);

  return { homepage, pages, searchResults };
}

export async function runResearchJob(jobId: string, query: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log("OPENAI_API_KEY missing. Running research job in demo mode.");
    }

    const { homepage, pages, searchResults } = await collectSources(jobId, query);

    await move(jobId, "distilling_facts", {
      sourceCount: Math.max(1, pages.length + searchResults.length)
    });
    let summaries = summarizeSources(pages, searchResults);
    let facts = extractEntityFacts(query, homepage, summaries);

    await move(jobId, "filling_gaps", {
      sourceCount: summaries.length
    });
    const missingQueries = followUpQueries(facts.name);
    const followUpResults = (
      await Promise.all(missingQueries.slice(0, 6).map((item) => searchWeb(item)))
    ).flat();
    await recordSearchEvent(
      jobId,
      `${facts.name} gap fill`,
      process.env.SEARCH_PROVIDER ?? "openai",
      followUpResults.length
    );
    summaries = summarizeSources(pages, [...searchResults, ...followUpResults]);
    facts = extractEntityFacts(query, homepage, summaries);

    await move(jobId, "verifying_claims", {
      sourceCount: summaries.length
    });
    const verification = verifyClaims(facts, summaries);

    await move(jobId, "mapping_technology_stack", {
      sourceCount: summaries.length
    });
    await move(jobId, "mapping_government_relevance", {
      sourceCount: summaries.length
    });
    await move(jobId, "estimating_readiness", {
      sourceCount: summaries.length
    });

    await move(jobId, "drafting_outputs", {
      sourceCount: summaries.length
    });
    const heroImage = selectHeroImage(homepage);
    const output = await generateResearchOutput({
      query,
      facts,
      verification,
      summaries,
      heroImage
    });

    await move(jobId, "publishing_article", {
      sourceCount: output.entity.sourceCount
    });
    await move(jobId, "publishing_profile", {
      sourceCount: output.entity.sourceCount
    });
    await move(jobId, "finalizing_dossier", {
      sourceCount: output.entity.sourceCount
    });

    await saveResearchOutput(jobId, output);
  } catch (error) {
    await updateResearchJob(jobId, {
      stage: "failed",
      error: error instanceof Error ? error.message : "Unknown research pipeline failure",
      message: "Research failed",
      detail: "The research job could not be completed"
    });
  }
}
