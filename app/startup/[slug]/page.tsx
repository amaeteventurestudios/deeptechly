import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  CompetitiveLandscapeTable,
  ConfidenceScorePanel,
  DossierSourcesBlock,
  MarketPositionSection,
  OverviewSection,
  SnapshotPanel,
  TechnicalSummarySection
} from "@/components/dossier/DossierComponents";
import { PageShell } from "@/components/layout/PageShell";
import { entities } from "@/lib/data";
import { getEntityBySlugFromAll } from "@/lib/research/public-data";
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
  const entity = await getEntityBySlugFromAll(slug);

  if (!entity) {
    return { title: "Profile not found | DeepTechly" };
  }

  return {
    title: `${entity.name} Research Profile | DeepTechly`,
    description: entity.summary
  };
}

export default async function StartupProfilePage({
  params
}: StartupProfilePageProps) {
  const { slug } = await params;
  const entity = await getEntityBySlugFromAll(slug);

  if (!entity) {
    notFound();
  }

  return (
    <PageShell>
      <ProfileHero entity={entity} />
      <SnapshotPanel entity={entity} />
      <section className="w-full bg-paper">
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-2 sm:px-6 lg:px-8">
          <OverviewSection entity={entity} />
          <TechnicalSummarySection entity={entity} />
          <MarketPositionSection entity={entity} />
          <CompetitiveLandscapeTable entity={entity} />
          <TechnologyTagsSection entity={entity} />
          <DossierSourcesBlock sources={entity.sources} />
          <ConfidenceScorePanel entity={entity} />
          <ProfileLinksSection entity={entity} />
        </div>
      </section>
    </PageShell>
  );
}

function ProfileHero({ entity }: { entity: ResearchEntity }) {
  return (
    <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-[11px] font-black uppercase tracking-[0.28em]">
          Public Research Profile
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl md:text-7xl">
          {entity.name}
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-ink/82 md:text-lg">
          {entity.summary}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {entity.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="border border-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.13em]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={`/article/${entity.slug}`}
            className="inline-flex items-center justify-center gap-2 border border-black bg-ink px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-hard"
          >
            Read Article
            <ArrowRight size={14} />
          </Link>
          <Link
            href={`/dossier/${entity.slug}`}
            className="inline-flex items-center justify-center gap-2 border border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard"
          >
            Open Dossier
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
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

function ProfileLinksSection({ entity }: { entity: ResearchEntity }) {
  return (
    <section className="border-t border-black/20 py-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
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
        </Link>
        <Link
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
        </Link>
      </div>
    </section>
  );
}
