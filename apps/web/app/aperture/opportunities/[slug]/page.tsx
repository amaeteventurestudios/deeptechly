import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApertureNav } from "@/components/aperture/ApertureNav";
import { OpportunityBrief } from "@/components/aperture/ApertureBrief";
import { PageShell } from "@/components/layout/PageShell";
import { getPublicOpportunity } from "@/lib/aperture/public-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const opportunity = await getPublicOpportunity((await params).slug);
  return opportunity ? { title: `${opportunity.title} | Aperture`, description: opportunity.summary } : {};
}

export default async function OpportunityPage({ params }: Props) {
  const opportunity = await getPublicOpportunity((await params).slug);
  if (!opportunity) notFound();
  return <PageShell hideSectorNav><ApertureNav active="opportunities" /><OpportunityBrief opportunity={opportunity} /></PageShell>;
}
