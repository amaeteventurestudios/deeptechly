import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { homepageSeed } from "@/lib/seed-homepage";

export function TechnologySignals() {
  return (
    <section className="mx-auto w-full max-w-md bg-white p-4 lg:max-w-none">
      <div className="text-center lg:text-left">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-ink">
          Technology Signals
        </p>
      </div>
      <div className="mt-3 divide-y divide-[#D8D0C7]">
        {homepageSeed.technologySignals.map((signal) => (
          <article
            key={signal.id}
            className="grid grid-cols-1 items-center gap-2 py-2 text-center sm:grid-cols-[1fr_auto] sm:text-left"
          >
            <div className="min-w-0 flex-1">
              <h4 className="flex items-center justify-center gap-2 text-xs font-black leading-tight text-ink sm:justify-start">
                <TrendingUp size={12} className="text-deepOrange" aria-hidden="true" />
                {signal.name}
              </h4>
              <p className="mt-0.5 text-[11px] font-semibold leading-4 text-charcoal">
                {signal.explanation}
              </p>
            </div>
            <span className="shrink-0 text-xs font-black text-[#16A34A]">
              {signal.change}
            </span>
          </article>
        ))}
      </div>
      <Link
        href="/explore"
        className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-ink hover:text-deepOrange"
      >
        View All Signals
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}
