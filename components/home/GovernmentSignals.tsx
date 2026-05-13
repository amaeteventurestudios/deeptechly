import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { HomeTag } from "./HomeTag";
import { homepageSeed } from "@/lib/seed-homepage";

export function GovernmentSignals() {
  return (
    <section className="mx-auto w-full max-w-md border border-black bg-white p-5 shadow-hard lg:max-w-none">
      <div className="text-center lg:text-left">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-deepOrange">
          Government Signals
        </p>
        <h3 className="mt-2 text-2xl font-black leading-tight text-ink">
          Public program movement
        </h3>
      </div>
      <div className="mt-5 space-y-4">
        {homepageSeed.governmentSignals.map((signal) => (
          <article
            key={signal.id}
            className="border-b border-[#D8D0C7] pb-4 last:border-b-0"
          >
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-black bg-paleOrange">
                <Landmark size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                  {signal.agency}
                </p>
                <h4 className="mt-1 text-sm font-black leading-tight text-ink">
                  {signal.signal}
                </h4>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
              {signal.sectors.map((sector) => (
                <HomeTag key={`${signal.id}-${sector}`}>{sector}</HomeTag>
              ))}
            </div>
            <Link
              href={signal.href}
              className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_#0f0f0f] hover:bg-deepOrange"
            >
              View Signal
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
