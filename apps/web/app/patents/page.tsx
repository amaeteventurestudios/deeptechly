import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { getPublishedEntities } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Patent Intelligence | DeepTechly",
  description:
    "DeepTechly patent intelligence surface for public patent signals and research-linked IP."
};

export default async function PatentsPage() {
  const entities = await getPublishedEntities();
  const patentSources = entities.flatMap((entity) =>
    [...entity.sources, ...entity.dossier.sources]
      .filter((source) => source.type === "patent" || source.url.includes("patents"))
      .map((source) => ({ ...source, entityName: entity.name, slug: entity.slug }))
  );
  const visibleSources = patentSources.slice(0, 12);

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Patent Intelligence
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Public patent signals connected to deep-tech research.
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-ink/82">
            This archive surfaces patent-linked sources already attached to
            DeepTechly public research, with each signal tied back to the
            related company profile and cited source.
          </p>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          {visibleSources.length > 0 ? (
            <div className="space-y-4">
              {visibleSources.map((source, index) => (
                <article
                  key={`${source.slug}-${source.url}-${index}`}
                  className="border border-black bg-white p-5 shadow-hard"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                    {source.entityName} - Patent Signal
                  </p>
                  <h2 className="mt-2 text-xl font-black leading-tight">
                    {source.title}
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 border border-black bg-deepOrange px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
                    >
                      Open Source
                      <ExternalLink size={13} />
                    </a>
                    <Link
                      href={`/startup/${source.slug}`}
                      className="inline-flex items-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
                    >
                      Related Profile
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-black bg-white p-8 text-center shadow-hard">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
                Patent Archive
              </p>
              <h2 className="mt-3 text-2xl font-black">
                No patent-linked sources are published yet.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-charcoal">
                Queue a company, patent, lab, or government program and
                DeepTechly will attach public patent signals where available.
              </p>
              <Link
                href="/research"
                className="mt-6 inline-flex items-center gap-2 border border-black bg-deepOrange px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] shadow-hard"
              >
                Queue Patent Research
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
