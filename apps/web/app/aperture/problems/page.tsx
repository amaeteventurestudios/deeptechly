import type { Metadata } from "next";
import { ApertureArchivePage } from "@/components/aperture/ApertureArchivePage";
import { listPublicProblems } from "@/lib/aperture/public-data";

export const metadata: Metadata = { title: "Problem Statements | Aperture" };

export default async function ProblemsPage() {
  return <ApertureArchivePage active="problems" eyebrow="Aperture / Problems" title="Problems hidden inside the ask." description="Operational needs derived from source-backed government language and kept separate from proposed solutions." items={await listPublicProblems()} emptyTitle="No problem statements are published yet." emptyBody="Problem statements require traceable source evidence, a clear operational need, and enough context to avoid converting a single phrase into a market claim." />;
}
