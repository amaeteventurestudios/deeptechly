import { PageShell } from "@/components/layout/PageShell";
import { ResearchQueueClient } from "@/components/research/ResearchQueueClient";

export const dynamic = "force-dynamic";

export default async function ResearchPage({
  searchParams
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            My research queue
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Your deep research jobs, source by source.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-ink/82">
            Watch the staged pipeline move from public source collection to
            generated article, public profile, and investor dossier.
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
