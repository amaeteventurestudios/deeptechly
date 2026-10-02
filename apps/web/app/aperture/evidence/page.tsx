import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ApertureNav } from "@/components/aperture/ApertureNav";
import { AperturePageHeader } from "@/components/aperture/AperturePageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { listPublicEvidencePacks } from "@/lib/aperture/public-data";

export const metadata: Metadata = { title: "Evidence Packs | Aperture" };

export default async function EvidencePage() {
  const packs = await listPublicEvidencePacks();
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
          <div className="mt-8 space-y-5">
            {packs.map((pack) => (
              <article key={pack.slug} className="border border-black bg-white p-6 shadow-hard">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">{pack.confidenceLabel} · {pack.sources.length} sources</p>
                <h2 className="mt-2 font-serif text-3xl font-black">{pack.title}</h2>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-charcoal">{pack.summary}</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {pack.sources.map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="border border-black bg-offWhite p-3 text-xs font-black leading-5 hover:bg-paleOrange">
                      {source.title} <ExternalLink className="ml-1 inline" size={12} />
                    </a>
                  ))}
                </div>
                <Link href={`/aperture/${pack.subjectType === "opportunity" ? "opportunities" : `${pack.subjectType}s`}/${pack.subjectSlug}`} className="mt-5 inline-flex min-h-11 items-center border border-black bg-ink px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white">Open Supported Brief</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
