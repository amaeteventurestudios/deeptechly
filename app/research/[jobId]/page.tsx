import { PageShell } from "@/components/layout/PageShell";
import { ResearchQueueClient } from "@/components/research/ResearchQueueClient";

export const dynamic = "force-dynamic";

type ResearchJobPageProps = {
  params: Promise<{ jobId: string }>;
};

export const metadata = {
  title: "Research Job | DeepTechly",
  description: "DeepTechly research job status and queue view."
};

export default async function ResearchJobPage({ params }: ResearchJobPageProps) {
  const { jobId } = await params;

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Research Job
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Track queued deep-tech research.
          </h1>
          <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-ink/82">
            Job-specific links open the same live queue surface with the
            requested job prioritized when it is present.
          </p>
        </div>
      </section>
      <section className="w-full bg-paper">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <ResearchQueueClient initialJobId={jobId} />
        </div>
      </section>
    </PageShell>
  );
}
