import Link from "next/link";
import { ArrowRight, Search, Star } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { entities } from "@/lib/data";

export default function HomePage() {
  const alsoReading = entities.slice(1);

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
          <form className="mt-7 flex max-w-2xl flex-col gap-3 border border-black bg-white p-2 shadow-hard sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
              <Search size={18} />
              <input
                aria-label="Research query"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
                placeholder="Type any startup, patent, lab, or technology..."
              />
            </label>
            <button
              className="border border-black bg-ink px-5 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white"
              type="button"
            >
              Research
            </button>
          </form>
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

      <section className="w-full bg-paper">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-black pb-3">
              <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
                Top Stories
              </h2>
              <Link
                href="/news"
                className="text-[10px] font-black uppercase tracking-[0.16em]"
              >
                Browse All
              </Link>
            </div>
            <div className="space-y-5">
              {entities.map((entity, index) => (
                <article key={entity.slug} className="border-b border-black/20 pb-5">
                  <div className="grid gap-4 sm:grid-cols-[40px_1fr_auto]">
                    <span className="text-3xl font-black text-deepOrange">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                        {entity.sector} · {entity.confidenceLabel} confidence
                      </p>
                      <h3 className="mt-2 max-w-2xl text-2xl font-black leading-tight">
                        <Link href={`/article/${entity.slug}`}>
                          {entity.article.headline}
                        </Link>
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal">
                        {entity.article.dek}
                      </p>
                    </div>
                    <Link
                      href={`/article/${entity.slug}`}
                      className="inline-flex h-10 w-10 items-center justify-center border border-black bg-white shadow-hard"
                      aria-label={`Read article about ${entity.name}`}
                    >
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="lg:border-l lg:border-black/20 lg:pl-6">
            <h2 className="mb-4 border-b border-black pb-3 text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
              Also Reading
            </h2>
            <div className="space-y-4">
              {alsoReading.map((entity) => (
                <Link
                  href={`/article/${entity.slug}`}
                  key={entity.slug}
                  className="block border border-black bg-white p-4 shadow-hard hover:bg-paleOrange"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                      {entity.sector}
                    </span>
                    <Star size={14} />
                  </div>
                  <h3 className="text-base font-black leading-tight">{entity.name}</h3>
                  <p className="mt-2 text-xs leading-5 text-charcoal">
                    {entity.summary}
                  </p>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="w-full border-y border-black bg-offWhite">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between border-b border-black pb-3">
            <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
              Recent Research
            </h2>
            <Link href="/startups" className="text-[10px] font-black uppercase tracking-[0.16em]">
              Browse All
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {entities.map((entity) => (
              <Link
                href={`/startup/${entity.slug}`}
                key={entity.slug}
                className="block border border-black bg-white shadow-hard"
              >
                <div className="h-28 border-b border-black bg-ink p-4 text-white">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
                    Research
                  </p>
                  <p className="mt-3 text-sm font-black">{entity.confidenceLabel} Signal</p>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                    {entity.sector}
                  </p>
                  <h3 className="mt-2 text-xl font-black">{entity.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-charcoal">
                    {entity.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
