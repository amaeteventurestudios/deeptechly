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
  OverviewSection,
  RelatedResearchGrid,
  SnapshotPanel,
  TechnicalSummarySection
} from "@/components/dossier/DossierComponents";
import { PageShell } from "@/components/layout/PageShell";
import {
  getAuthSession,
  getInstitutionalAccessState
} from "@/lib/auth/session";
import { entities } from "@/lib/data";
import { getEntityBySlugFromAll } from "@/lib/research/public-data";

export const dynamic = "force-dynamic";

type DossierPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return entities.map((entity) => ({ slug: entity.slug }));
}

export async function generateMetadata({ params }: DossierPageProps) {
  const { slug } = await params;
  const entity = await getEntityBySlugFromAll(slug);

  if (!entity) {
    return { title: "Dossier not found | DeepTechly" };
  }

  return {
    title: `${entity.name} Dossier | DeepTechly`,
    description: entity.summary
  };
}

export default async function DossierPage({ params }: DossierPageProps) {
  const { slug } = await params;
  const entity = await getEntityBySlugFromAll(slug);
  const session = await getAuthSession();
  const accessState: InstitutionalAccessState =
    getInstitutionalAccessState(session);

  if (!entity) {
    notFound();
  }

  return (
    <PageShell>
      <DossierHero entity={entity} />
      <ExternalLinksRow entity={entity} />
      <SnapshotPanel entity={entity} />
      <section className="w-full bg-paper">
        <div className="mx-auto max-w-4xl px-4 pb-12 pt-2 sm:px-6 lg:px-8">
          <ExecutiveSummary entity={entity} />
          <OverviewSection entity={entity} />
          <TechnicalSummarySection entity={entity} />
          <MarketPositionSection entity={entity} />
          <CompetitiveLandscapeTable entity={entity} />
          <DataSnapshotPanel entity={entity} />
          <DossierSourcesBlock sources={entity.dossier.sources} />
          <ConfidenceScorePanel entity={entity} />
          <AccuracyConfidencePanel entity={entity} />
          <InstitutionalDossierSections entity={entity} accessState={accessState} />
          <RelatedResearchGrid entity={entity} />
        </div>
      </section>
    </PageShell>
  );
}
