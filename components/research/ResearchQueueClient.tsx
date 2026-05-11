"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  Bell,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Trash2,
  XCircle
} from "lucide-react";
import { ResearchSubmitForm } from "./ResearchSubmitForm";
import { formatRelativeTime } from "@/lib/story-metadata";
import type { ResearchJob, ResearchStage } from "@/lib/research/types";

type JobsResponse = {
  jobs: ResearchJob[];
  queueStats?: {
    activeCount: number;
  };
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
  resolving_entity: {
    label: "SEARCHING",
    title: "Resolving entity",
    detail: "Checking whether the submission is a domain, company, lab, patent, or public program"
  },
  finding_official_domain: {
    label: "SEARCHING",
    title: "Finding official domain",
    detail: "Searching public sources for the most likely official website"
  },
  confirming_company_identity: {
    label: "SEARCHING",
    title: "Confirming company identity",
    detail: "Comparing source signals before continuing into the research workflow"
  },
  searching_web: {
    label: "SEARCHING",
    title: "Searching the web",
    detail: "Finding public sources, company pages, articles, and technical references"
  },
  reading_homepage: {
    label: "SEARCHING",
    title: "Reading homepage",
    detail: "Extracting title, metadata, images, and important internal links."
  },
  reading_technical_pages: {
    label: "SEARCHING",
    title: "Reading technical pages",
    detail: "Scanning about, product, technology, careers, news, and documentation pages"
  },
  distilling_facts: {
    label: "SEARCHING",
    title: "Distilling structured facts",
    detail: "Extracting company, technology, market, and source-level facts"
  },
  filling_gaps: {
    label: "SEARCHING",
    title: "Filling gaps",
    detail: "Running targeted follow-up searches for missing fields"
  },
  verifying_claims: {
    label: "SEARCHING",
    title: "Verifying claims",
    detail: "Running follow-up searches for team, technology, funding, patents, market, customers, and open roles"
  },
  mapping_technology_stack: {
    label: "ANALYZING",
    title: "Mapping technology stack",
    detail: "Mapping product, architecture, materials, software, hardware, and deployment environment"
  },
  mapping_government_relevance: {
    label: "ANALYZING",
    title: "Mapping government relevance",
    detail: "Checking DARPA, NASA, SBIR, DoD, DOE, Space Force, and related public signals"
  },
  estimating_readiness: {
    label: "ANALYZING",
    title: "Estimating readiness",
    detail: "Estimating TRL, MRL, certification, manufacturing, and deployment constraints"
  },
  drafting_outputs: {
    label: "WRITING",
    title: "Drafting article, public profile, and investor dossier in parallel",
    detail: "Axon Reyes, Sable Okoro, and Ilya Stone are preparing public and institutional outputs."
  },
  publishing_article: {
    label: "WRITING",
    title: "Publishing article",
    detail: "Preparing the public feature article and source links"
  },
  publishing_profile: {
    label: "FINALIZING",
    title: "Publishing profile",
    detail: "Preparing profile links, sources, and dossier metadata"
  },
  finalizing_dossier: {
    label: "FINALIZING",
    title: "Finalizing dossier",
    detail: "Completing investor read, risks, scenarios, sources, and confidence notes"
  },
  public_research_ready: {
    label: "READY",
    title: "Public research ready",
    detail: "Article and profile are published. Institutional dossier is still finalizing."
  },
  done: {
    label: "DONE",
    title: "Research complete",
    detail: "Article, profile, and institutional dossier are ready."
  },
  failed: {
    label: "FAILED",
    title: "Research failed",
    detail: "DeepTechly could not identify enough reliable public sources to generate a high-confidence profile."
  },
  cancelled: {
    label: "CANCELLED",
    title: "Cancelled",
    detail: "This research job was cancelled before publication."
  }
};

function sortQueueJobs(jobs: ResearchJob[]) {
  return [...jobs].sort((a, b) => {
    const rankDelta = jobRank(a) - jobRank(b);
    if (rankDelta !== 0) return rankDelta;
    return jobSortTimestamp(b).localeCompare(jobSortTimestamp(a));
  });
}

