import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { HomeResearchFeed } from "@/components/home/HomeResearchFeed";
import { ResearchSubmitForm } from "@/components/research/ResearchSubmitForm";
import { getPublishedEntities } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const entities = await getPublishedEntities();

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Deep-Tech Research
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl md:text-7xl">
            Search any deep-tech entity. We will research it.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-ink/82">
            DeepTechly turns public signals into editorial articles, structured
            dossiers, confidence labels, and institutional diligence previews.
          </p>
          <ResearchSubmitForm />
        </div>
      </section>

      <section className="w-full border-b border-black bg-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] sm:px-6 lg:px-8">
          <span>Today&apos;s Edition · Sunday, May 10</span>
          <Link className="text-deepOrange" href="/news">
            Full Archive
          </Link>
        </div>
      </section>

      <HomeResearchFeed entities={entities} />
    </PageShell>
  );
}
