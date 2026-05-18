import { NextResponse } from "next/server";
import {
  createResearchJob,
  createLinkedResearchJob,
  findReusableEntityForInput,
  isActiveResearchStage,
  listResearchJobs
} from "@/lib/research/store";
import { runResearchJob } from "@/lib/research/pipeline";
import type { ResearchMode } from "@/lib/research/types";
import { MAX_ACTIVE_USER_JOBS } from "@/lib/research/limits";
import { getAuthSession } from "@/lib/auth/session";
import { classifyEntityInput } from "@/lib/research/entity-resolution";
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
      return NextResponse.json({
        jobId: duplicateActiveJob.id,
        status: duplicateActiveJob.stage,
        job: duplicateActiveJob,
        reused: true
      });
    }

    const retryableJob = existingJobs.find(
      (job) => jobMatchesInput(job, query) && canRetryResearchJob(job)
    );
    if (retryableJob) {
      const retriedJob = await safeResumeOrRetryJob(retryableJob.id);
      if (retriedJob) {
        void runResearchJob(retriedJob.id, retriedJob.query);
        return NextResponse.json({
          jobId: retriedJob.id,
          status: retriedJob.stage,
          job: retriedJob,
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
      return NextResponse.json({
        jobId: job.id,
        status: job.stage,
        job
      });
    }

    const activeCount = existingJobs.filter((job) => isActiveResearchStage(job.stage)).length;
    if (activeCount >= MAX_ACTIVE_USER_JOBS) {
      return NextResponse.json(
        {
          error:
            "DeepTechly already has two active research jobs in this queue. Cancel or wait for one to finish before starting another."
        },
        { status: 429 }
      );
    }

    const job = await createResearchJob(query, requestedMode, session.userId);

    void runResearchJob(job.id, query);

    return NextResponse.json({
      jobId: job.id,
      status: job.stage,
      job
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
      return NextResponse.json({ jobs: [], queueStats: { activeCount: 0 } });
    }

    await markStuckJobsForUser(session.userId);
    const jobs = await listResearchJobs(session.userId);
    const activeCount = jobs.filter((job) => isActiveResearchStage(job.stage)).length;
    return NextResponse.json({ jobs, queueStats: { activeCount } });
  } catch (error) {
    console.error("Research service unavailable", error);
    return NextResponse.json({ jobs: [] });
  }
}
