import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FileType2, ScanLine } from "lucide-react";
import {
  CompetitiveLandscapeTable,
  AccuracyConfidencePanel,
  ConfidenceScorePanel,
  DossierSourcesBlock,
  MarketPositionSection,
  OverviewSection,
  SnapshotPanel,
  TechnicalSummarySection
} from "@/components/dossier/DossierComponents";
import { PageShell } from "@/components/layout/PageShell";
import { entities } from "@/lib/data";
import { getPublishedArtifactAvailability, getPublishedEntityBySlug } from "@/lib/research/public-data";
import type { ResearchEntity } from "@/lib/types";

export const dynamic = "force-dynamic";

type StartupProfilePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return entities.map((entity) => ({ slug: entity.slug }));
}

export async function generateMetadata({ params }: StartupProfilePageProps) {
  const { slug } = await params;
  const entity = await getPublishedEntityBySlug(slug);

  if (!entity) {
    return { title: "Profile not found | DeepTechly" };
  }

  return {
    title: `${entity.name} Research Profile | DeepTechly`,
    description: entity.summary,
    alternates: {
      canonical: `/startup/${entity.slug}`
    },
    openGraph: {
      title: `${entity.name} Research Profile | DeepTechly`,
      description: entity.summary,
      url: `/startup/${entity.slug}`,
      type: "article",
      modifiedTime: entity.updatedAt ?? undefined
    },
    other: {
      "deeptechly:sector": entity.sector,
      "deeptechly:confidence": entity.confidenceLabel
    }
  };
}

