import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { getPublishedEntities } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const entities = await getPublishedEntities();

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Research Profiles
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Browse DeepTechly profiles.
          </h1>
        </div>
      </section>
      <section className="w-full bg-paper">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {entities.map((entity) => (
            <Link
              href={`/startup/${entity.slug}`}
              key={entity.slug}
              className="block border border-black bg-white p-5 shadow-hard hover:bg-paleOrange"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                {entity.sector} · {entity.confidenceLabel}
              </p>
              <h2 className="mt-2 text-xl font-black leading-tight">{entity.name}</h2>
              <p className="mt-2 text-sm leading-6 text-charcoal">{entity.summary}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                Open Profile
                <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