function jobRank(job: ResearchJob) {
  if (isActiveJob(job)) return 0;
  if (job.stage === "public_research_ready" || job.stage === "done") return 1;
  return 2;
}

function jobSortTimestamp(job: ResearchJob) {
  return (
    job.completedAt ??
    job.publicResearchReadyAt ??
    job.updatedAt ??
    job.createdAt
  );
}

export function ResearchQueueClient({ initialJobId }: { initialJobId?: string }) {
  const [jobs, setJobs] = useState<ResearchJob[]>([]);
  const [queueStats, setQueueStats] = useState<JobsResponse["queueStats"]>();
  const [isLoading, setLoading] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const latestJobsRef = useRef<ResearchJob[]>([]);
  const notifiedJobsRef = useRef<Set<string>>(new Set());
  const defaultTitleRef = useRef<string>("");

  useEffect(() => {
    latestJobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    defaultTitleRef.current = document.title;
  }, []);

  const markInteraction = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const setServerJobs = useCallback((serverJobs: ResearchJob[]) => {
    setJobs(sortQueueJobs(serverJobs));
  }, []);

  const loadJobs = useCallback(async () => {
    markInteraction();
    try {
      const response = await fetch("/api/research", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const body = (await response.json()) as JobsResponse;
      setQueueStats(body.queueStats);
      setServerJobs(body.jobs);
    } catch {
      // Keep the current rendered queue if the server is briefly unavailable.
    } finally {
      setLoading(false);
    }
  }, [markInteraction, setServerJobs]);

  const handleJobCreated = useCallback(
    (job: ResearchJob) => {
      markInteraction();
      // Immediately prepend the new job so it appears without waiting for the next poll.
      setJobs((current) => {
        const withoutDupe = current.filter((j) => j.id !== job.id);
        return sortQueueJobs([job, ...withoutDupe]);
      });
      // Sync with server state right away so progress begins reflecting.
      void loadJobs();
    },
    [markInteraction, loadJobs]
  );

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

  useEffect(() => {
    for (const job of jobs) {
      if (!isNotificationStage(job.stage) || notifiedJobsRef.current.has(job.id)) {
        continue;
      }

      notifiedJobsRef.current.add(job.id);
      notifyReady(job, { hasInteracted, soundAlerts });
      setToast({
        title: "Research ready",
        body: `${job.feed?.entityName ?? job.query} article and profile are ready to open.`
      });
      document.title = `✓ ${job.feed?.entityName ?? job.query} ready · DeepTechly`;
      window.setTimeout(() => setToast(null), 5500);
    }
  }, [hasInteracted, jobs, soundAlerts]);

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
  const jobsAhead = Math.max(0, activeCount - 1);

  async function cancelJob(jobId: string) {
    markInteraction();
    const response = await fetch(`/api/research/${jobId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "cancel" })
    });
    if (response.ok) {
      const body = (await response.json()) as { job?: ResearchJob };
      if (body.job) {
        setServerJobs([...latestJobsRef.current.filter((job) => job.id !== body.job?.id), body.job]);
      }
    }
  }

  async function removeJob(jobId: string) {
    markInteraction();
    const response = await fetch(`/api/research/${jobId}`, { method: "DELETE" });
    if (response.ok) {
      const nextJobs = latestJobsRef.current.filter((job) => job.id !== jobId);
      setJobs(nextJobs);
    }
  }

  async function restartJob(query: string) {
    markInteraction();
    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, mode: "company" })
    });
    if (response.ok) {
      const body = (await response.json()) as { job?: ResearchJob };
      if (body.job) {
        setServerJobs([...latestJobsRef.current, body.job]);
      }
    }
  }

  return (
    <div className="space-y-8" onPointerDown={markInteraction}>
      <section className="border border-black bg-white p-4 shadow-hard sm:p-5">
        <HeadsUpBar />
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
          Research Queue
        </p>
        <h2 className="mt-2 text-2xl font-black leading-tight">
          Queue deep-tech research
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-charcoal">
          Type a company, patent, lab, technology, or government program.
          DeepTechly will search public sources, distill the facts, verify
          claims, and generate an institutional-grade profile, feature article,
          and research dossier.
        </p>
        <div className="mt-5">
          <ResearchSubmitForm compact onSubmitted={handleJobCreated} />
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSoundAlerts((value) => !value)}
              className="inline-flex items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_#0f0f0f]"
            >
              <Bell size={13} />
              Sound alerts: {soundAlerts ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={() => void loadJobs()}
              className="inline-flex items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_#0f0f0f]"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>

        <BusyQueueMessage jobsAhead={jobsAhead} queueStats={queueStats} />

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
          <ResearchQueueList
            jobs={orderedJobs}
            onCancel={cancelJob}
            onRestart={restartJob}
            onRemove={removeJob}
          />
        )}
      </section>

      {toast ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm border border-black bg-white p-4 shadow-hard">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
            {toast.title}
          </p>
          <p className="mt-1 text-sm font-bold leading-5">{toast.body}</p>
        </div>
      ) : null}
    </div>
  );
}

function HeadsUpBar() {
  return (
    <div className="border border-black bg-ink p-4 text-white">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
        Heads Up
      </p>
      <p className="mt-1 text-sm font-bold leading-6">
        Research can take up to 10 minutes per entity. Domains usually resolve
        faster than names. Keep this tab open and we will notify you when public
        research is ready.
      </p>
    </div>
  );
}

function BusyQueueMessage({
  jobsAhead,
  queueStats
}: {
  jobsAhead: number;
  queueStats?: { activeCount: number };
}) {
  if (jobsAhead <= 0 && (!queueStats || queueStats.activeCount <= 1)) {
    return null;
  }

  return (
    <div className="mb-4 border border-black bg-offWhite p-3 text-xs font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_#0f0f0f]">
      {jobsAhead > 0
        ? `BUSY QUEUE: there are ${jobsAhead} research jobs ahead of yours. You can safely close this tab and come back later.`
        : "BUSY QUEUE: research is taking longer than usual. You can safely close this tab and come back later."}
    </div>
  );
}

function ResearchQueueList({
  jobs,
  onCancel,
  onRestart,
  onRemove
}: {
  jobs: ResearchJob[];
  onCancel: (jobId: string) => void;
  onRestart: (query: string) => void;
  onRemove: (jobId: string) => void;
}) {
  return (
    <div className="border border-black bg-white shadow-hard">
      {jobs.map((job) => (
        <QueueRow
          key={job.id}
          job={job}
          onCancel={onCancel}
          onRestart={onRestart}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

function QueueRow({
  job,
  onCancel,
  onRestart,
  onRemove
}: {
  job: ResearchJob;
  onCancel: (jobId: string) => void;
  onRestart: (query: string) => void;
  onRemove: (jobId: string) => void;
}) {
  if (isActiveJob(job)) {
    return <ActiveQueueRow job={job} onCancel={onCancel} />;
  }

  return <TerminalQueueRow job={job} onRestart={onRestart} onRemove={onRemove} />;
}

function ActiveQueueRow({
  job,
  onCancel
}: {
  job: ResearchJob;
  onCancel: (jobId: string) => void;
}) {
  const display = queueCopy(job);

  return (
    <article className="border-b border-neutral-200 p-4 last:border-b-0 sm:p-5">
      <div className="flex gap-3">
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-black bg-offWhite text-deepOrange">
          <LoaderCircle size={17} className="animate-spin" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="break-words text-lg font-black leading-tight">
              {jobTitle(job)}
            </h3>
            <button
              type="button"
              onClick={() => onCancel(job.id)}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] sm:w-auto"
            >
              <Ban size={13} />
              Cancel
            </button>
          </div>
          <div className="mt-3 h-2.5 border border-black bg-offWhite">
            <div
              className="h-full bg-deepOrange"
              style={{ width: `${Math.max(0, Math.min(job.progress, 100))}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-black leading-5">{display.title}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{display.detail}</p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
            {display.label} · {formatRelativeTime(job.updatedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}

function TerminalQueueRow({
  job,
  onRestart,
  onRemove
}: {
  job: ResearchJob;
  onRestart: (query: string) => void;
  onRemove: (jobId: string) => void;
}) {
  const failed = job.stage === "failed";
  const cancelled = job.stage === "cancelled";
  const ready = job.stage === "public_research_ready";
  const display = queueCopy(job);
  const Icon = failed || cancelled ? XCircle : CheckCircle2;

  return (
    <article className="border-b border-neutral-200 p-4 last:border-b-0 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span
            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-black bg-offWhite ${
              failed || cancelled ? "text-darkOrange" : "text-deepOrange"
            }`}
          >
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <h3 className="break-words text-base font-black leading-tight">
              {jobTitle(job)}
            </h3>
            <p className="mt-2 text-sm font-black leading-5">{display.title}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{display.detail}</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
              {display.label} ·{" "}
              {formatRelativeTime(job.completedAt ?? job.publicResearchReadyAt ?? job.updatedAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          {ready || job.stage === "done" ? (
            <>
              {job.articleUrl ? (
                <Link
                  href={job.articleUrl}
                  className="inline-flex w-full items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] sm:w-auto"
                >
                  Open Article
                  <ExternalLink size={12} />
                </Link>
              ) : null}
              {job.profileUrl ? (
                <Link
                  href={job.profileUrl}
                  className="inline-flex w-full items-center justify-center gap-2 border border-black bg-deepOrange px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] sm:w-auto"
                >
                  Open Profile
                  <ExternalLink size={12} />
                </Link>
              ) : null}
              {ready ? (
                <span className="inline-flex w-full items-center justify-center border border-black bg-offWhite px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted sm:w-auto">
                  Dossier Finalizing
                </span>
              ) : job.dossierUrl ? (
                <Link
                  href={job.dossierUrl}
                  className="inline-flex w-full items-center justify-center gap-2 border border-black bg-ink px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white sm:w-auto"
                >
                  Open Dossier
                  <ExternalLink size={12} />
                </Link>
              ) : null}
            </>
          ) : null}

          {failed || cancelled ? (
            <>
              <button
                type="button"
                onClick={() => onRestart(job.query)}
                className="inline-flex w-full items-center justify-center gap-2 border border-black bg-deepOrange px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] sm:w-auto"
              >
                <RotateCcw size={13} />
                Restart Research
              </button>
              {cancelled ? (
                <button
                  type="button"
                  onClick={() => onRemove(job.id)}
                  className="inline-flex w-full items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] sm:w-auto"
                >
                  <Trash2 size={13} />
                  Remove From Queue
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function queueCopy(job: ResearchJob) {
  if (job.resolutionStatus === "limited" && job.stage === "confirming_company_identity") {
    return {
      label: "SEARCHING",
      title: "Limited resolution",
      detail:
        "DeepTechly could not confirm an official domain yet. Continuing with public-source research."
    };
  }

  return stageDisplay[job.stage];
}

function isActiveJob(job: ResearchJob) {
  return !["done", "failed", "cancelled", "public_research_ready"].includes(job.stage);
}

function isNotificationStage(stage: ResearchStage) {
  return stage === "done" || stage === "public_research_ready";
}

function jobTitle(job: ResearchJob) {
  if (job.resolvedDomain && !job.query.includes(job.resolvedDomain)) {
    return `${job.resolvedName ?? job.query} · ${job.resolvedDomain}`;
  }
  return job.resolvedName ?? job.query;
}

function notifyReady(
  job: ResearchJob,
  options: { hasInteracted: boolean; soundAlerts: boolean }
) {
  const entityName = job.feed?.entityName ?? job.resolvedName ?? job.query;

  if (options.hasInteracted && options.soundAlerts) {
    playBell();
  }

  if (!options.hasInteracted || typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("Research ready", {
      body: `${entityName} article and profile are ready to open.`
    });
    return;
  }

  if (Notification.permission === "default") {
    void Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("Research ready", {
          body: `${entityName} article and profile are ready to open.`
        });
      }
    });
  }
}

function playBell() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
  } catch {
    // Browser audio can be blocked; notifications still provide feedback.
  }
}
