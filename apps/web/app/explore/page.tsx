import Link from "next/link";
import { ArrowRight, ExternalLink, Search } from "lucide-react";
import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { searchPublishedResearch } from "@/lib/discovery/search";
import {
  discoveryKinds,
  type DiscoveryDocument,
  type DiscoveryKind
} from "@/lib/discovery/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore Deep-Tech Research | DeepTechly",
  description:
    "Search DeepTechly articles, profiles, patents, technologies, labs, and government-demand intelligence.",
  alternates: { canonical: "/explore" }
};

type ExplorePageProps = {
  searchParams: Promise<{ q?: string; kind?: string }>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const result = await searchPublishedResearch({ query: params.q, kind: params.kind });

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Explore DeepTechly
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Search the deep-tech research graph.
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-ink/82">
            Discover public articles, research profiles, patent evidence, labs,
            technologies, and government-demand intelligence from one archive.
          </p>

          <form action="/explore" method="get" role="search" className="mt-7 max-w-4xl">
            {result.kind ? <input type="hidden" name="kind" value={result.kind} /> : null}
            <label htmlFor="explore-search" className="sr-only">
              Search published DeepTechly research
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex min-h-12 flex-1 items-center border border-black bg-white px-4 shadow-hard">
                <Search size={18} aria-hidden="true" />
                <input
                  id="explore-search"
                  name="q"
                  defaultValue={result.query}
                  maxLength={120}
                  placeholder="Search entities, technologies, patents, agencies…"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-bold outline-none placeholder:text-muted"
                />
              </div>
              <button
                type="submit"
                className="min-h-12 border border-black bg-ink px-6 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white shadow-hard focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Search Research
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="w-full border-b border-black bg-offWhite">
        <div className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8" aria-label="Research type filters">
          <FilterLink query={result.query} active={!result.kind} label="All" />
          {discoveryKinds.map((kind) => (
            <FilterLink
              key={kind}
              query={result.query}
              kind={kind}
              active={result.kind === kind}
              label={kindLabel(kind)}
            />
          ))}
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-2 border-b border-black pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                Public research archive
              </p>
              <h2 className="mt-1 text-3xl font-black leading-tight">
                {result.query ? `Results for “${result.query}”` : "Latest research"}
              </h2>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">
              {result.total} {result.total === 1 ? "result" : "results"}
            </p>
          </div>

          {result.documents.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {result.documents.map((document) => (
                <DiscoveryCard key={document.id} document={document} />
              ))}
            </div>
          ) : (
            <div className="border border-black bg-white p-8 text-center shadow-hard">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                No matching public research
              </p>
              <h2 className="mt-3 text-2xl font-black">Try a broader technical term.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-charcoal">
                Search a company, patent, lab, technology, agency, or sector. You can
                also queue new research when the public archive has no match.
              </p>
              <Link
                href="/research"
                className="mt-6 inline-flex min-h-11 items-center gap-2 border border-black bg-deepOrange px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] shadow-hard"
              >
                Start New Research <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function FilterLink({
  active,
  kind,
  label,
  query
}: {
  active: boolean;
  kind?: DiscoveryKind;
  label: string;
  query: string;
}) {
  const parameters = new URLSearchParams();
  if (query) parameters.set("q", query);
  if (kind) parameters.set("kind", kind);
  const href = parameters.size ? `/explore?${parameters}` : "/explore";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 shrink-0 items-center border border-black px-3 py-2 text-[10px] font-black uppercase tracking-[0.13em] ${
        active ? "bg-ink text-white" : "bg-white text-ink hover:bg-paleOrange"
      }`}
    >
      {label}
    </Link>
  );
}

function DiscoveryCard({ document }: { document: DiscoveryDocument }) {
  const content = (
    <>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
        {kindLabel(document.kind)}
        {document.sector ? ` · ${document.sector}` : ""}
      </p>
      <h3 className="mt-2 text-xl font-black leading-tight">{document.title}</h3>
      {document.entityName && document.entityName !== document.title ? (
        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted">
          Related to {document.entityName}
        </p>
      ) : null}
      <p className="mt-3 line-clamp-4 text-sm font-semibold leading-6 text-charcoal">
        {document.summary}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {document.sourceCount ? <Metadata>{document.sourceCount} sources</Metadata> : null}
        {document.confidenceLabel ? <Metadata>{document.confidenceLabel}</Metadata> : null}
      </div>
      <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
        {document.external ? "Open Evidence" : `Open ${kindLabel(document.kind)}`}
        {document.external ? <ExternalLink size={13} /> : <ArrowRight size={13} />}
      </span>
    </>
  );

  const className =
    "block border border-black bg-white p-5 shadow-hard transition-colors hover:bg-paleOrange focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepOrange";

  return document.external ? (
    <a href={document.href} target="_blank" rel="noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={document.href} className={className}>
      {content}
    </Link>
  );
}

function Metadata({ children }: { children: ReactNode }) {
  return (
    <span className="border border-black bg-offWhite px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-charcoal">
      {children}
    </span>
  );
}

function kindLabel(kind: DiscoveryKind) {
  return kind === "entity" ? "Profile" : kind.charAt(0).toUpperCase() + kind.slice(1);
}
