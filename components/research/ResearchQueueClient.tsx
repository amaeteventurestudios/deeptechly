"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  XCircle
} from "lucide-react";
import { ResearchSubmitForm } from "./ResearchSubmitForm";
import {
  loadLocalQueueJobs,
  mergeQueueJobs,
  saveLocalQueueJobs,
  sortQueueJobs
} from "./queueStorage";
import type { ResearchJob, ResearchStage } from "@/lib/research/types";

type JobsResponse = {
  jobs: ResearchJob[];
};

const stageDisplay: Record<
  ResearchStage,
  { label: string; title: string; detail: string }
> = {
  queued: {
    label: "QUEUED",
    title: "Queued",
    detail: "Waiting to begin research"
  },
  searching_web: {
    label: "SEARCHING",
    title: "Searching the web",
    detail:
      "Finding public sources, company pages, articles, and technical references"
  },
  reading_homepage: {
    label: "SEARCHING",
    title: "Reading homepage",
    detail:
      "Extracting title, meta description, images, and important internal links"
  },
  reading_technical_pages: {
    label: "SEARCHING",
    title: "Reading technical pages",
    detail:
      "Scanning about, product, technology, careers, news, and documentation pages"
  },
  distilling_facts: {
    label: "SEARCHING",
    title: "Distilling structured facts",
    detail: "Extracting company, technology, market, and source-level facts"
  },
  filling_gaps: {
    label: "SEARCHING",
    title:
      "Filling gaps: founders, headquarters, founded year, funding, patents, papers, open roles",
    detail: "Running targeted follow-up searches for missing fields"
  },
  verifying_claims: {
    label: "SEARCHING",
    title: "Verifying claims",
    detail:
      "Running follow-up searches for team, technology, funding, patents, market, customers, and open roles"
  },
  mapping_technology_stack: {
    label: "ANALYZING",
    title: "Mapping technology stack",
    detail:
      "Mapping product, architecture, materials, software, hardware, and deployment environment"
  },
  mapping_government_relevance: {
    label: "ANALYZING",
    title: "Mapping government relevance",
    detail:
      "Checking DARPA, NASA, SBIR, DoD, DOE, Space Force, and related public signals"
  },
  estimating_readiness: {
    label: "ANALYZING",
    title: "Estimating readiness",
    detail:
      "Estimating TRL, MRL, certification, manufacturing, and deployment constraints"
  },
  drafting_outputs: {
    label: "WRITING",
    title:
      "Drafting article (Viral Bernstein), public profile (Rhea Mendoza), and investor profile (Marcus Okonkwo) in parallel",
    detail: "AI analyst personas are preparing public and institutional outputs"
  },
  publishing_article: {
    label: "WRITING",
    title: "Article published — finalizing research dossier",
    detail: "Preparing the full institutional research profile"
  },
  publishing_profile: {
    label: "FINALIZING",
    title: "Public profile published",
    detail: "Preparing profile links, sources, and dossier metadata"
  },
  finalizing_dossier: {
    label: "FINALIZING",
    title: "Finalizing institutional dossier",
    detail:
      "Completing investor read, risks, scenarios, sources, and confidence notes"
  },
  done: {
    label: "DONE",
    title: "Done",
    detail: "Research profile is ready"
  },
  failed: {
    label: "FAILED",
    title: "Research failed",
    detail: "This research job could not be completed"
  }
};

