import Link from "next/link";
import { ArrowRight, Cpu, Send, Star } from "lucide-react";
import type { ArticleSection as ArticleSectionType, ResearchEntity, Source } from "@/lib/types";

const tagClass =
  "border border-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]";

export function ArticleHero({ entity }: { entity: ResearchEntity }) {
  return (
    <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 md:py-18 lg:px-8">
        <div className="mx-auto max-w-3xl text-center md:text-left">
          <div className="mb-5 flex items-center justify-center gap-3 md:justify-between">
            <span className="text-[11px] font-black uppercase tracking-[0.28em] text-ink">
              Article
            </span>
            <button
              aria-label={`Save ${entity.name}`}
              className="flex h-8 w-8 items-center justify-center border border-black bg-white shadow-hard"
            >
              <Star size={16} />
            </button>
          </div>
          <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-ink/76">
            {entity.name}
          </p>
          <h1 className="text-4xl font-black leading-[0.95] tracking-normal text-ink sm:text-5xl md:text-6xl">
            {entity.article.headline}
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-ink/82 md:text-lg">
            {entity.article.dek}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
            {entity.tags.slice(0, 4).map((tag) => (
              <span key={tag} className={tagClass}>
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-ink/70">
            By {entity.article.authorPersona ?? "Viral Bernstein"} ·{" "}
            {entity.article.publishedAt
              ? new Date(entity.article.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })
              : "Research desk"}
          </p>
        </div>
      </div>
    </section>
  );
}

export function ArticleVisualPanel({ entity }: { entity: ResearchEntity }) {
  return (
    <section className="w-full bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl border border-black bg-white shadow-hard">
          {entity.article.heroImage ?? entity.heroImage ? (
            <div
              className="h-64 border-b border-black bg-cover bg-center"
              style={{
                backgroundImage: `url(${entity.article.heroImage ?? entity.heroImage})`
              }}
            />
          ) : (
            <div className="grid h-56 grid-cols-6 grid-rows-5 gap-2 border-b border-black bg-paleOrange p-5">
              <div className="col-span-2 row-span-5 border border-black bg-ink" />
              <div className="col-span-3 row-span-2 border border-black bg-deepOrange" />
              <div className="row-span-4 border border-black bg-white" />
              <div className="col-span-2 row-span-3 border border-black bg-white" />
              <div className="col-span-1 row-span-3 border border-black bg-charcoal" />
              <div className="col-span-2 row-span-1 border border-black bg-deepOrange" />
              <div className="col-span-4 border border-black bg-ink" />
            </div>
          )}
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                {entity.article.visualLabel}
              </p>
              <p className="text-sm font-black">{entity.article.visualCaption}</p>
            </div>
            <Cpu className="text-deepOrange" size={20} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ArticleBody({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full bg-paper">
      <div className="article-copy mx-auto max-w-3xl px-4 pb-8 text-[17px] leading-8 sm:px-6 md:text-[18px] lg:px-8">
        {children}
      </div>
    </section>
  );
}

export function InlineResearchStatus({ entity }: { entity: ResearchEntity }) {
  return (
    <aside className="mb-8 border border-black bg-white shadow-hard">
      <div className="border-t-4 border-deepOrange p-4 sm:p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
          Research Status
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black leading-tight">
              Read the full profile on {entity.name}
            </h2>
            <p className="mt-1 text-sm leading-6 text-charcoal">
              Research dossier available, public snapshot and institutional
              sections included.
            </p>
          </div>
          <Link
            href={`/startup/${entity.slug}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 border border-black bg-deepOrange px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard"
          >
            Open Dossier
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function ArticleSection({ section }: { section: ArticleSectionType }) {
  return (
    <section className="border-t border-black/20 py-6">
      <h2 className="mb-4 text-3xl font-black leading-tight tracking-normal">
        {section.title}
      </h2>
      {section.body.map((paragraph) => (
        <p key={paragraph} className="font-serif text-ink/88">
          {paragraph}
        </p>
      ))}
    </section>
  );
}

export function ComparisonTable({ entity }: { entity: ResearchEntity }) {
  return (
    <section className="border-t border-black/20 py-8">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
        Technical Comparison
      </p>
      <div className="scrollbar-thin overflow-x-auto border border-black bg-white shadow-hard">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              {entity.article.comparisonTable.columns.map((column) => (
                <th key={column} className="border border-black px-3 py-2 font-black">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entity.article.comparisonTable.rows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell) => (
                  <td key={cell} className="border border-black px-3 py-3 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SourcesBlock({ sources }: { sources: Source[] }) {
  return (
    <section className="border-t border-black/20 py-8">
      <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.24em] text-ink">
        Sources
      </h2>
      <ol className="space-y-2 text-xs leading-5 text-charcoal">
        {sources.map((source, index) => (
          <li key={source.url}>
            <span className="font-black text-ink">{index + 1}. </span>
            <a className="font-bold text-deepOrange underline" href={source.url}>
              {source.title}
            </a>
            {source.publisher ? ` - ${source.publisher}` : null}
            {source.date ? ` - ${source.date}` : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DossierCTA({ entity }: { entity: ResearchEntity }) {
  return (
    <section className="w-full bg-paper">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/startup/${entity.slug}`}
          className="block border border-black bg-ink text-white shadow-hardLg"
        >
          <div className="grid gap-6 p-5 sm:grid-cols-[1fr_auto] sm:p-7">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-deepOrange">
                Next · Research Dossier
              </p>
              <h2 className="mt-3 max-w-xl text-3xl font-black leading-[1.02] sm:text-4xl">
                The full research on{" "}
                <span className="text-deepOrange">{entity.name}</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/76">
                Founders, funding history, investors, traction signals,
                technical architecture, market context, risk modeling, and the
                candid investor read.
              </p>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/56">
                Snapshot · Technology · Market · Investor Read
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Overview", "Technology", "Patents", "Markets", "Risks"].map((item) => (
                  <span key={item} className="border border-white/30 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-end justify-start sm:justify-end">
              <span className="inline-flex h-12 w-12 items-center justify-center border border-black bg-deepOrange text-ink shadow-hard">
                <ArrowRight size={22} />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

export function ShareResearchCard({ entity }: { entity: ResearchEntity }) {
  return (
    <section className="w-full bg-paper">
      <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="border border-black bg-white p-5 shadow-hard sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
              For Teams
            </p>
            <h2 className="mt-2 text-xl font-black">
              Send {entity.name} research to your team
            </h2>
            <p className="mt-1 text-sm leading-6 text-charcoal">
              Share the article, public profile, and dossier link with a
              partner, investor, technical lead, or research team.
            </p>
          </div>
          <Link
            href={`/startup/${entity.slug}`}
            className="mt-5 inline-flex items-center justify-center gap-2 border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard sm:mt-0"
          >
            <Send size={14} />
            Send Research
          </Link>
        </div>
      </div>
    </section>
  );
}
