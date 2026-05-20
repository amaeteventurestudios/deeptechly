import { NextResponse } from "next/server";
import {
  createResearchJob,
  createLinkedResearchJob,
  findReusableEntityForInput,
  getResearchJob,
  listResearchJobs
} from "@/lib/research/store";
import type { ResearchMode } from "@/lib/research/types";
import { getAuthSession } from "@/lib/auth/session";
import { classifyEntityInput } from "@/lib/research/entity-resolution";
import { drainResearchQueue } from "@/lib/research/queue";
import {
  canRetryResearchJob,
  jobMatchesInput,
  safeMarkJobStuck,
  safeResumeOrRetryJob,
  shouldMarkJobStuck,
  shouldReuseActiveJob
} from "@/lib/research/orchestration";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      query?: string;
      mode?: ResearchMode;
    };
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    await markStuckJobsForUser(session.userId);
    const existingJobs = await listResearchJobs(session.userId);
    const duplicateActiveJob = existingJobs.find((job) =>
      shouldReuseActiveJob(job, query, session.userId)
    );
    if (duplicateActiveJob) {
      await drainResearchQueue(session.userId);
      const job = (await getResearchJob(duplicateActiveJob.id)) ?? duplicateActiveJob;
      return NextResponse.json({
        jobId: job.id,
        status: job.stage,
        job,
        reused: true
      });
    }

    const retryableJob = existingJobs.find(
      (job) => jobMatchesInput(job, query) && canRetryResearchJob(job)
    );
    if (retryableJob) {
      const retriedJob = await safeResumeOrRetryJob(retryableJob.id);
      if (retriedJob) {
        await drainResearchQueue(session.userId);
        const job = (await getResearchJob(retriedJob.id)) ?? retriedJob;
        return NextResponse.json({
          jobId: job.id,
          status: job.stage,
          job,
          retried: true
        });
      }
    }

    const inputType = classifyEntityInput(query);
    const requestedMode = body.mode ?? inputTypeToMode(inputType);
    const reusableEntity = await findReusableEntityForInput(query);
    if (reusableEntity) {
      const job = await createLinkedResearchJob(
        query,
        requestedMode,
        session.userId,
        reusableEntity.entity
      );
      await drainResearchQueue(session.userId);
      return NextResponse.json({
        jobId: job.id,
        status: job.stage,
        job
      });
    }

    const job = await createResearchJob(query, requestedMode, session.userId);
    await drainResearchQueue(session.userId);
    const refreshedJob = (await getResearchJob(job.id)) ?? job;

    return NextResponse.json({
      jobId: refreshedJob.id,
      status: refreshedJob.stage,
      job: refreshedJob
    });
  } catch (error) {
    console.error("Research service unavailable", error);
    return NextResponse.json(
      { error: "Research service unavailable" },
      { status: 500 }
    );
  }
}

function inputTypeToMode(inputType: ReturnType<typeof classifyEntityInput>): ResearchMode {
  if (inputType === "domain") return "domain";
  if (inputType === "patent") return "patent";
  if (inputType === "lab") return "lab";
  if (inputType === "government_program") return "government_program";
  if (inputType === "technology") return "technology";
  if (inputType === "unknown") return "unknown";
  return "company";
}

async function markStuckJobsForUser(userId: string) {
  const jobs = await listResearchJobs(userId);
  const stuckJobs = jobs.filter((job) => shouldMarkJobStuck(job));
  await Promise.all(stuckJobs.map((job) => safeMarkJobStuck(job.id)));
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({
        jobs: [],
        queueStats: { activeCount: 0, queuedCount: 0, completedCount: 0, failedCount: 0, maxActive: 3 }
      });
    }

    await markStuckJobsForUser(session.userId);
    const drained = await drainResearchQueue(session.userId);
    return NextResponse.json({
      jobs: drained.jobs,
      queueStats: drained.queueStats
    });
  } catch (error) {
    console.error("Research service unavailable", error);
    return NextResponse.json({ jobs: [] });
  }
}
