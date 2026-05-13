import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeSaveButton } from "./HomeSaveButton";
import { homepageSeed } from "@/lib/seed-homepage";

export function MyResearch() {
  return (
    <section className="w-full">
      <div className="mb-3 flex flex-col items-center gap-3 border-b border-black pb-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <h2 className="text-[13px] font-black uppercase tracking-[0.18em] text-ink">
          My Research
        </h2>
        <Link
          href="/research"
          className="inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] hover:bg-deepOrange"
        >
          View All
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {homepageSeed.myResearch.map((item) => (
          <article
            key={item.id}
            className="mx-auto flex w-full max-w-sm flex-col items-center border border-black bg-white p-3 text-center transition hover:-translate-y-0.5 hover:border-deepOrange sm:max-w-none lg:items-start lg:text-left"
          >
            <div className="flex w-full items-start justify-between gap-3">
              <div className="min-w-0 text-left">
                <h3 className="text-base font-black leading-tight text-ink">
                  {item.entityName}
                </h3>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-deepOrange">
                  {item.sector}
                </p>
              </div>
              <HomeSaveButton label={item.entityName} className="h-8 w-8 shadow-none" />
            </div>
            <div className="mt-3 flex w-full flex-wrap justify-center gap-2 lg:justify-start">
              <span className="inline-flex min-h-7 items-center justify-center border border-black bg-paleOrange px-2 py-1 text-center text-[9px] font-black uppercase tracking-[0.1em]">
                {item.status}
              </span>
              <span className="inline-flex min-h-7 items-center justify-center px-1 py-1 text-center text-[9px] font-black uppercase tracking-[0.1em] text-charcoal">
                {item.confidence}
              </span>
            </div>
            <p className="mt-2 text-[10px] font-bold leading-5 text-charcoal">
              {item.updated}
            </p>
            <div className="mt-3 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              <Link
                href={item.profileHref}
                className="inline-flex min-h-9 items-center justify-center gap-1 border border-black bg-ink px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.12em] text-white hover:bg-deepOrange hover:text-ink"
              >
                Open Profile
                <ArrowRight size={12} aria-hidden="true" />
              </Link>
              <Link
                href={item.dossierHref}
                className="inline-flex min-h-9 items-center justify-center gap-1 border border-black bg-white px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.12em] hover:bg-paleOrange"
              >
                Open Dossier
                <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
