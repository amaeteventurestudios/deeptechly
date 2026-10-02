import { NextResponse } from "next/server";
import {
  cancelResearchJob,
  getResearchJob,
  removeResearchJob
} from "@/lib/research/store";
import { getAuthSession } from "@/lib/auth/session";
import {
  canRetryResearchJob,
  safeResumeOrRetryJob
} from "@/lib/research/orchestration";
import { drainResearchQueue } from "@/lib/research/queue";
import { runResearchWatchdog } from "@/lib/research/watchdog";
import { getResearchWorkflowDispatcher } from "@/lib/research/workflow";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
    }

    const { jobId } = await params;
    let job = await getResearchJob(jobId);

    if (!job || job.userId !== session.userId) {
      return NextResponse.json({ error: "Research job not found" }, { status: 404 });
    }
    await runResearchWatchdog();
    await drainResearchQueue(session.userId);
    job = (await getResearchJob(jobId)) ?? job;

    const elapsedSeconds = Math.max(
      0,
      Math.round((Date.now() - new Date(job?.createdAt ?? Date.now()).getTime()) / 1000)
    );

    return NextResponse.json({
      job,
      elapsedSeconds
    });
  } catch (error) {
    console.error("Research service unavailable", error);
    return NextResponse.json(
      { error: "Research service unavailable" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
    }

    const { jobId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: "cancel" | "retry";
    };

    if (body.action !== "cancel" && body.action !== "retry") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const existingJob = await getResearchJob(jobId);
    if (!existingJob || existingJob.userId !== session.userId) {
      return NextResponse.json({ error: "Research job not found" }, { status: 404 });
    }

    if (body.action === "retry") {
      if (!canRetryResearchJob(existingJob)) {
        return NextResponse.json({ error: "Research job cannot be retried" }, { status: 409 });
      }

      const job = await safeResumeOrRetryJob(jobId);
      if (job) {
        await drainResearchQueue(session.userId);
      }

      return NextResponse.json({ job: (await getResearchJob(jobId)) ?? job });
    }

    const runId = existingJob.orchestration?.runId;
    const provider = existingJob.orchestration?.provider;
    const job = await cancelResearchJob(jobId);
    if (provider === "trigger" && runId) {
      await getResearchWorkflowDispatcher("trigger")
        .cancelResearch(runId)
        .catch((error) => console.error("Workflow cancellation failed", {
          jobId,
          message: error instanceof Error ? error.message : "unknown failure"
        }));
    }
    await drainResearchQueue(session.userId);

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Research service unavailable", error);
    return NextResponse.json(
      { error: "Research service unavailable" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
    }

    const { jobId } = await params;
    const job = await getResearchJob(jobId);
    if (!job || job.userId !== session.userId) {
      return NextResponse.json({ error: "Research job not found" }, { status: 404 });
    }
    await removeResearchJob(jobId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Research service unavailable", error);
    return NextResponse.json(
      { error: "Research service unavailable" },
      { status: 500 }
    );
  }
}
