"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { ResearchSubmitForm } from "./ResearchSubmitForm";
import type { ResearchJob } from "@/lib/research/types";

type JobsResponse = {
  jobs: ResearchJob[];
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

  const activeJob = useMemo(() => {
    if (initialJobId) {
      return jobs.find((job) => job.id === initialJobId) ?? jobs[0];
    }

    return jobs[0];
  }, [initialJobId, jobs]);

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
            Research Queue
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
          <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} isActive={job.id === activeJob?.id} />
              ))}
            </div>
            {activeJob ? <JobDetail job={activeJob} /> : null}
          </div>
        )}
      </section>
    </div>
  );
}

function JobCard({ job, isActive }: { job: ResearchJob; isActive: boolean }) {
  return (
    <article
      className={`border border-black bg-white p-4 shadow-hard ${
        isActive ? "border-l-4 border-l-deepOrange" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
            {job.statusLabel}
          </p>
          <h3 className="mt-2 text-lg font-black leading-tight">{job.query}</h3>
        </div>
        <span className="text-xl font-black">{job.progress}%</span>
      </div>
      <div className="mt-4 h-3 border border-black bg-offWhite">
        <div className="h-full bg-deepOrange" style={{ width: `${job.progress}%` }} />
      </div>
      <p className="mt-3 text-sm font-black">{job.message}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{job.detail}</p>
      {job.stage === "done" ? (
        <div className="mt-4 flex flex-wrap gap-2">
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

function JobDetail({ job }: { job: ResearchJob }) {
  const rows = [
    ["Job ID", job.id],
    ["Stage", job.stage],
    ["Sources", String(job.sourceCount)],
    ["Created", new Date(job.createdAt).toLocaleString()],
    ["Updated", new Date(job.updatedAt).toLocaleString()]
  ];

  return (
    <aside className="border border-black bg-offWhite p-4 shadow-hard">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
        Current Job
      </p>
      <h3 className="mt-2 text-2xl font-black leading-tight">{job.query}</h3>
      <div className="mt-5 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="border border-black bg-white p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">
              {label}
            </p>
            <p className="mt-1 break-words text-sm font-bold">{value}</p>
          </div>
        ))}
      </div>
      {job.error ? (
        <div className="mt-4 border border-black bg-white p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-darkOrange">
            Error
          </p>
          <p className="mt-1 text-sm font-bold">{job.error}</p>
        </div>
      ) : null}
    </aside>
  );
}
