import { notFound } from "next/navigation";
import {
  AccuracyConfidencePanel,
  CompanyOverviewSection,
  CompanyPositioningPanel,
  CompetitiveLandscapeTable,
  CultureHealthSection,
  DataSnapshotPanel,
  DossierHero,
  DossierSourcesBlock,
  ExecutiveSummary,
  ExternalLinksRow,
  FounderTeamSection,
  HiringSignalSection,
  InvestorReadSection,
  MarketResearchSection,
  OpportunityPanel,
  ProductTechnologySection,
  RelatedResearchGrid,
  RevenueUnitEconomicsTable,
  RisksConstraintsSection,
  ScenarioScroller,
  ScenarioTextSection,
  SeniorTeamSection,
  SnapshotPanel,
  SocialPRSignalSection,
  StrategicOutlookSection,
  TaxonomySnapshotTable,
  TeamSignalSection,
  TractionMetricsSection
} from "@/components/dossier/DossierComponents";
import { PageShell } from "@/components/layout/PageShell";
import { entities, getEntityBySlug } from "@/lib/data";

type StartupDossierPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return entities.map((entity) => ({ slug: entity.slug }));
}

export async function generateMetadata({ params }: StartupDossierPageProps) {
  const { slug } = await params;
  const entity = getEntityBySlug(slug);

  if (!entity) {
    return { title: "Dossier not found | DeepTechly" };
  }

  return {
    title: `${entity.name} Research Dossier | DeepTechly`,
    description: entity.summary
  };
}

export default async function StartupDossierPage({
  params
}: StartupDossierPageProps) {
  const { slug } = await params;
  const entity = getEntityBySlug(slug);

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
          <TaxonomySnapshotTable entity={entity} />
          <CompanyOverviewSection entity={entity} />
          <ProductTechnologySection entity={entity} />
          <MarketResearchSection entity={entity} />
          <DataSnapshotPanel entity={entity} />
          <AccuracyConfidencePanel entity={entity} />
          <CompetitiveLandscapeTable entity={entity} />
          <CompanyPositioningPanel entity={entity} />
          <OpportunityPanel entity={entity} />
          <ScenarioScroller entity={entity} />
          <InvestorReadSection entity={entity} />
          <FounderTeamSection entity={entity} />
          <SeniorTeamSection entity={entity} />
          <TeamSignalSection entity={entity} />
          <CultureHealthSection entity={entity} />
          <HiringSignalSection entity={entity} />
          <TractionMetricsSection entity={entity} />
          <SocialPRSignalSection entity={entity} />
          <RevenueUnitEconomicsTable entity={entity} />
          <ScenarioTextSection
            title="Best case scenario"
            items={entity.dossier.bestCaseScenario}
          />
          <ScenarioTextSection
            title="Base case scenario"
            items={entity.dossier.baseCaseScenario}
          />
          <ScenarioTextSection
            title="Downside scenario"
            items={entity.dossier.downsideScenario}
          />
          <RisksConstraintsSection entity={entity} />
          <StrategicOutlookSection entity={entity} />
          <DossierSourcesBlock sources={entity.dossier.sources} />
          <RelatedResearchGrid entity={entity} />
        </div>
      </section>
    </PageShell>
  );
}
