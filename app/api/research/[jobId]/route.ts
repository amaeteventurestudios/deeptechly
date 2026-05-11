import { NextResponse } from "next/server";
import { getResearchJob } from "@/lib/research/store";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ jobId: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const { jobId } = await params;
    const job = await getResearchJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Research job not found" }, { status: 404 });
    }

    const elapsedSeconds = Math.max(
      0,
      Math.round((Date.now() - new Date(job.createdAt).getTime()) / 1000)
    );

    return NextResponse.json({
      jobId: job.id,
      query: job.query,
      stage: job.stage,
      statusLabel: job.statusLabel,
      progress: job.progress,
      message: job.message,
      detail: job.detail,
      sourceCount: job.sourceCount,
      elapsedSeconds,
      articleUrl: job.articleUrl,
      profileUrl: job.profileUrl,
      dossierUrl: job.dossierUrl,
      feed: job.feed ?? null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt,
      error: job.error
    });
  } catch (error) {
    console.error("Research service unavailable", error);
    return NextResponse.json(
      { error: "Research service unavailable" },
      { status: 500 }
    );
  }
}
