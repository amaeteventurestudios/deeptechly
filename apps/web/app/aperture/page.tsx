import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ScanSearch } from "lucide-react";
import { ApertureNav } from "@/components/aperture/ApertureNav";
import { PageShell } from "@/components/layout/PageShell";
import {
  listPublicAgencies,
  listPublicOpportunities,
  listPublicProblems,
  listPublicSignals
} from "@/lib/aperture/public-data";

export const metadata: Metadata = {
  title: "Aperture | DeepTechly",
  description: "Government demand intelligence, filtered into signal."
};

export default async function AperturePage() {
  const [signals, problems, opportunities, agencies] = await Promise.all([
    listPublicSignals(),
    listPublicProblems(),
    listPublicOpportunities(),
    listPublicAgencies()
  ]);
  const modules = [
    ["Signals", "Repeated government asks and emerging technical priorities.", "/aperture/signals", signals.length],
    ["Problems", "Operational needs distilled from evidence, not headlines.", "/aperture/problems", problems.length],
    ["Opportunities", "Requirement maps connecting demand to technical capability.", "/aperture/opportunities", opportunities.length],
    ["Agencies", "Evidence-backed demand patterns organized by government buyer.", "/aperture/agencies", agencies.length]
  ] as const;

  return (
    <PageShell hideSectorNav>
      <main className="bg-paper">
        <section className="border-b border-ink bg-deepOrange px-4 py-16 deeptech-texture sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-[1440px]">
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
            <Link href="/aperture/methodology" className="mt-9 inline-flex min-h-11 items-center gap-3 border border-ink bg-ink px-5 text-xs font-black uppercase tracking-[0.12em] text-white shadow-hard hover:bg-charcoal">
              Read the methodology <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <ApertureNav />
        <section className="mx-auto grid max-w-[1440px] gap-px border-x border-b border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
          {modules.map(([title, copy, href, count]) => (
            <Link key={title} href={href} className="group bg-paper p-6 hover:bg-paleOrange lg:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-deepOrange">{count} published</p>
              <h2 className="mt-2 font-serif text-2xl font-black">{title}</h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-charcoal">{copy}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">Open {title} <ArrowRight size={13} /></span>
            </Link>
          ))}
        </section>
        <section className="border-b border-black bg-offWhite">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">Demand intelligence system</p>
              <h2 className="mt-3 font-serif text-4xl font-black leading-tight">From primary evidence to an opportunity map.</h2>
            </div>
            <ol className="grid gap-px border border-black bg-black sm:grid-cols-2">
              {[
                ["01", "Acquire", "Read official solicitations, budgets, strategy, testimony, and program material."],
                ["02", "Extract", "Separate the agency ask, operational problem, constraints, and technical requirements."],
                ["03", "Detect", "Compare evidence over time to identify repeated demand without overstating similarity."],
                ["04", "Map", "Connect supported requirements to companies, patents, labs, and technologies with provenance."]
              ].map(([number, title, body]) => (
                <li key={number} className="bg-white p-5">
                  <p className="text-[10px] font-black tracking-[0.18em] text-deepOrange">{number}</p>
                  <h3 className="mt-2 text-xl font-black">{title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-charcoal">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
