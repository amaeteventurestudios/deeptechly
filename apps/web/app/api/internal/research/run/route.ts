import { NextResponse } from "next/server";
import { buildInputFingerprint, safeResumeOrRetryJob } from "@/lib/research/orchestration";
import { getResearchJob, updateResearchJob } from "@/lib/research/store";
import { runResearchJob } from "@/lib/research/pipeline";
import { isAuthorizedWorkerCallback } from "@/lib/research/workflow/callback-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

export async function POST(request: Request) {
  if (!isAuthorizedWorkerCallback(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 32_768) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  const body = (await request.json().catch(() => null)) as {
    jobId?: string;
    query?: string;
    idempotencyKey?: string;
  } | null;
  if (!body?.jobId || !body.query || !body.idempotencyKey) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  if (body.jobId.length > 200 || body.query.length > 500 || body.idempotencyKey.length > 200) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  let job = await getResearchJob(body.jobId);
  if (!job || job.query !== body.query) {
    return NextResponse.json({ error: "job_not_found" }, { status: 404 });
  }
  const expectedKey = job.orchestration?.inputFingerprint ?? buildInputFingerprint(job.query);
  if (expectedKey !== body.idempotencyKey) {
    return NextResponse.json({ error: "idempotency_mismatch" }, { status: 409 });
  }
  if (job.stage === "done" || job.stage === "cancelled") {
    return NextResponse.json({ jobId: job.id, status: job.stage, reused: true });
  }
  if (job.stage === "failed") {
    const resumed = await safeResumeOrRetryJob(job.id, {
      force: true,
      detail: "Durable workflow retry resumed from persisted research state."
    });
    if (!resumed) {
      return NextResponse.json({ jobId: job.id, status: job.stage, retryable: false });
    }
    job = resumed;
  }
  if (job.stage === "queued") {
    const started = await updateResearchJob(job.id, {
      stage: "resolving_entity",
      progress: 12,
      message: "Starting research",
      detail: "Durable worker resumed this research job.",
      active_started_at: job.active_started_at ?? new Date().toISOString(),
      stage_started_at: new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString()
    });
    if (!started) {
      return NextResponse.json({ error: "job_disappeared" }, { status: 500 });
    }
    job = started;
  }

  await runResearchJob(job.id, job.query);
  const completed = await getResearchJob(job.id);
  if (!completed) {
    return NextResponse.json({ error: "job_disappeared" }, { status: 500 });
  }
  if (
    completed.stage === "failed" &&
    completed.orchestration?.retryable &&
    (completed.orchestration.attemptCount ?? 0) < (completed.orchestration.maxAttempts ?? 3)
  ) {
    await safeResumeOrRetryJob(completed.id, {
      force: true,
      detail: "Durable workflow will retry a transient research failure."
    });
    return NextResponse.json(
      { jobId: completed.id, status: "retrying" },
      { status: 503 }
    );
  }

  return NextResponse.json({ jobId: completed.id, status: completed.stage });
}
