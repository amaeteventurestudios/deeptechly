import { NextResponse } from "next/server";
import {
  cancelResearchJob,
  getResearchJob,
  removeResearchJob
} from "@/lib/research/store";
import { getAuthSession } from "@/lib/auth/session";

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
    const job = await getResearchJob(jobId);

    if (!job || job.userId !== session.userId) {
      return NextResponse.json({ error: "Research job not found" }, { status: 404 });
    }

    const elapsedSeconds = Math.max(
      0,
      Math.round((Date.now() - new Date(job.createdAt).getTime()) / 1000)
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
      action?: "cancel";
    };

    if (body.action !== "cancel") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const existingJob = await getResearchJob(jobId);
    if (!existingJob || existingJob.userId !== session.userId) {
      return NextResponse.json({ error: "Research job not found" }, { status: 404 });
    }

    const job = await cancelResearchJob(jobId);

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
