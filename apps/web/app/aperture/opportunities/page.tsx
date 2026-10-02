import type { Metadata } from "next";
import { ApertureArchivePage } from "@/components/aperture/ApertureArchivePage";
import { listPublicOpportunities } from "@/lib/aperture/public-data";

export const metadata: Metadata = { title: "Opportunity Maps | Aperture" };

export default async function OpportunitiesPage() {
  return <ApertureArchivePage active="opportunities" eyebrow="Aperture / Opportunities" title="Technical opportunity maps." description="Repeated demand and requirement maps connected carefully to relevant companies, patents, labs, and technologies." items={await listPublicOpportunities()} emptyTitle="No opportunity maps are published yet." emptyBody="Aperture will not infer an opportunity from category enthusiasm alone. Publication requires a supported problem, mapped requirements, and transparent capability-match reasoning." />;
}
