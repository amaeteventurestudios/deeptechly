import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  FileText,
  ShieldCheck
} from "lucide-react";
import {
  formatByline,
  storyFromEntity,
  storyTags
} from "@/lib/story-metadata";
import type { ArticleSection as ArticleSectionType, ResearchEntity, Source } from "@/lib/types";

const emptyCopy = "Not confirmed in public sources.";
const tagClass =
  "inline-flex min-h-7 items-center border border-black bg-white px-2 py-1 text-[10px] font-black uppercase leading-4 tracking-[0.13em]";

function confirmed(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return emptyCopy;
  return String(value);
}

function formatDate(value?: string | null) {
  if (!value) return emptyCopy;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function ArticleHero({ entity }: { entity: ResearchEntity }) {
  const story = storyFromEntity(entity);
  const metadata = [
    ["Sector", entity.sector],
    ["Sources", `${entity.sourceCount} sources`],
    ["Confidence", entity.confidenceLabel],
    ["Analyst", formatByline(story.authorPersona)],
    ["Published", formatDate(entity.article.publishedAt ?? entity.updatedAt)]
  ];

  return (
    <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
      <div className="mx-auto max-w-[1120px] px-4 py-10 text-center sm:px-6 lg:px-8 lg:py-14 lg:text-left">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] lg:justify-start"
        >
          <Link href="/news" className="border border-black bg-white px-2 py-1 hover:bg-ink hover:text-white">
            News
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/sector/${entity.sector.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            className="border border-black bg-white px-2 py-1 hover:bg-ink hover:text-white"
          >
            {entity.sector}
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <div className="flex flex-col justify-center">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-ink">
              Feature Article
            </p>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-ink/76">
              {entity.name}
            </p>
            <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-black leading-[0.95] text-ink sm:text-5xl md:text-6xl lg:mx-0">
              {entity.article.headline}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-ink/82 md:text-lg lg:mx-0">
              {entity.article.dek}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
              {storyTags(story).slice(0, 6).map((tag) => (
                <span key={tag} className={tagClass}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="border border-black bg-white shadow-hardLg">
            <ArticleVisual entity={entity} />
            <div className="grid border-t border-black bg-offWhite min-[430px]:grid-cols-2">
              {metadata.map(([label, value]) => (
                <div key={label} className="border-b border-black/20 px-4 py-3 text-left min-[430px]:border-r">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-deepOrange">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-black leading-5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArticleVisual({ entity }: { entity: ResearchEntity }) {
  const image = entity.article.heroImage ?? entity.heroImage;

  if (image) {
    return (
      <div
        className="h-64 border-b border-black bg-cover bg-center sm:h-80"
        role="img"
        aria-label={`${entity.name} research visual`}
        style={{ backgroundImage: `url(${image})` }}
      />
    );
  }

  return (
    <div className="grid h-64 grid-cols-6 grid-rows-5 gap-2 border-b border-black bg-paleOrange p-5 sm:h-80">
      <div className="col-span-2 row-span-5 border border-black bg-ink" />
      <div className="col-span-3 row-span-2 border border-black bg-deepOrange" />
      <div className="row-span-4 border border-black bg-white" />
      <div className="col-span-2 row-span-3 border border-black bg-white" />
      <div className="col-span-1 row-span-3 border border-black bg-charcoal" />
      <div className="col-span-2 row-span-1 border border-black bg-deepOrange" />
      <div className="col-span-4 border border-black bg-ink" />
    </div>
  );
}

export function ArticleBody({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full bg-paper">
      <div className="article-copy mx-auto max-w-[760px] px-4 py-10 text-[17px] leading-8 sm:px-6 md:text-[18px] lg:px-8">
        {children}
      </div>
    </section>
  );
}

export function ResearchSnapshotCallout({ entity }: { entity: ResearchEntity }) {
  const rows = [
    ["Entity", entity.name],
    ["Sector", entity.sector],
    ["Region", entity.region],
    ["Stage", entity.stage],
    ["Source count", `${entity.sourceCount}`],
    ["Confidence", entity.confidenceLabel]
  ];

  return (
    <aside className="mb-8 border border-black bg-white shadow-hard">
      <div className="border-b border-black bg-ink px-4 py-3 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
          Research Snapshot
        </p>
      </div>
      <div className="grid min-[430px]:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="border-b border-black/20 px-4 py-3 min-[430px]:border-r">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">
              {label}
            </p>
            <p className="mt-1 text-sm font-black leading-5">{confirmed(value)}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function ArticleSection({ section }: { section?: ArticleSectionType }) {
  if (!section) return null;

  return (
    <section className="border-t border-black/20 py-7">
      <h2 className="mb-4 text-2xl font-black leading-tight sm:text-3xl">
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
  const table = entity.article.comparisonTable;
  if (!table?.columns?.length || !table.rows?.length) return null;

  return (
    <section className="border-t border-black/20 py-8">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
        Technical Comparison
      </p>
      <div className="scrollbar-thin overflow-x-auto border border-black bg-white shadow-hard">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              {table.columns.map((column) => (
                <th key={column} className="border border-black px-3 py-2 font-black">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
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

export function OpenQuestionsSection({ entity }: { entity: ResearchEntity }) {
  const questions =
    entity.article.openQuestions?.length
      ? entity.article.openQuestions
      : entity.dossier.accuracyAndConfidence.unverified;

  if (!questions.length) return null;

  return (
    <section className="border-t border-black/20 py-8">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
        Open Questions
      </p>
      <div className="mt-4 space-y-3">
        {questions.map((question) => (
          <div key={question} className="border border-black bg-offWhite p-4 text-sm font-bold leading-6">
            {question}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SourcesBlock({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;

  return (
    <section className="border-t border-black/20 py-8">
      <h2 className="mb-4 text-[11px] font-black uppercase tracking-[0.24em] text-ink">
        Sources
      </h2>
      <div className="space-y-3">
        {sources.map((source, index) => (
          <SourceRow key={`${source.url}-${index}`} source={source} index={index} />
        ))}
      </div>
    </section>
  );
}

export function SourceRow({ source, index }: { source: Source; index?: number }) {
  const meta = [
    source.publisher,
    source.date,
    source.retrievedAt ? `Retrieved ${formatDate(source.retrievedAt)}` : null
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <a
      href={source.url}
      className="block border border-black bg-white p-4 shadow-[3px_3px_0_#0f0f0f] transition-colors hover:bg-paleOrange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepOrange"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-deepOrange">
            {index !== undefined ? `Source ${index + 1}` : "Source"} · {source.type.replace(/_/g, " ")}
          </p>
          <h3 className="mt-1 break-words text-base font-black leading-tight">
            {source.title}
          </h3>
          {meta ? (
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-muted">
              {meta}
            </p>
          ) : null}
        </div>
        <span className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]">
          Open URL
          <ExternalLink size={12} />
        </span>
      </div>
    </a>
  );
}

export function DossierCTA({ entity }: { entity: ResearchEntity }) {
  return (
    <section className="w-full bg-paper">
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/dossier/${entity.slug}`}
          className="block border border-black bg-ink text-white shadow-hardLg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepOrange"
        >
          <div className="grid gap-6 p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-black bg-deepOrange text-ink">
                <FileText size={18} />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-deepOrange">
                  Research Dossier
                </p>
                <h2 className="mt-2 text-3xl font-black leading-tight">
                  The full deep-tech research on {entity.name}
                </h2>
              </div>
            </div>
            <p className="max-w-2xl text-sm font-bold leading-6 text-white/78">
              Technical architecture, patent signals, manufacturing constraints,
              government relevance, commercialization scenarios, and the investor read.
            </p>
            <p className="text-[10px] font-black uppercase leading-5 tracking-[0.18em] text-white/64">
              Snapshot · Technology Stack · Patent Position · Risk Model · Government Relevance
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex min-h-8 items-center border border-white/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
                Public + Institutional
              </span>
              <span className="inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-ink shadow-hard">
                Open Dossier
                <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

export function RelatedResearch({ entity }: { entity: ResearchEntity }) {
  const related = entity.dossier.relatedResearch?.slice(0, 3) ?? [];
  if (!related.length) return null;

  return (
    <section className="w-full bg-paper">
      <div className="mx-auto max-w-[760px] px-4 pb-12 sm:px-6 lg:px-8">
        <div className="border-t border-black/20 pt-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
            Related Research
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/startup/${item.slug}`}
                className="block border border-black bg-white p-4 shadow-hard hover:bg-paleOrange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepOrange"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-deepOrange">
                  {item.sector}
                </p>
                <h3 className="mt-2 text-lg font-black leading-tight">{item.name}</h3>
                <p className="mt-2 text-xs font-bold leading-5 text-charcoal">{item.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ConfidenceEvidencePanel({ entity }: { entity: ResearchEntity }) {
  const accuracy = entity.dossier.accuracyAndConfidence;
  const groups = [
    ["Confirmed facts", accuracy.confirmed],
    ["Inferred claims", accuracy.inferred],
    ["Unverified claims", accuracy.unverified]
  ].filter(([, items]) => Array.isArray(items) && items.length > 0) as [string, string[]][];

  if (!groups.length) return null;

  return (
    <section className="border-t border-black/20 py-8">
      <div className="border border-black bg-white shadow-hard">
        <div className="border-b border-black bg-ink px-4 py-3 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
            Evidence Quality
          </p>
          <h2 className="mt-1 text-2xl font-black">{entity.confidenceLabel}</h2>
        </div>
        <div className="grid md:grid-cols-3">
          {groups.map(([title, items]) => (
            <div key={title} className="border-b border-black/20 p-4 md:border-r">
              <h3 className="text-sm font-black">{title}</h3>
              <ul className="mt-3 space-y-2 text-xs font-bold leading-5 text-charcoal">
                {items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 border border-black bg-deepOrange" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ArticleFooterActions({ entity }: { entity: ResearchEntity }) {
  return (
    <section className="w-full bg-paper">
      <div className="mx-auto max-w-[760px] px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/startup/${entity.slug}`}
            className="flex min-h-24 items-center gap-3 border border-black bg-white p-4 shadow-hard hover:bg-paleOrange"
          >
            <BookOpen className="shrink-0 text-deepOrange" size={20} />
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                Public Profile
              </span>
              <span className="mt-1 block text-sm font-black">Open structured profile</span>
            </span>
          </Link>
          <Link
            href={`/dossier/${entity.slug}`}
            className="flex min-h-24 items-center gap-3 border border-black bg-white p-4 shadow-hard hover:bg-paleOrange"
          >
            <ShieldCheck className="shrink-0 text-deepOrange" size={20} />
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                Dossier
              </span>
              <span className="mt-1 block text-sm font-black">Open public and institutional research</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
