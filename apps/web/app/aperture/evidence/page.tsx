import type { Metadata } from "next";
import { ApertureNav } from "@/components/aperture/ApertureNav";
import { AperturePageHeader } from "@/components/aperture/AperturePageHeader";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Evidence Packs | Aperture" };

export default function EvidencePage() {
  return (
    <PageShell hideSectorNav>
      <AperturePageHeader eyebrow="Aperture / Evidence" title="Evidence before inference." description="Primary government documents, provenance, requirement excerpts, and explicit confidence assembled into reviewable evidence packs." />
      <ApertureNav active="evidence" />
      <section className="bg-paper">
        <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-px border border-black bg-black md:grid-cols-3">
            {[
              ["Primary material", "Solicitations, budget documents, agency strategy, testimony, speeches, official reports, and program pages."],
              ["Evidence units", "Source locator, exact excerpt or structured fact, retrieval time, content hash, and the claim or requirement it supports."],
              ["Review state", "Confirmed, inferred, unverified, or conflicting—with source authority and contradiction handling visible to reviewers."]
            ].map(([title, body]) => <article key={title} className="bg-white p-6"><h2 className="font-serif text-2xl font-black">{title}</h2><p className="mt-3 text-sm font-semibold leading-6 text-charcoal">{body}</p></article>)}
          </div>
          <div className="mt-8 border border-black bg-white p-8 text-center shadow-hard">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">Public evidence packs</p>
            <h2 className="mt-3 text-2xl font-black">No evidence packs are published yet.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-charcoal">Aperture will publish evidence packs only after source rights, public visibility, provenance, and the associated claim links are verified.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
