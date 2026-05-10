import { NextResponse } from "next/server";
import { createResearchJob, getResearchJobs } from "@/lib/research/store";
import { runResearchJob } from "@/lib/research/pipeline";
import type { ResearchMode } from "@/lib/research/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
    status: job.stage
  });
}

export async function GET() {
  const jobs = await getResearchJobs();
  return NextResponse.json({ jobs });
}