export default async function StartupProfilePage({
  params
}: StartupProfilePageProps) {
  const { slug } = await params;
  const entity = await getPublishedEntityBySlug(slug);

  if (!entity) {
    notFound();
  }

  const availability = await getPublishedArtifactAvailability(slug);

  return (
    <PageShell>
      <ProfileHero entity={entity} articleAvailable={availability.article} dossierAvailable={availability.dossier} />
      <section className="w-full bg-paper">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <main className="min-w-0">
            <OverviewSection entity={entity} />
            <TechnicalSummarySection entity={entity} />
            <MarketPositionSection entity={entity} />
            <CompetitiveLandscapeTable entity={entity} />
            <KeySignalsSection entity={entity} />
            <OpenQuestionsSection entity={entity} />
            <TechnologyTagsSection entity={entity} />
            <DossierSourcesBlock sources={entity.sources} />
            <AccuracyConfidencePanel entity={entity} />
          </main>
          <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
            <SnapshotPanel entity={entity} embedded />
            <ConfidenceScorePanel entity={entity} />
            <ProfileLinksSection entity={entity} articleAvailable={availability.article} dossierAvailable={availability.dossier} />
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function ProfileHero({ entity, articleAvailable, dossierAvailable }: { entity: ResearchEntity; articleAvailable: boolean; dossierAvailable: boolean }) {
  return (
    <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
      <div className="mx-auto grid max-w-[1200px] gap-9 px-4 py-12 text-center sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8 lg:text-left">
        <div>
          <p className="break-all font-mono text-[11px] font-black uppercase tracking-[0.22em]">
            Public Research Profile / DT-{entity.slug.toUpperCase()}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-serif text-5xl font-black leading-[0.92] tracking-[-0.04em] sm:text-6xl md:text-7xl lg:mx-0">
            {entity.name}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-ink/82 md:text-lg lg:mx-0">
            {entity.summary}
          </p>
          <dl className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.1em] lg:justify-start">
            <div><dt className="inline text-ink/60">Sources </dt><dd className="inline">{entity.sourceCount}</dd></div>
            <div><dt className="inline text-ink/60">Confidence </dt><dd className="inline">{entity.confidenceLabel}</dd></div>
            <div><dt className="inline text-ink/60">Updated </dt><dd className="inline"><time>{entity.updatedAt ?? entity.lastResearchedAt}</time></dd></div>
          </dl>
          <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
            {entity.tags.slice(0, 6).map((tag) => (
              <span
                key={tag}
                className="border border-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.13em]"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-7 flex flex-col justify-center gap-3 min-[430px]:flex-row lg:justify-start">
            {articleAvailable ? <Link
              href={`/article/${entity.slug}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-ink px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-hard"
            >
              Read Article
              <ArrowRight size={14} aria-hidden="true" />
            </Link> : null}
            {dossierAvailable ? <Link href={`/dossier/${entity.slug}`} className="inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard">Open Dossier<ArrowRight size={14} aria-hidden="true" /></Link> : null}
            <Link href={`/startup/${entity.slug}.md`} className="inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard">
              <FileType2 size={14} aria-hidden="true" />
              Markdown
            </Link>
          </div>
        </div>
        <ProfileTechnicalVisual entity={entity} />
      </div>
    </section>
  );
}

function ProfileTechnicalVisual({ entity }: { entity: ResearchEntity }) {
  const image = entity.heroImageUrl ?? entity.heroImage ?? entity.article.heroImageUrl ?? entity.article.heroImage;

  return (
    <div className="border border-ink bg-white p-3 shadow-hardLg">
      <div
        className="relative flex min-h-72 items-center justify-center overflow-hidden border border-ink bg-ink text-deepOrange"
        role="img"
        aria-label={entity.heroImageAlt ?? `${entity.name} technical research visual`}
        style={image ? { backgroundImage: `url(${image})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
      >
        {!image ? (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,90,0,0.35)_0_1px,transparent_1px_16px)]" />
            <div className="absolute inset-8 border border-deepOrange/50" />
            <div className="relative flex h-28 w-28 items-center justify-center border border-deepOrange bg-black shadow-orange">
              <ScanLine size={52} strokeWidth={1.5} aria-hidden="true" />
            </div>
          </>
        ) : null}
        <div className="absolute bottom-3 left-3 right-3 border border-ink bg-white px-3 py-2 text-left text-ink">
          <p className="font-mono text-[0.625rem] font-black uppercase tracking-[0.16em] text-darkOrange">Technical file / {entity.sector}</p>
          <p className="mt-1 truncate text-sm font-black">{entity.article.visualCaption || entity.name}</p>
        </div>
      </div>
      {entity.imageAttribution ? <p className="mt-2 text-[0.625rem] font-bold leading-4 text-muted">Image: {entity.imageAttribution}</p> : null}
    </div>
  );
}

function TechnologyTagsSection({ entity }: { entity: ResearchEntity }) {
  const tags = Array.from(
    new Set([
      entity.sector,
      ...entity.secondarySectors,
      ...entity.tags,
      ...(entity.sectorTags ?? [])
    ])
  ).filter(Boolean);

  return (
    <section className="border-t border-black/20 py-8">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
        Public Profile
      </p>
      <h2 className="mt-1 text-3xl font-black leading-tight">Technology tags</h2>
      <div className="mt-5 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_#0f0f0f]"
          >
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}

function KeySignalsSection({ entity }: { entity: ResearchEntity }) {
  const signals = [
    entity.dossier.opportunity.government[0],
    entity.dossier.opportunity.technical[0],
    entity.dossier.companyPositioning.strategicWedge,
    entity.dossier.accuracyAndConfidence.confirmed[0]
  ].filter(Boolean);

  if (!signals.length) return null;

  return (
    <section className="border-t border-black/20 py-8">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
        Public Profile
      </p>
      <h2 className="mt-1 text-3xl font-black leading-tight">Key signals</h2>
      <div className="mt-5 grid gap-3">
        {signals.map((signal) => (
          <div key={signal} className="border border-black bg-white p-4 text-sm font-bold leading-6 shadow-hard">
            {signal}
          </div>
        ))}
      </div>
    </section>
  );
}

function OpenQuestionsSection({ entity }: { entity: ResearchEntity }) {
  const questions = entity.dossier.accuracyAndConfidence.unverified;
  if (!questions.length) return null;

  return (
    <section className="border-t border-black/20 py-8">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
        Public Profile
      </p>
      <h2 className="mt-1 text-3xl font-black leading-tight">Open questions</h2>
      <div className="mt-5 grid gap-3">
        {questions.map((question) => (
          <div key={question} className="border border-black bg-offWhite p-4 text-sm font-bold leading-6">
            {question}
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfileLinksSection({ entity, articleAvailable, dossierAvailable }: { entity: ResearchEntity; articleAvailable: boolean; dossierAvailable: boolean }) {
  return (
    <section className="border-t border-black/20 py-8">
      <div className="grid gap-4">
        {articleAvailable ? <Link
          href={`/article/${entity.slug}`}
          className="block border border-black bg-white p-5 shadow-hard hover:bg-paleOrange"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
            Article
          </p>
          <h2 className="mt-2 text-xl font-black leading-tight">
            Read the feature article
          </h2>
          <p className="mt-2 text-sm leading-6 text-charcoal">
            Open the editorial research narrative for {entity.name}.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
            Open Article
            <ArrowRight size={13} />
          </span>
        </Link> : null}
        {dossierAvailable ? <Link
          href={`/dossier/${entity.slug}`}
          className="block border border-black bg-ink p-5 text-white shadow-hard hover:bg-charcoal"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
            Dossier
          </p>
          <h2 className="mt-2 text-xl font-black leading-tight">
            Open the institutional dossier
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/72">
            View the public dossier and locked institutional analysis.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
            Open Dossier
            <ArrowRight size={13} />
          </span>
        </Link> : null}
      </div>
    </section>
  );
}
