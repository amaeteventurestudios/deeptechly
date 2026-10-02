import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ApertureNav } from "@/components/aperture/ApertureNav";
import { AperturePageHeader } from "@/components/aperture/AperturePageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { listPublicAgencies } from "@/lib/aperture/public-data";

export const metadata: Metadata = { title: "Agency Intelligence | Aperture" };

export default async function AgenciesPage() {
  const agencies = await listPublicAgencies();
  return (
    <PageShell hideSectorNav>
      <AperturePageHeader eyebrow="Aperture / Agencies" title="Government demand by agency." description="Evidence-backed agency priorities, repeated asks, problem statements, and related opportunity maps." />
      <ApertureNav active="agencies" />
      <section className="bg-paper">
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
          {agencies.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {agencies.map((agency) => (
                <Link key={agency.slug} href={`/aperture/agencies/${agency.slug}`} className="block border border-black bg-white p-5 shadow-hard hover:bg-paleOrange">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">{agency.abbreviation ?? "Agency"}</p>
                  <h2 className="mt-2 text-xl font-black">{agency.name}</h2>
                  <p className="mt-3 text-sm font-semibold leading-6 text-charcoal">{agency.summary}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">Open Agency <ArrowRight size={13} /></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-black bg-white p-8 text-center shadow-hard">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">Evidence threshold active</p>
              <h2 className="mt-3 text-2xl font-black">No agency intelligence pages are published yet.</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-charcoal">Agency pages appear only when at least one public Aperture artifact has traceable official evidence for that agency.</p>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
