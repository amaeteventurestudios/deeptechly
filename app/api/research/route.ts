import { NextResponse } from "next/server";
import {
  createResearchJob,
  isActiveResearchStage,
  listResearchJobs
} from "@/lib/research/store";
import { runResearchJob } from "@/lib/research/pipeline";
import type { ResearchMode } from "@/lib/research/types";
import { MAX_ACTIVE_USER_JOBS } from "@/lib/research/limits";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      query?: string;
      mode?: ResearchMode;
    };
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const existingJobs = await listResearchJobs();
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

    const job = await createResearchJob(query, body.mode ?? "company");

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
    const jobs = await listResearchJobs();
    const activeCount = jobs.filter((job) => isActiveResearchStage(job.stage)).length;
    return NextResponse.json({ jobs, queueStats: { activeCount } });
  } catch (error) {
    console.error("Research service unavailable", error);
    return NextResponse.json({ jobs: [] });
  }
}
