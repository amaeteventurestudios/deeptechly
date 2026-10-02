import type { Metadata } from "next";
import { ApertureNav } from "@/components/aperture/ApertureNav";
import { AperturePageHeader } from "@/components/aperture/AperturePageHeader";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Methodology | Aperture" };

const sections = [
  ["1. Discovery is not evidence", "Aperture scans BAAs, SBIR/STTR topics, RFIs, OTAs, FOAs, challenges, budgets, strategy, speeches, testimony, GAO/CRS material, technical solicitations, patents, and lab material. Discovery only identifies what to investigate; it does not establish a claim."],
  ["2. The agency ask", "Readers separate explicit requested outcomes, operational context, constraints, evaluation criteria, dates, and program identifiers. Source wording is preserved in evidence records while public briefs use attributed summaries."],
  ["3. Problem derivation", "A problem statement describes the operational need without silently adopting a vendor solution. It must remain traceable to evidence and distinguish explicit language from analyst inference."],
  ["4. Repeated demand", "A repeated-demand finding requires multiple relevant observations. Similar vocabulary alone is insufficient: agency, mission, time, requirement, and technical context all affect whether two asks belong together."],
  ["5. Requirement mapping", "Technical requirements retain their evidence link, priority, and uncertainty. Aperture does not convert broad policy goals into precise performance specifications unless the source supports them."],
  ["6. Capability matching", "Companies, patents, labs, and technologies are matched against supported requirements. Category fit is not proof of readiness, eligibility, procurement interest, or contract probability."],
  ["7. Confidence and contradictions", "Confidence reflects source authority, independence, recency, claim support, and contradictions. Conflicts remain visible until resolved or accepted as uncertainty."],
  ["8. Publication threshold", "Public artifacts require a clear subject, public source provenance, an evidence-backed core finding, a confidence label, and no unresolved blocker that would make the headline misleading."]
] as const;

export default function MethodologyPage() {
  return (
    <PageShell hideSectorNav>
      <AperturePageHeader eyebrow="Aperture / Methodology" title="How Aperture turns government material into signal." description="A bounded, evidence-first workflow for finding demand patterns without confusing a solicitation, mention, or category trend with market truth." />
      <ApertureNav active="methodology" />
      <article className="bg-paper">
        <div className="mx-auto max-w-[960px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="border border-black bg-ink p-5 text-white shadow-hard">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">Core rule</p>
            <p className="mt-2 font-serif text-2xl font-black leading-tight">Government activity is evidence of an ask—not proof of a market, award, customer, deployment, or company fit.</p>
          </div>
          <div className="mt-10 space-y-10">
            {sections.map(([title, body]) => <section key={title} className="border-t border-black pt-5"><h2 className="font-serif text-3xl font-black">{title}</h2><p className="mt-4 text-base font-medium leading-8 text-charcoal">{body}</p></section>)}
          </div>
          <section className="mt-10 border-t border-black pt-5"><h2 className="font-serif text-3xl font-black">Known limitations</h2><ul className="mt-4 list-disc space-y-3 pl-5 text-base font-medium leading-8 text-charcoal"><li>Public material can omit classified, pre-solicitation, cancelled, or informal demand.</li><li>Repeated language may reflect policy reuse rather than independent operational demand.</li><li>Capability matches are analytical leads, not endorsements or procurement predictions.</li><li>Deadlines, statuses, and program details can change; readers should verify the cited official source.</li></ul></section>
        </div>
      </article>
    </PageShell>
  );
}
