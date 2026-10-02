import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApertureArchive } from "@/components/aperture/ApertureArchive";
import { ApertureNav } from "@/components/aperture/ApertureNav";
import { AperturePageHeader } from "@/components/aperture/AperturePageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { getPublicAgency, listPublicProblems, listPublicSignals } from "@/lib/aperture/public-data";

type Props = { params: Promise<{ agency: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const agency = await getPublicAgency((await params).agency);
  return agency ? { title: `${agency.name} Intelligence | Aperture`, description: agency.summary, alternates: { canonical: `/aperture/agencies/${agency.slug}` } } : {};
}

export default async function AgencyPage({ params }: Props) {
  const agencySlug = (await params).agency;
  const [agency, signals, problems] = await Promise.all([
    getPublicAgency(agencySlug),
    listPublicSignals(),
    listPublicProblems()
  ]);
  if (!agency) notFound();
  const items = [...signals.filter((item) => item.agency.slug === agencySlug), ...problems.filter((item) => item.agency?.slug === agencySlug)];
  return (
    <PageShell hideSectorNav>
      <AperturePageHeader eyebrow={`Aperture / ${agency.abbreviation ?? "Agency"}`} title={agency.name} description={agency.summary} />
      <ApertureNav active="agencies" />
      <section className="bg-paper"><div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8"><ApertureArchive items={items} emptyTitle="No public findings for this agency." emptyBody="Agency intelligence remains unpublished until its source evidence and confidence assessment cross the Aperture threshold." /></div></section>
    </PageShell>
  );
}
