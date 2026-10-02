import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ScanSearch } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Aperture | DeepTechly",
  description: "Government demand intelligence, filtered into signal."
};

export default function AperturePage() {
  return (
    <PageShell>
      <main className="bg-paper">
        <section className="border-b border-ink bg-deepOrange px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-[1840px]">
            <div className="mb-8 flex h-14 w-14 items-center justify-center border border-ink bg-ink text-deepOrange" aria-hidden="true">
              <ScanSearch size={28} />
            </div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em]">Aperture / DeepTechly</p>
            <h1 className="mt-4 max-w-5xl font-serif text-5xl font-black leading-[0.94] tracking-[-0.045em] sm:text-6xl lg:text-8xl">
              Focus government demand before the market sees it.
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-semibold leading-8 sm:text-xl">
              Government demand intelligence, filtered into signal.
            </p>
            <Link href="/methodology" className="mt-9 inline-flex min-h-11 items-center gap-3 border border-ink bg-ink px-5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-hard hover:bg-charcoal">
              Read the methodology <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className="mx-auto grid max-w-[1840px] gap-px border-b border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Signals", "Repeated government asks and emerging technical priorities."],
            ["Problems", "Operational needs distilled from evidence, not headlines."],
            ["Opportunities", "Requirement maps connecting demand to technical capability."],
            ["Evidence", "Primary sources, provenance, and explicit confidence."]
          ].map(([title, copy]) => (
            <div key={title} className="bg-paper p-6 lg:p-8">
              <h2 className="font-serif text-2xl font-black">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-charcoal">{copy}</p>
            </div>
          ))}
        </section>
      </main>
    </PageShell>
  );
}
