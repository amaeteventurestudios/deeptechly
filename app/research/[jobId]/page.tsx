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
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Research Status
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Track queued deep-tech research
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-7 text-ink/82">
            DeepTechly keeps this status view synced with the persisted research
            queue while the profile, article, and dossier are prepared.
          </p>
        </div>
      </section>
      <section className="w-full bg-paper">
        <div className="mx-auto max-w-[1040px] px-4 py-10 sm:px-6 lg:px-8">
          <ResearchQueueClient initialJobId={jobId} focused />
        </div>
      </section>
    </PageShell>
  );
}
