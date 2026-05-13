import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeSaveButton } from "./HomeSaveButton";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { homepageSeed } from "@/lib/seed-homepage";

export function MyResearch() {
  return (
    <section className="w-full border-t border-black bg-paper">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <HomeSectionHeader
          eyebrow="My Research"
          title="Demo research workspace"
          dek="A homepage-only seed preview of tracked profiles, dossiers, confidence labels, and public-data status."
          actionHref="/research"
          actionLabel="View All"
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {homepageSeed.myResearch.map((item) => (
            <article
              key={item.id}
              className="mx-auto flex w-full max-w-md flex-col items-center border border-black bg-white p-5 text-center shadow-hard transition hover:-translate-y-0.5 hover:border-deepOrange hover:shadow-hardLg lg:max-w-none lg:items-start lg:text-left"
            >
              <div className="flex w-full flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                    {item.sector}
                  </p>
                  <h3 className="mt-2 text-2xl font-black leading-tight text-ink">
                    {item.entityName}
                  </h3>
                </div>
                <HomeSaveButton label={item.entityName} />
              </div>
              <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
                <span className="inline-flex min-h-8 items-center justify-center border border-black bg-paleOrange px-3 py-1 text-center text-[10px] font-black uppercase tracking-[0.12em]">
                  {item.status}
                </span>
                <span className="inline-flex min-h-8 items-center justify-center border border-black bg-offWhite px-3 py-1 text-center text-[10px] font-black uppercase tracking-[0.12em]">
                  {item.confidence} Confidence
                </span>
              </div>
              <p className="mt-4 text-sm font-bold leading-6 text-charcoal">
                {item.updated}
              </p>
              <div className="mt-5 flex w-full flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                <Link
                  href={item.profileHref}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-black bg-ink px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.14em] text-white hover:bg-deepOrange hover:text-ink sm:w-auto"
                >
                  Open Profile
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <Link
                  href={item.dossierHref}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-black bg-white px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_#0f0f0f] hover:bg-paleOrange sm:w-auto"
                >
                  Open Dossier
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
