"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, RefreshCw, XCircle } from "lucide-react";
import { ResearchSubmitForm } from "./ResearchSubmitForm";
import type { ResearchJob, ResearchStage } from "@/lib/research/types";

type JobsResponse = {
  jobs: ResearchJob[];
};

const stageDisplay: Record<ResearchStage, string> = {
  queued: "Queued",
  searching_web: "Searching the web",
  reading_homepage: "Reading homepage",
  reading_technical_pages: "Reading technical pages",
  distilling_facts: "Distilling structured facts",
  filling_gaps: "Filling gaps",
  verifying_claims: "Verifying claims",
  mapping_technology_stack: "Mapping technology stack",
  mapping_government_relevance: "Mapping government relevance",
  estimating_readiness: "Estimating readiness",
  drafting_outputs: "Drafting article, public profile, and investor dossier in parallel",
  publishing_article: "Publishing article",
  publishing_profile: "Publishing public profile",
  finalizing_dossier: "Finalizing institutional dossier",
  done: "Done",
  failed: "Research failed"
};

export function ResearchQueueClient({ initialJobId }: { initialJobId?: string }) {
  const [jobs, setJobs] = useState<ResearchJob[]>([]);
  const [isLoading, setLoading] = useState(true);

  const loadJobs = useCallback(async () => {
    const response = await fetch("/api/research", { cache: "no-store" });
    if (!response.ok) {
      setLoading(false);
      return;
    }
    const body = (await response.json()) as JobsResponse;
    setJobs(body.jobs);
    setLoading(false);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadJobs();
    }, 0);
    const interval = window.setInterval(() => {
      void loadJobs();
    }, 2500);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [loadJobs]);

  const activeJobs = jobs
    .filter((job) => job.stage !== "done" && job.stage !== "failed")
    .sort((a, b) => {
      if (a.id === initialJobId) return -1;
      if (b.id === initialJobId) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  const completedJobs = jobs
    .filter((job) => job.stage === "done")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const failedJobs = jobs
    .filter((job) => job.stage === "failed")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

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
        <div className="mb-4 flex items-center justify-between border-b border-black pb-3">
          <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
            My research queue
          </h2>
          <button
            type="button"
            onClick={() => void loadJobs()}
            className="inline-flex items-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] shadow-hard"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="border border-black bg-white p-5 shadow-hard">
            <p className="text-sm font-bold">Loading research jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="border border-black bg-white p-5 shadow-hard">
            <p className="text-sm font-bold">
              No jobs yet. Submit a query and the staged research pipeline will
              appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            {activeJobs.length > 0 ? (
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : null}

            {completedJobs.length > 0 ? (
              <div className="space-y-4">
                <p className="border-b border-black pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                  Completed Research
                </p>
                {completedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : null}

            {failedJobs.length > 0 ? (
              <div className="space-y-4">
                <p className="border-b border-black pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                  Failed Research
                </p>
                {failedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
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

function JobCard({ job }: { job: ResearchJob }) {
  const terminal = job.stage === "done" || job.stage === "failed";
  const readableMessage =
    job.message && !job.message.includes("_") ? job.message : stageDisplay[job.stage];
  const Icon =
    job.stage === "done" ? CheckCircle2 : job.stage === "failed" ? XCircle : LoaderCircle;

  return (
    <article
      className={`border border-l-4 border-black border-l-deepOrange p-4 shadow-hard ${
        terminal ? "bg-offWhite" : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-black bg-offWhite">
            <Icon
              size={17}
              className={job.stage === "done" ? "text-deepOrange" : job.stage === "failed" ? "text-darkOrange" : "animate-spin text-deepOrange"}
            />
          </span>
          <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
            {job.statusLabel}
          </p>
            <h3 className="mt-2 break-words text-lg font-black leading-tight">
              {job.query}
            </h3>
          </div>
        </div>
        <span className="text-xl font-black">{job.progress}%</span>
      </div>
      <div className="mt-4 h-3 border border-black bg-offWhite">
        <div className="h-full bg-deepOrange" style={{ width: `${job.progress}%` }} />
      </div>
      <p className="mt-3 text-sm font-black">{readableMessage}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{job.detail}</p>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
        {job.statusLabel} · {elapsedLabel(job.createdAt)}
      </p>
      {job.stage === "done" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.articleUrl ? (
            <Link
              href={job.articleUrl}
              className="inline-flex items-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
            >
              Open Article
              <ArrowRight size={13} />
            </Link>
          ) : null}
          {job.profileUrl ? (
            <Link
              href={job.profileUrl}
              className="inline-flex items-center gap-2 border border-black bg-deepOrange px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
            >
              Open Profile
              <ArrowRight size={13} />
            </Link>
          ) : null}
          {job.dossierUrl ? (
            <Link
              href={job.dossierUrl}
              className="inline-flex items-center gap-2 border border-black bg-ink px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white"
            >
              Open Dossier
              <ArrowRight size={13} />
            </Link>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
