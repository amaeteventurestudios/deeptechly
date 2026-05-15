import { NextResponse } from "next/server";
import {
  createResearchJob,
  isActiveResearchStage,
  listResearchJobs
} from "@/lib/research/store";
import { runResearchJob } from "@/lib/research/pipeline";
import type { ResearchMode } from "@/lib/research/types";
import { MAX_ACTIVE_USER_JOBS } from "@/lib/research/limits";
import { getAuthSession } from "@/lib/auth/session";

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

    const existingJobs = await listResearchJobs(session.userId);
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

    const job = await createResearchJob(query, body.mode ?? "company", session.userId);

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

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ jobs: [], queueStats: { activeCount: 0 } });
    }

    const jobs = await listResearchJobs(session.userId);
    const activeCount = jobs.filter((job) => isActiveResearchStage(job.stage)).length;
    return NextResponse.json({ jobs, queueStats: { activeCount } });
  } catch (error) {
    console.error("Research service unavailable", error);
    return NextResponse.json({ jobs: [] });
  }
}
