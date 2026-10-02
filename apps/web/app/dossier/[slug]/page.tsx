import { notFound } from "next/navigation";
import {
  type InstitutionalAccessState,
  CompetitiveLandscapeTable,
  AccuracyConfidencePanel,
  ConfidenceScorePanel,
  DataSnapshotPanel,
  DossierHero,
  DossierSourcesBlock,
  ExecutiveSummary,
  ExternalLinksRow,
  InstitutionalDossierSections,
  MarketPositionSection,
  CompanyPositioningPanel,
  OpportunityPanel,
  OverviewSection,
  RelatedResearchGrid,
  SnapshotPanel,
  TaxonomySnapshotTable,
  TechnicalSummarySection
} from "@/components/dossier/DossierComponents";
import { PageShell } from "@/components/layout/PageShell";
import { StructuredResearchData } from "@/components/seo/StructuredResearchData";
import {
  getAuthSession,
  getInstitutionalAccessState
} from "@/lib/auth/session";
import { entities } from "@/lib/data";
import { getPublishedArtifactAvailability, getPublishedDossierEntityBySlug } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

type DossierPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return entities.map((entity) => ({ slug: entity.slug }));
}

export async function generateMetadata({ params }: DossierPageProps) {
  const { slug } = await params;
  const entity = await getPublishedDossierEntityBySlug(slug);

  if (!entity) {
    return { title: "Dossier not found | DeepTechly" };
  }

  return {
    title: `${entity.name} Dossier | DeepTechly`,
    description: entity.summary,
    alternates: {
      canonical: `/dossier/${entity.slug}`
    },
    openGraph: {
      title: `${entity.name} Dossier | DeepTechly`,
      description: entity.summary,
      url: `/dossier/${entity.slug}`,
      type: "article",
      modifiedTime: entity.updatedAt ?? undefined
    },
    other: {
      "deeptechly:sector": entity.sector,
      "deeptechly:confidence": entity.confidenceLabel
    }
  };
}

export default async function DossierPage({ params }: DossierPageProps) {
  const { slug } = await params;
  const entity = await getPublishedDossierEntityBySlug(slug);
  const session = await getAuthSession();
  const accessState: InstitutionalAccessState =
    getInstitutionalAccessState(session);

  if (!entity) {
    notFound();
  }

  const availability = await getPublishedArtifactAvailability(slug);

  return (
    <PageShell>
      <StructuredResearchData type="Report" title={`${entity.name} institutional dossier`} description={entity.summary} path={`/dossier/${entity.slug}`} about={entity.name} dateModified={entity.updatedAt} citations={entity.dossier.sources.map((source) => source.url)} />
      <DossierHero entity={entity} articleAvailable={availability.article} profileAvailable={availability.profile} />
      <ExternalLinksRow entity={entity} />
      <SnapshotPanel entity={entity} />
      <section className="w-full bg-paper">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 pb-12 pt-2 sm:px-6 lg:px-8 xl:grid-cols-[220px_minmax(0,1fr)]">
          <DossierIndex />
          <div className="min-w-0">
            <ExecutiveSummary entity={entity} />
            <TaxonomySnapshotTable entity={entity} />
            <OverviewSection entity={entity} />
            <TechnicalSummarySection entity={entity} />
            <MarketPositionSection entity={entity} />
            <CompetitiveLandscapeTable entity={entity} />
            <CompanyPositioningPanel entity={entity} />
            <OpportunityPanel entity={entity} />
            <DataSnapshotPanel entity={entity} />
            <DossierSourcesBlock sources={entity.dossier.sources} />
            <ConfidenceScorePanel entity={entity} />
            <AccuracyConfidencePanel entity={entity} />
            <InstitutionalDossierSections entity={entity} accessState={accessState} />
            <RelatedResearchGrid entity={entity} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

const dossierIndex = [
  "Executive summary",
  "Taxonomy snapshot",
  "Overview",
  "Technical summary",
  "Market position",
  "Competitive landscape",
  "Company positioning",
  "Opportunity",
  "Evidence and readiness cards",
  "Sources",
  "Confidence score",
  "Accuracy and confidence",
  "Institutional layer",
  "Related research"
] as const;

function DossierIndex() {
  return (
    <aside className="hidden xl:block">
      <nav aria-label="Dossier index" className="sticky top-6 border-l-4 border-ink pl-4">
        <p className="font-mono text-[0.6875rem] font-black uppercase tracking-[0.18em] text-darkOrange">Dossier index</p>
        <ol className="mt-4 space-y-2">
          {dossierIndex.map((title, index) => (
            <li key={title}>
              <a className="block py-1 text-xs font-bold leading-5 text-muted hover:text-ink" href={`#${dossierSectionId(title)}`}>
                <span className="mr-2 font-mono text-[0.625rem] text-darkOrange">{String(index + 1).padStart(2, "0")}</span>
                {title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}

function dossierSectionId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
