import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { homepageSeed, type HomepageContentType } from "@/lib/seed-homepage";

const labelClasses: Record<HomepageContentType, string> = {
  ARTICLE: "bg-deepOrange text-ink",
  PROFILE: "bg-ink text-white",
  DOSSIER: "bg-[#FFD23F] text-ink",
  "PATENT SIGNAL": "bg-[#1463FF] text-white",
  "GOVERNMENT SIGNAL": "bg-[#16A34A] text-white"
};

export function ResearchNewsstand() {
  return (
    <section className="w-full border-t border-black bg-paper">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <HomeSectionHeader
          eyebrow="Research Newsstand"
          title="Machine-readable research shelf"
          dek="A compact homepage archive of articles, profiles, dossiers, patent-adjacent signals, and government movement."
          actionHref="/news"
          actionLabel="Full Archive"
        />

        <div className="grid grid-cols-1 gap-px border border-black bg-black sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {homepageSeed.newsstand.map((item) => (
            <article
              key={item.id}
              className="mx-auto flex min-h-[250px] w-full max-w-md flex-col bg-white p-4 text-center sm:max-w-none lg:text-left"
            >
              <div className="flex flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-between">
                <span
                  className={`inline-flex min-h-8 max-w-full items-center justify-center px-2.5 py-1 text-center text-[9px] font-black uppercase tracking-[0.12em] ${
                    labelClasses[item.type]
                  }`}
                >
                  {item.type}
                </span>
                {item.gated ? (
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center border border-black bg-offWhite"
                    aria-label="Gated dossier preview"
                  >
                    <LockKeyhole size={14} aria-hidden="true" />
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-deepOrange">
                  {item.entity ? `${item.entity} · ` : ""}
                  {item.sector}
                </p>
                <h3 className="mt-2 text-lg font-black leading-tight text-ink">
                  <Link href={item.href}>{item.title}</Link>
                </h3>
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                  {item.analyst} · {item.time}
                </p>
                <p className="mt-3 text-xs font-bold leading-5 text-charcoal">
                  {item.sourceCount} public sources · {item.confidence} confidence
                </p>
              </div>

              <Link
                href={item.href}
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-offWhite px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] hover:bg-deepOrange"
              >
                {item.cta}
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
