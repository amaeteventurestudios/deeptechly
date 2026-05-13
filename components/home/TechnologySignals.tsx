import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { homepageSeed } from "@/lib/seed-homepage";

export function TechnologySignals() {
  return (
    <section className="mx-auto w-full max-w-md border border-black bg-white p-5 shadow-hard lg:max-w-none">
      <div className="text-center lg:text-left">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-deepOrange">
          Technology Signals
        </p>
        <h3 className="mt-2 text-2xl font-black leading-tight text-ink">
          Momentum watch
        </h3>
      </div>
      <div className="mt-5 divide-y divide-[#D8D0C7]">
        {homepageSeed.technologySignals.map((signal) => (
          <article
            key={signal.id}
            className="flex flex-col items-center gap-3 py-4 text-center sm:flex-row sm:items-start sm:text-left"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-black bg-paleOrange">
              <TrendingUp size={16} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black leading-tight text-ink">
                {signal.name}
              </h4>
              <p className="mt-1 text-xs font-semibold leading-5 text-charcoal">
                {signal.explanation}
              </p>
            </div>
            <span className="shrink-0 text-lg font-black text-deepOrange">
              {signal.change}
            </span>
          </article>
        ))}
      </div>
      <Link
        href="/explore"
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 border border-black bg-ink px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.14em] text-white hover:bg-deepOrange hover:text-ink"
      >
        View All Signals
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}
