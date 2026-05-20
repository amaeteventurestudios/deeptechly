"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
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
  getResearchWorkflowStepIndex,
  isActiveQueueStage,
  researchWorkflowSteps
} from "@/lib/research/display";
import type { ResearchJob, ResearchStage } from "@/lib/research/types";

type JobsResponse = {
  jobs: ResearchJob[];
  queueStats?: {
    activeCount: number;
    queuedCount?: number;
    completedCount?: number;
    failedCount?: number;
    maxActive?: number;
    globalActiveCount?: number;
    globalQueuedCount?: number;
  };
};

type JobResponse = {
  job?: ResearchJob;
  error?: string;
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

        setQueueStats({
          activeCount: isActiveQueueStage(body.job.stage) ? 1 : 0,
          queuedCount: body.job.stage === "queued" ? 1 : 0,
          completedCount: body.job.stage === "done" ? 1 : 0,
          failedCount: body.job.stage === "failed" || body.job.stage === "cancelled" ? 1 : 0,
          maxActive: 3
        });
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

  const hasOpenJobs = jobs.some((job) => isActiveQueueStage(job.stage) || job.stage === "queued");

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadJobs();
    }, 0);

    return () => window.clearTimeout(initialLoad);
  }, [loadJobs]);

  useEffect(() => {
    if (!isLoading && !hasOpenJobs) return;

    const interval = window.setInterval(() => {
      void loadJobs();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [hasOpenJobs, isLoading, loadJobs]);

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
  const queuedCount = orderedJobs.filter((job) => job.stage === "queued").length;
  const completedCount = orderedJobs.filter((job) => job.stage === "done").length;
  const failedCount = orderedJobs.filter(
    (job) => job.stage === "failed" || job.stage === "cancelled"
  ).length;
  const allCaughtUp = orderedJobs.length > 0 && activeCount === 0 && queuedCount === 0;

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
          completedCount={completedCount}
          failedCount={failedCount}
          focused={focused}
          onRefresh={loadJobs}
          queuedCount={queuedCount}
          queueStats={queueStats}
          soundAlerts={soundAlerts}
          setSoundAlerts={setSoundAlerts}
        />

        <BusyQueueMessage queuedCount={queuedCount} queueStats={queueStats} />

        {error ? <QueueError message={error} /> : null}

        {isLoading && orderedJobs.length === 0 ? (
          <QueueSkeleton focused={focused} />
        ) : orderedJobs.length === 0 && !error ? (
          <EmptyQueue />
        ) : (
          <ResearchQueueList
            jobs={orderedJobs}
            now={now}
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
  completedCount,
  failedCount,
  focused,
  onRefresh,
  queuedCount,
  queueStats,
  soundAlerts,
  setSoundAlerts
}: {
  activeCount: number;
  allCaughtUp: boolean;
  completedCount: number;
  failedCount: number;
  focused: boolean;
  onRefresh: () => void;
  queuedCount: number;
  queueStats?: JobsResponse["queueStats"];
  soundAlerts: boolean;
  setSoundAlerts: (value: boolean) => void;
}) {
  const counts = {
    active: queueStats?.activeCount ?? activeCount,
    queued: queueStats?.queuedCount ?? queuedCount,
    complete: queueStats?.completedCount ?? completedCount,
    failed: queueStats?.failedCount ?? failedCount
  };

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
            {focused ? "Research Status" : "My Research Queue"}
          </h2>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
            <QueueCount label="IN PROGRESS" value={counts.active} />
            <QueueCount label="QUEUED" value={counts.queued} />
            <QueueCount label="COMPLETE" value={counts.complete} />
            <QueueCount label="FAILED" value={counts.failed} />
          </div>
        </div>
        {allCaughtUp ? (
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-ink">
            ALL CAUGHT UP
          </p>
        ) : null}
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

function QueueCount({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex min-h-7 items-center border border-black bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-ink">
      {value} {label}
    </span>
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
  queuedCount,
  queueStats
}: {
  queuedCount: number;
  queueStats?: JobsResponse["queueStats"];
}) {
  const scopedQueuedCount = queueStats?.queuedCount ?? queuedCount;
  const activeCount = queueStats?.globalActiveCount ?? queueStats?.activeCount ?? 0;
  const maxActive = queueStats?.maxActive ?? 3;

  if (scopedQueuedCount <= 0 && activeCount < maxActive) {
    return null;
  }

  return (
    <div className="mb-4 border border-black bg-offWhite p-3 text-center text-xs font-black uppercase leading-5 tracking-[0.14em] shadow-[3px_3px_0_#0f0f0f] sm:text-left">
      {scopedQueuedCount > 0
        ? `QUEUE CAPACITY: ${activeCount}/${maxActive} active slots used · ${scopedQueuedCount} queued.`
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
  onCancel
}: {
  jobs: ResearchJob[];
  now: number;
  onCancel: (jobId: string) => void;
}) {
  const activeJobs = jobs.filter((job) => isActiveQueueStage(job.stage));
  const queuedJobs = jobs.filter((job) => job.stage === "queued");
  const completedJobs = jobs.filter((job) => job.stage === "done");
  const failedJobs = jobs.filter((job) => job.stage === "failed" || job.stage === "cancelled");

  return (
    <div className="space-y-5">
      <QueueSection
        jobs={activeJobs}
        now={now}
        onCancel={onCancel}
        title="In Progress"
      />
      <QueueSection
        jobs={queuedJobs}
        now={now}
        onCancel={onCancel}
        queued
        title="Queued"
      />
      <QueueSection
        jobs={completedJobs}
        now={now}
        onCancel={onCancel}
        title="Completed"
      />
      <QueueSection
        jobs={failedJobs}
        now={now}
        onCancel={onCancel}
        title="Failed"
      />
    </div>
  );
}

function QueueSection({
  jobs,
  now,
  onCancel,
  queued = false,
  title
}: {
  jobs: ResearchJob[];
  now: number;
  onCancel: (jobId: string) => void;
  queued?: boolean;
  title: string;
}) {
  if (jobs.length === 0) return null;

  return (
    <section className="border border-black bg-white shadow-hard">
      <div className="border-b border-black bg-offWhite px-4 py-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">
          {title} · {jobs.length}
        </h3>
      </div>
      {jobs.map((job, index) => (
        <QueueCard
          key={job.id}
          job={job}
          now={now}
          onCancel={onCancel}
          priority={index === 0 && isActiveQueueStage(job.stage)}
          queuePosition={queued ? index + 1 : undefined}
        />
      ))}
    </section>
  );
}

function QueueCard({
  job,
  now,
  onCancel,
  priority,
  queuePosition
}: {
  job: ResearchJob;
  now: number;
  onCancel: (jobId: string) => void;
  priority: boolean;
  queuePosition?: number;
}) {
  const failed = job.stage === "failed" || job.stage === "cancelled";
  const done = job.stage === "done";
  const queued = job.stage === "queued";
  const active = isActiveQueueStage(job.stage);
  const stageLabel = getQueueStageLabel(job.stage);
  const progress = getQueueProgress(job);
  const timeLabel = formatJobTime(job, now);
  const sourceCount = job.feed?.sourceCount ?? job.sourceCount;
  const confidenceLabel = job.feed?.confidenceLabel;
  const entityType = job.feed?.entityTypeTag ?? job.mode;
  const Icon = failed ? AlertTriangle : done ? CheckCircle2 : queued ? Clock3 : LoaderCircle;

  return (
    <article
      className={`border-b border-black p-4 last:border-b-0 sm:p-5 ${
        priority ? "bg-paleOrange/35" : "bg-white"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span
          className={`mx-auto flex h-10 w-10 shrink-0 items-center justify-center border border-black bg-offWhite sm:mx-0 ${
            failed ? "text-darkOrange" : queued ? "text-ink" : "text-deepOrange"
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
                {queued && queuePosition
                  ? `QUEUED · POSITION ${queuePosition}`
                  : getQueueStatusLabel(job)}
              </p>
              <h3 className="mt-1 break-words text-xl font-black leading-tight">
                {jobTitle(job)}
              </h3>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <QueueTag>{entityTypeLabel(entityType)}</QueueTag>
                <QueueTag>{timeLabel}</QueueTag>
                {sourceCount > 0 ? <QueueTag>{sourceCount} sources</QueueTag> : null}
                {confidenceLabel ? <QueueTag>{confidenceLabel}</QueueTag> : null}
              </div>
            </div>

            <JobLinks job={job} onCancel={onCancel} />
          </div>

          <div className="mt-5">
            <div className="flex items-end justify-between gap-3 text-left">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">
                  {queued
                    ? "Queue Status"
                    : done
                      ? "Completion Status"
                      : failed
                        ? "Failure Status"
                        : "Current Stage"}
                </p>
                <p className="mt-1 text-sm font-black leading-5">
                  {queued ? "Waiting for an active research slot." : stageLabel}
                </p>
              </div>
              {!failed && !queued ? (
                <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                  {progress}%
                </p>
              ) : null}
            </div>
            {queued ? (
              <div className="mt-2 border border-black bg-offWhite p-3 text-xs font-black uppercase leading-5 tracking-[0.12em] text-charcoal">
                {queuePosition && queuePosition > 1
                  ? `${queuePosition - 1} jobs ahead. Waiting for active research capacity.`
                  : "Next in line. Waiting for active research capacity."}
              </div>
            ) : (
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
            )}
          </div>

          {active || queued ? <ResearchWorkflowChecklist stage={job.stage} /> : null}

          {done ? <CompletedJobSummary sourceCount={sourceCount} /> : null}

          {failed ? <FailedJobSummary job={job} /> : null}
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
    return isActiveQueueStage(job.stage) || job.stage === "queued" ? (
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

function ResearchWorkflowChecklist({ stage }: { stage: ResearchStage }) {
  const currentIndex = getResearchWorkflowStepIndex(stage);

  return (
    <div className="mt-5 border border-black bg-offWhite p-3 text-left">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
        Research Workflow
      </p>
      <ol className="mt-3 grid gap-2 md:grid-cols-2">
        {researchWorkflowSteps.map((step, index) => {
          const state =
            stage === "done"
              ? "complete"
              : index < currentIndex
                ? "complete"
                : index === currentIndex
                  ? "current"
                  : "pending";

          return (
            <li
              key={step.id}
              className={`flex min-w-0 items-start gap-2 border border-black bg-white px-2.5 py-2 text-xs font-black leading-5 ${
                state === "current"
                  ? "border-deepOrange bg-paleOrange text-ink"
                  : state === "complete"
                    ? "text-ink"
                    : "text-muted"
              }`}
            >
              <WorkflowIndicator state={state} />
              <span className="min-w-0 break-words">{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function WorkflowIndicator({
  state
}: {
  state: "complete" | "current" | "pending";
}) {
  if (state === "complete") {
    return (
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-black bg-white text-ink">
        <Check size={11} strokeWidth={3} aria-hidden="true" />
      </span>
    );
  }

  if (state === "current") {
    return (
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-black bg-deepOrange text-ink">
        <Circle size={7} fill="currentColor" strokeWidth={0} aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-black bg-white text-muted">
      <Circle size={7} aria-hidden="true" />
    </span>
  );
}

function CompletedJobSummary({ sourceCount }: { sourceCount: number }) {
  return (
    <div className="mt-4 border border-black bg-offWhite p-3 text-left">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
        Research Complete
      </p>
      <p className="mt-1 text-sm font-bold leading-6 text-charcoal">
        Article, profile, and dossier outputs are ready
        {sourceCount > 0 ? ` with ${sourceCount} public sources attached.` : "."}
      </p>
    </div>
  );
}

function FailedJobSummary({ job }: { job: ResearchJob }) {
  const failedStage = getKnownFailedStage(job);
  const cancelled = job.stage === "cancelled";

  return (
    <div className="mt-4 border border-black bg-offWhite p-3 text-left">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-darkOrange">
        {cancelled ? "Cancelled" : "Failed"}
      </p>
      {failedStage ? (
        <p className="mt-1 text-xs font-black uppercase leading-5 tracking-[0.12em] text-charcoal">
          {cancelled ? "Stopped during" : "Failed during"} {getQueueStageLabel(failedStage)}
        </p>
      ) : null}
      <p className="mt-2 text-sm font-bold leading-6 text-charcoal">
        {cancelled
          ? "This research job was cancelled before completion."
          : "We could not complete this research job. Try a more specific company name, domain, patent number, or source URL."}
      </p>
    </div>
  );
}

function getKnownFailedStage(job: ResearchJob) {
  const failedStage = job.failedStage;
  if (!failedStage || failedStage === "failed" || failedStage === "cancelled") {
    return null;
  }

  return failedStage;
}

function sortQueueJobs(jobs: ResearchJob[]) {
  return [...jobs].sort((a, b) => {
    const rankDelta = jobRank(a) - jobRank(b);
    if (rankDelta !== 0) return rankDelta;
    if (a.stage === "queued" && b.stage === "queued") {
      return jobSortTimestamp(a).localeCompare(jobSortTimestamp(b));
    }
    return jobSortTimestamp(b).localeCompare(jobSortTimestamp(a));
  });
}

function jobRank(job: ResearchJob) {
  if (isActiveQueueStage(job.stage)) return 0;
  if (job.stage === "queued") return 1;
  if (job.stage === "done") return 2;
  return 3;
}

function jobSortTimestamp(job: ResearchJob) {
  if (job.stage === "queued") return job.createdAt;
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

function formatJobTime(job: ResearchJob, now: number) {
  if (isActiveQueueStage(job.stage) || job.stage === "queued") {
    return formatElapsed(job.createdAt, now);
  }

  if (job.stage === "done" && job.completedAt) {
    return `Completed ${formatShortDateTime(job.completedAt)}`;
  }

  if ((job.stage === "failed" || job.stage === "cancelled") && job.completedAt) {
    return `${job.stage === "cancelled" ? "Cancelled" : "Failed"} ${formatShortDateTime(job.completedAt)}`;
  }

  return `Submitted ${formatShortDateTime(job.createdAt)}`;
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

function formatShortDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "time unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
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
