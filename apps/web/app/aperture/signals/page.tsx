import type { Metadata } from "next";
import { ApertureArchivePage } from "@/components/aperture/ApertureArchivePage";
import { listPublicSignals } from "@/lib/aperture/public-data";

export const metadata: Metadata = { title: "Government Signals | Aperture" };

export default async function SignalsPage() {
  return <ApertureArchivePage active="signals" eyebrow="Aperture / Signals" title="Government demand signals." description="Evidence-backed changes and repeated asks found across official government material." items={await listPublicSignals()} emptyTitle="No signals have crossed the publication threshold." emptyBody="Aperture publishes a signal only when its agency ask and supporting public evidence can be shown with explicit confidence. Candidate findings remain private until that threshold is met." />;
}
