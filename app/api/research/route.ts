import { NextResponse } from "next/server";
import { createResearchJob, listResearchJobs } from "@/lib/research/store";
import { runResearchJob } from "@/lib/research/pipeline";
import type { ResearchMode } from "@/lib/research/types";

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
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Research service unavailable", error);
    return NextResponse.json({ jobs: [] });
  }
}