export function ResearchQueueClient({ initialJobId }: { initialJobId?: string }) {
  const [jobs, setJobs] = useState<ResearchJob[]>(() =>
    sortQueueJobs(loadLocalQueueJobs())
  );
  const [isLoading, setLoading] = useState(true);
  const latestJobsRef = useRef<ResearchJob[]>([]);

  useEffect(() => {
    latestJobsRef.current = jobs;
  }, [jobs]);

  const mergeAndSetJobs = useCallback((serverJobs: ResearchJob[]) => {
    const merged = mergeQueueJobs(serverJobs, [
      ...loadLocalQueueJobs(),
      ...latestJobsRef.current
    ]);
    setJobs(merged);
    saveLocalQueueJobs(merged);
  }, []);

  const loadJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/research", { cache: "no-store" });
      if (!response.ok) {
        setJobs(sortQueueJobs(loadLocalQueueJobs()));
        return;
      }

      const body = (await response.json()) as JobsResponse;
      mergeAndSetJobs(body.jobs);
    } catch {
      setJobs(sortQueueJobs(loadLocalQueueJobs()));
    } finally {
      setLoading(false);
    }
  }, [mergeAndSetJobs]);

  useEffect(() => {
    const onLocalQueueChange = () => {
      setJobs((currentJobs) =>
        mergeQueueJobs([], [...loadLocalQueueJobs(), ...currentJobs])
      );
    };
    window.addEventListener("storage", onLocalQueueChange);
    window.addEventListener("deeptechly-research-queue-updated", onLocalQueueChange);

    const initial = window.setTimeout(() => {
      void loadJobs();
    }, 0);
    const interval = window.setInterval(() => {
      void loadJobs();
    }, 2500);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      window.removeEventListener("storage", onLocalQueueChange);
      window.removeEventListener(
        "deeptechly-research-queue-updated",
        onLocalQueueChange
      );
    };
  }, [loadJobs]);

  const orderedJobs = useMemo(() => {
    const sorted = sortQueueJobs(jobs);
    if (!initialJobId) return sorted;

    return [...sorted].sort((a, b) => {
      if (a.id === initialJobId && isActiveJob(a)) return -1;
      if (b.id === initialJobId && isActiveJob(b)) return 1;
      return 0;
    });
  }, [initialJobId, jobs]);

  const activeCount = orderedJobs.filter((job) => isActiveJob(job)).length;

  return (
    <div className="space-y-8">
      <section className="border border-black bg-white p-4 shadow-hard sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
          Research a startup
        </p>
        <h2 className="mt-2 text-2xl font-black leading-tight">
          Submit a company, domain, patent, lab, or technology
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal">
          DeepTechly will collect public sources, pull an image, extract facts,
          fill gaps, verify claims, and generate the article, public profile,
          and investor dossier.
        </p>
        <div className="mt-5">
          <ResearchSubmitForm compact />
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
                My research queue
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">
                {activeCount > 0
                  ? `${activeCount} in progress`
                  : "All caught up"}
              </p>
            </div>
            <div className="mt-3 border-t border-black" />
          </div>
          <button
            type="button"
            onClick={() => void loadJobs()}
            className="inline-flex items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_#0f0f0f]"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        {isLoading && orderedJobs.length === 0 ? (
          <div className="border border-black bg-white p-5 shadow-hard">
            <p className="text-sm font-bold">Loading research jobs...</p>
          </div>
        ) : orderedJobs.length === 0 ? (
          <div className="border border-black bg-white p-5 shadow-hard">
            <p className="text-sm font-bold">
              No jobs yet. Submit a query and the staged research pipeline will
              appear here.
            </p>
          </div>
        ) : (
          <ResearchQueueList jobs={orderedJobs} />
        )}
      </section>
    </div>
  );
}

function ResearchQueueList({ jobs }: { jobs: ResearchJob[] }) {
  return (
    <div className="border border-black bg-white shadow-hard">
      {jobs.map((job) => (
        <QueueRow key={job.id} job={job} />
      ))}
    </div>
  );
}

function QueueRow({ job }: { job: ResearchJob }) {
  if (isActiveJob(job)) {
    return <ActiveQueueRow job={job} />;
  }

  return <TerminalQueueRow job={job} />;
}

function ActiveQueueRow({ job }: { job: ResearchJob }) {
  const display = stageDisplay[job.stage];

  return (
    <article className="border-b border-neutral-200 p-4 last:border-b-0 sm:p-5">
      <div className="flex gap-3">
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-black bg-offWhite text-deepOrange">
          <LoaderCircle size={17} className="animate-spin" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-black leading-tight">{job.query}</h3>
          <div className="mt-3 h-2.5 border border-black bg-offWhite">
            <div
              className="h-full bg-deepOrange"
              style={{ width: `${Math.max(0, Math.min(job.progress, 100))}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-black leading-5">{display.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{display.detail}</p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
            {display.label} · {elapsedLabel(job.updatedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}

function TerminalQueueRow({ job }: { job: ResearchJob }) {
  const isFailed = job.stage === "failed";
  const display = stageDisplay[job.stage];
  const profileHref = job.profileUrl ?? job.dossierUrl ?? job.articleUrl;
  const Icon = isFailed ? XCircle : CheckCircle2;

  return (
    <article className="border-b border-neutral-200 p-4 last:border-b-0 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-black bg-offWhite ${
              isFailed ? "text-darkOrange" : "text-deepOrange"
            }`}
          >
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="break-words text-base font-black leading-tight">
              {job.query}
            </h3>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
              {display.label} · {elapsedLabel(job.completedAt ?? job.updatedAt)}
            </p>
          </div>
        </div>

        {!isFailed && profileHref ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              href={profileHref}
              className="inline-flex w-full items-center justify-center gap-2 border border-black bg-deepOrange px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] sm:w-auto"
            >
              Open Profile
              <ExternalLink size={12} />
            </Link>
            {job.articleUrl ? (
              <Link
                href={job.articleUrl}
                className="inline-flex w-full items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] sm:w-auto"
              >
                Open Article
              </Link>
            ) : null}
            {job.dossierUrl && job.dossierUrl !== profileHref ? (
              <Link
                href={job.dossierUrl}
                className="inline-flex w-full items-center justify-center gap-2 border border-black bg-ink px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white sm:w-auto"
              >
                Open Dossier
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function isActiveJob(job: ResearchJob) {
  return job.stage !== "done" && job.stage !== "failed";
}

function elapsedLabel(dateValue: string) {
  const elapsedSeconds = Math.max(
    0,
    Math.round((Date.now() - new Date(dateValue).getTime()) / 1000)
  );

  if (elapsedSeconds < 60) return "JUST NOW";
  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}M AGO`;
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}H AGO`;
  return `${Math.round(elapsedHours / 24)}D AGO`;
}
