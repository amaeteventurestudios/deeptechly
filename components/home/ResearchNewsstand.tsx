import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { SaveResearchButton } from "@/components/saved/SaveResearchButton";
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
      <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-3 flex flex-col items-center gap-3 border-b border-black pb-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <h2 className="text-[13px] font-black uppercase tracking-[0.18em] text-ink">
            Research Newsstand
          </h2>
          <Link
            href="/news"
            className="inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] hover:bg-deepOrange"
          >
            View All
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-px border border-black bg-black sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {homepageSeed.newsstand.map((item) => (
            <article
              key={item.id}
              className="mx-auto flex min-h-[168px] w-full max-w-md flex-col bg-white p-3 text-center sm:max-w-none lg:text-left"
            >
              <div className="flex flex-col items-center gap-3 lg:flex-row lg:items-start lg:justify-between">
                <span
                  className={`inline-flex min-h-6 max-w-full items-center justify-center px-2 py-1 text-center text-[9px] font-black uppercase tracking-[0.12em] ${
                    labelClasses[item.type]
                  }`}
                >
                  {item.type}
                </span>
                {item.gated ? (
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center border border-black bg-offWhite"
                    aria-label="Gated dossier preview"
                  >
                    <LockKeyhole size={12} aria-hidden="true" />
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-deepOrange">
                  {item.entity ? `${item.entity} · ` : ""}
                  {item.sector}
                </p>
                <h3 className="mt-1.5 text-sm font-black leading-tight text-ink">
                  <Link href={item.href}>{item.title}</Link>
                </h3>
                <p className="mt-2 text-[9px] font-black uppercase tracking-[0.12em] text-muted">
                  {item.analyst} · {item.time}
                </p>
                <p className="mt-1 text-[10px] font-bold leading-4 text-charcoal">
                  {item.sourceCount} public sources · {item.confidence} confidence
                </p>
              </div>

              <Link
                href={item.href}
                className="mt-3 inline-flex min-h-8 items-center justify-center gap-1 text-center text-[10px] font-black uppercase tracking-[0.14em] hover:text-deepOrange"
              >
                {item.cta}
                <ArrowRight size={11} aria-hidden="true" />
              </Link>
              <SaveResearchButton
                compact
                className="mt-2 inline-flex min-h-8 items-center justify-center gap-1 border border-black bg-white px-2 py-1 text-center text-[10px] font-black uppercase tracking-[0.14em] hover:bg-deepOrange"
                entityName={item.entity}
                href={item.href}
                itemId={item.id}
                itemType={item.type}
                sector={item.sector}
                title={item.title}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
