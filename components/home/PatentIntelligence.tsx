import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { HomeTag } from "./HomeTag";
import { homepageSeed } from "@/lib/seed-homepage";

export function PatentIntelligence() {
  return (
    <section className="mx-auto w-full max-w-md bg-white p-4 lg:max-w-none">
      <div className="text-center lg:text-left">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-ink">
          Patent Intelligence
        </p>
      </div>
      <div className="mt-3 divide-y divide-[#D8D0C7]">
        {homepageSeed.patentSignals.map((signal) => (
          <article
            key={signal.id}
            className="py-2 text-center lg:text-left"
          >
            <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_auto] sm:text-left">
              <div className="min-w-0 flex-1">
                <p className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-deepOrange sm:justify-start">
                  <FileText size={11} aria-hidden="true" />
                  {signal.source}
                </p>
                <h4 className="mt-1 text-xs font-black leading-tight text-ink">
                  {signal.title}
                </h4>
              </div>
              <Link
                href={signal.href}
                className="inline-flex min-h-8 items-center justify-center gap-1 text-center text-[9px] font-black uppercase tracking-[0.12em] hover:text-deepOrange"
              >
                View Signal
                <ArrowRight size={11} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 lg:justify-start">
              {signal.labels.map((label) => (
                <HomeTag key={`${signal.id}-${label}`}>{label}</HomeTag>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
