import Link from "next/link";
import { ArrowRight, Crosshair } from "lucide-react";
import { HomeTag } from "./HomeTag";
import { homepageSeed } from "@/lib/seed-homepage";

export function WhiteSpaceOpportunities() {
  return (
    <section className="mx-auto w-full max-w-md border border-black bg-white p-5 shadow-hard lg:max-w-none">
      <div className="text-center lg:text-left">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-deepOrange">
          White-Space Opportunities
        </p>
        <h3 className="mt-2 text-2xl font-black leading-tight text-ink">
          Undercovered zones
        </h3>
      </div>
      <div className="mt-5 divide-y divide-[#D8D0C7]">
        {homepageSeed.whiteSpaceOpportunities.map((opportunity) => (
          <article
            key={opportunity.id}
            className="flex flex-col items-center gap-3 py-4 text-center"
          >
            <span className="flex h-9 w-9 items-center justify-center border border-black bg-paleOrange">
              <Crosshair size={16} aria-hidden="true" />
            </span>
            <h4 className="text-base font-black leading-tight text-ink">
              {opportunity.title}
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {opportunity.tags.map((tag) => (
                <HomeTag key={`${opportunity.id}-${tag}`}>{tag}</HomeTag>
              ))}
            </div>
            <Link
              href={opportunity.href}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] shadow-[3px_3px_0_#0f0f0f] hover:bg-deepOrange"
            >
              Why It Matters
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
