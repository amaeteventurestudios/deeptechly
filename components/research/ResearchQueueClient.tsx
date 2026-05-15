"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  RefreshCw
} from "lucide-react";
import { ResearchSubmitForm } from "./ResearchSubmitForm";
import { SaveResearchButton } from "@/components/saved/SaveResearchButton";
import {
  getQueueProgress,
  getQueueStageLabel,
  getQueueStatusLabel,
  isActiveQueueStage
} from "@/lib/research/display";
import type { ResearchJob, ResearchStage } from "@/lib/research/types";

type JobsResponse = {
  jobs: ResearchJob[];
  queueStats?: {
    activeCount: number;
  };
};

type JobResponse = {
  job?: ResearchJob;
  error?: string;
};

type StageHistoryItem = {
  stage: ResearchStage;
  startedAt?: string;
  completedAt?: string;
};

export function ResearchQueueClient({
  initialJobId,
  focused = false
}: {
  initialJobId?: string;
  focused?: boolean;
}) {
  const [jobs, setJobs] = useState<ResearchJob[]>([]);
  const [queueStats, setQueueStats] = useState<JobsResponse["queueStats"]>();
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const latestJobsRef = useRef<ResearchJob[]>([]);
  const notifiedJobsRef = useRef<Set<string>>(new Set());
  const progressRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    latestJobsRef.current = jobs;
  }, [jobs]);

  const markInteraction = useCallback(() => {
    setHasInteracted(true);
  }, []);

  const setServerJobs = useCallback((serverJobs: ResearchJob[]) => {
    const progressById = progressRef.current;
    const withStableProgress = serverJobs.map((job) => {
      const previousProgress = progressById.get(job.id) ?? 0;
      const displayProgress = getQueueProgress(job);
      const nextProgress =
        job.stage === "failed" || job.stage === "cancelled"
          ? Math.max(previousProgress, displayProgress)
          : Math.max(previousProgress, displayProgress);
      progressById.set(job.id, nextProgress);
      return { ...job, progress: nextProgress };
    });

    setJobs(sortQueueJobs(withStableProgress));
  }, []);

  const loadJobs = useCallback(async () => {
    markInteraction();
    setError(null);

    try {
      if (focused && initialJobId) {
        const response = await fetch(`/api/research/${initialJobId}`, {
          cache: "no-store"
        });
        const body = (await response.json().catch(() => ({}))) as JobResponse;

        if (!response.ok || !body.job) {
          throw new Error(body.error ?? "Research job could not be found.");
        }

        setQueueStats({ activeCount: isActiveQueueStage(body.job.stage) ? 1 : 0 });
        setServerJobs([body.job]);
        return;
      }

      const response = await fetch("/api/research", { cache: "no-store" });
      const body = (await response.json().catch(() => ({}))) as JobsResponse;

      if (!response.ok) {
        throw new Error("Research queue could not be loaded.");
      }

      setQueueStats(body.queueStats);
      setServerJobs(body.jobs ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? cleanError(loadError.message)
          : "Research queue could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [focused, initialJobId, markInteraction, setServerJobs]);

  const handleJobCreated = useCallback(
    (job: ResearchJob) => {
      markInteraction();
      setServerJobs([job, ...latestJobsRef.current.filter((item) => item.id !== job.id)]);
      void loadJobs();
    },
    [loadJobs, markInteraction, setServerJobs]
  );

  const cancelJob = useCallback(
    async (jobId: string) => {
      markInteraction();
      const response = await fetch(`/api/research/${jobId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "cancel" })
      });

      if (response.ok) {
        const body = (await response.json().catch(() => ({}))) as { job?: ResearchJob };
        if (body.job) {
          setServerJobs([
            body.job,
            ...latestJobsRef.current.filter((item) => item.id !== body.job?.id)
          ]);
        }
      }
    },
    [markInteraction, setServerJobs]
  );

  const hasActiveJobs = jobs.some((job) => isActiveQueueStage(job.stage));

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadJobs();
    }, 0);

    return () => window.clearTimeout(initialLoad);
  }, [loadJobs]);

  useEffect(() => {
    if (!isLoading && !hasActiveJobs) return;

    const interval = window.setInterval(() => {
      void loadJobs();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [hasActiveJobs, isLoading, loadJobs]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    for (const job of jobs) {
      if (job.stage !== "done" || notifiedJobsRef.current.has(job.id)) {
        continue;
      }

      notifiedJobsRef.current.add(job.id);
      notifyReady(job, { hasInteracted, soundAlerts });
      setToast({
        title: "Research ready",
        body: `${job.feed?.entityName ?? job.resolvedName ?? job.query} is ready to open.`
      });
      document.title = `${job.feed?.entityName ?? job.resolvedName ?? job.query} ready · DeepTechly`;
      window.setTimeout(() => setToast(null), 5500);
    }
  }, [hasInteracted, jobs, soundAlerts]);

  const orderedJobs = useMemo(() => {
    const sorted = sortQueueJobs(jobs);
    if (!initialJobId || focused) return sorted;

    return [...sorted].sort((a, b) => {
      if (a.id === initialJobId && isActiveQueueStage(a.stage)) return -1;
      if (b.id === initialJobId && isActiveQueueStage(b.stage)) return 1;
      return 0;
    });
  }, [focused, initialJobId, jobs]);

  const activeCount = orderedJobs.filter((job) => isActiveQueueStage(job.stage)).length;
  const jobsAhead = Math.max(0, activeCount - 1);
  const allCaughtUp = orderedJobs.length > 0 && activeCount === 0;

  return (
    <div className="space-y-7" onPointerDown={markInteraction}>
      {!focused ? (
        <section className="border border-black bg-white p-4 shadow-hard sm:p-5">
          <HeadsUpBar />
          <div className="mt-5">
            <ResearchSubmitForm compact onSubmitted={handleJobCreated} />
          </div>
        </section>
      ) : null}

      <section aria-busy={isLoading} aria-live="polite">
        <QueueHeader
          activeCount={activeCount}
          allCaughtUp={allCaughtUp}
          focused={focused}
          onRefresh={loadJobs}
          soundAlerts={soundAlerts}
          setSoundAlerts={setSoundAlerts}
        />

        <BusyQueueMessage jobsAhead={jobsAhead} queueStats={queueStats} />

        {error ? <QueueError message={error} /> : null}

        {isLoading && orderedJobs.length === 0 ? (
          <QueueSkeleton focused={focused} />
        ) : orderedJobs.length === 0 && !error ? (
          <EmptyQueue />
        ) : (
          <ResearchQueueList
            jobs={orderedJobs}
            now={now}
            focused={focused}
            onCancel={cancelJob}
          />
        )}
      </section>

      {focused ? (
        <div className="border border-black bg-white p-4 shadow-hard">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
            Start Another Search
          </p>
          <div className="mt-4">
            <ResearchSubmitForm compact />
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 left-4 right-4 z-50 border border-black bg-white p-4 shadow-hard sm:left-auto sm:max-w-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
            {toast.title}
          </p>
          <p className="mt-1 text-sm font-bold leading-5">{toast.body}</p>
        </div>
      ) : null}
    </div>
  );
}

function QueueHeader({
  activeCount,
  allCaughtUp,
  focused,
  onRefresh,
  soundAlerts,
  setSoundAlerts
}: {
  activeCount: number;
  allCaughtUp: boolean;
  focused: boolean;
  onRefresh: () => void;
  soundAlerts: boolean;
  setSoundAlerts: (value: boolean) => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
            {focused ? "Research Status" : "My Research Queue"}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">
            {allCaughtUp ? "ALL CAUGHT UP" : `${activeCount} in progress`}
          </p>
        </div>
        <div className="mt-3 border-t border-black" />
      </div>
      <div className="flex flex-col gap-2 min-[390px]:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => setSoundAlerts(!soundAlerts)}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_#0f0f0f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepOrange"
        >
          <Bell size={13} />
          Sound {soundAlerts ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_#0f0f0f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepOrange"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>
    </div>
  );
}

function HeadsUpBar() {
  return (
    <div className="border border-black bg-ink p-4 text-white">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
        HEADS UP
      </p>
      <p className="mt-1 text-sm font-bold leading-6">
        Research can take several minutes per entity. Keep this tab open and we
        will update the queue as each profile is prepared.
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
    <div className="mb-4 border border-black bg-offWhite p-3 text-center text-xs font-black uppercase leading-5 tracking-[0.14em] shadow-[3px_3px_0_#0f0f0f] sm:text-left">
      {jobsAhead > 0
        ? `BUSY QUEUE: there are ${jobsAhead} research jobs ahead of yours.`
        : "BUSY QUEUE: research is taking longer than usual."}
    </div>
  );
}

function QueueError({ message }: { message: string }) {
  return (
    <div className="mb-4 border border-black bg-white p-4 shadow-hard">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-darkOrange" size={18} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-darkOrange">
            Queue Error
          </p>
          <p className="mt-1 text-sm font-bold leading-6">{cleanError(message)}</p>
        </div>
      </div>
    </div>
  );
}

function QueueSkeleton({ focused }: { focused: boolean }) {
  return (
    <div className="border border-black bg-white p-4 shadow-hard sm:p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
        {focused ? "Loading Research Status" : "Loading Research Queue"}
      </p>
      <div className="mt-5 space-y-4">
        <div className="h-5 w-3/4 animate-pulse bg-lightBorder" />
        <div className="h-3 w-full animate-pulse bg-lightBorder" />
        <div className="h-3 w-2/3 animate-pulse bg-lightBorder" />
      </div>
    </div>
  );
}

function EmptyQueue() {
  return (
    <div className="border border-black bg-white p-6 text-center shadow-hard">
      <p className="text-lg font-black">No research queued yet.</p>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-charcoal">
        Search any company, patent, lab, or technology to generate your first
        DeepTechly dossier.
      </p>
    </div>
  );
}

function ResearchQueueList({
  jobs,
  now,
  focused,
  onCancel
}: {
  jobs: ResearchJob[];
  now: number;
  focused: boolean;
  onCancel: (jobId: string) => void;
}) {
  return (
    <div className="border border-black bg-white shadow-hard">
      {jobs.map((job, index) => (
        <QueueCard
          key={job.id}
          job={job}
          now={now}
          focused={focused}
          onCancel={onCancel}
          priority={index === 0 && isActiveQueueStage(job.stage)}
        />
      ))}
    </div>
  );
}

function QueueCard({
  job,
  now,
  focused,
  onCancel,
  priority
}: {
  job: ResearchJob;
  now: number;
  focused: boolean;
  onCancel: (jobId: string) => void;
  priority: boolean;
}) {
  const failed = job.stage === "failed" || job.stage === "cancelled";
  const done = job.stage === "done";
  const active = isActiveQueueStage(job.stage);
  const stageLabel = getQueueStageLabel(job.stage);
  const progress = getQueueProgress(job);
  const elapsed = formatElapsed(job.createdAt, now);
  const sourceCount = job.feed?.sourceCount ?? job.sourceCount;
  const confidenceLabel = job.feed?.confidenceLabel;
  const entityType = job.feed?.entityTypeTag ?? job.mode;
  const history = getStageHistory(job);
  const Icon = failed ? AlertTriangle : done ? CheckCircle2 : LoaderCircle;

  return (
    <article
      className={`border-b border-black p-4 last:border-b-0 sm:p-5 ${
        priority ? "bg-paleOrange/35" : "bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span
          className={`mx-auto flex h-10 w-10 shrink-0 items-center justify-center border border-black bg-offWhite sm:mx-0 ${
            failed ? "text-darkOrange" : "text-deepOrange"
          }`}
        >
          <Icon
            size={19}
            className={active ? "animate-spin motion-reduce:animate-none" : ""}
            aria-hidden="true"
          />
          {active ? <span className="sr-only">Research in progress</span> : null}
        </span>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                {getQueueStatusLabel(job)}
              </p>
              <h3 className="mt-1 break-words text-xl font-black leading-tight">
                {jobTitle(job)}
              </h3>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <QueueTag>{entityTypeLabel(entityType)}</QueueTag>
                <QueueTag>{elapsed}</QueueTag>
                {sourceCount > 0 ? <QueueTag>{sourceCount} sources</QueueTag> : null}
                {confidenceLabel ? <QueueTag>{confidenceLabel}</QueueTag> : null}
              </div>
            </div>

            <JobLinks job={job} onCancel={onCancel} />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black leading-5">{stageLabel}</p>
              {!failed ? (
                <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                  {progress}%
                </p>
              ) : null}
            </div>
            <div
              className="mt-2 h-3 border border-black bg-offWhite"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={failed ? undefined : progress}
              aria-label={`Research progress: ${stageLabel}`}
            >
              <div
                className={`h-full transition-[width] duration-700 motion-reduce:transition-none ${
                  failed ? "bg-darkOrange" : "bg-deepOrange"
                }`}
                style={{ width: `${failed ? Math.max(progress, 8) : progress}%` }}
              />
            </div>
          </div>

          {failed ? (
            <p className="mt-4 border border-black bg-offWhite p-3 text-sm font-bold leading-6 text-charcoal">
              {cleanError(job.error ?? job.detail)}
            </p>
          ) : null}

          {focused && history.length > 0 ? <StageHistory history={history} /> : null}
        </div>
      </div>
    </article>
  );
}

function JobLinks({
  job,
  onCancel
}: {
  job: ResearchJob;
  onCancel: (jobId: string) => void;
}) {
  const done = job.stage === "done";
  const partialReady = job.stage === "public_research_ready";

  if (!done && !partialReady) {
    return isActiveQueueStage(job.stage) ? (
      <div className="flex flex-col gap-2 min-[430px]:flex-row lg:justify-end">
        <button
          type="button"
          onClick={() => onCancel(job.id)}
          className="inline-flex min-h-11 items-center justify-center border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepOrange"
        >
          CANCEL
        </button>
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-2 min-[430px]:flex-row lg:justify-end">
      <SaveResearchButton
        href={job.profileUrl ?? job.articleUrl ?? "/research"}
        itemId={job.entityId ?? job.feed?.slug ?? job.normalizedQuery}
        itemType="RESEARCH JOB"
        title={jobTitle(job)}
        sector={job.feed?.sector}
        entityName={job.feed?.entityName ?? job.resolvedName ?? job.query}
      />
      {job.articleUrl ? <QueueLink href={job.articleUrl}>OPEN ARTICLE</QueueLink> : null}
      {job.profileUrl ? <QueueLink href={job.profileUrl}>OPEN PROFILE</QueueLink> : null}
      {done && job.dossierUrl ? (
        <QueueLink href={job.dossierUrl} dark>
          OPEN DOSSIER
        </QueueLink>
      ) : null}
    </div>
  );
}

function QueueLink({
  href,
  children,
  dark = false
}: {
  href: string;
  children: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 border border-black px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepOrange ${
        dark ? "bg-ink text-white" : "bg-deepOrange text-ink"
      }`}
    >
      {children}
      <ExternalLink size={12} />
    </Link>
  );
}

function QueueTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-7 items-center border border-black bg-offWhite px-2 py-1 text-[10px] font-black uppercase leading-4 tracking-[0.13em] text-charcoal">
      {children}
    </span>
  );
}

function StageHistory({ history }: { history: StageHistoryItem[] }) {
  return (
    <div className="mt-5 border border-black bg-offWhite p-3 text-left">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
        Stage History
      </p>
      <ol className="mt-3 space-y-2">
        {history.map((item, index) => (
          <li
            key={`${item.stage}-${item.startedAt ?? index}`}
            className="flex flex-col gap-1 text-xs font-bold leading-5 text-charcoal sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{getQueueStageLabel(item.stage)}</span>
            {item.startedAt ? <span>{formatShortTime(item.startedAt)}</span> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function sortQueueJobs(jobs: ResearchJob[]) {
  return [...jobs].sort((a, b) => {
    const rankDelta = jobRank(a) - jobRank(b);
    if (rankDelta !== 0) return rankDelta;
    return jobSortTimestamp(b).localeCompare(jobSortTimestamp(a));
  });
}

function jobRank(job: ResearchJob) {
  if (isActiveQueueStage(job.stage)) return 0;
  if (job.stage === "done") return 1;
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

function jobTitle(job: ResearchJob) {
  return job.feed?.entityName ?? job.resolvedName ?? job.query;
}

function entityTypeLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatElapsed(createdAt: string, now: number) {
  const started = new Date(createdAt).getTime();
  if (!Number.isFinite(started)) return "Elapsed time unavailable";
  const seconds = Math.max(0, Math.floor((now - started) / 1000));
  if (seconds < 60) return `${seconds}s elapsed`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s elapsed`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m elapsed`;
}

function formatShortTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function getStageHistory(job: ResearchJob) {
  const maybeHistory = (job as ResearchJob & { stageHistory?: StageHistoryItem[] }).stageHistory;
  if (!Array.isArray(maybeHistory)) return [];
  return maybeHistory.filter((item) => item.stage);
}

function cleanError(message: string) {
  const fallback =
    "DeepTechly could not complete this research run from the available public sources. You can submit another search when ready.";

  if (!message) return fallback;
  if (/stack|trace|error:/i.test(message) || message.length > 220) return fallback;
  if (message === "sign_in_required") return "Please sign in to view or submit research.";
  return message;
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
      body: `${entityName} article, profile, and dossier are ready to open.`
    });
    return;
  }

  if (Notification.permission === "default") {
    void Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("Research ready", {
          body: `${entityName} article, profile, and dossier are ready to open.`
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
    // Browser audio can be blocked; visual notification remains available.
  }
}
