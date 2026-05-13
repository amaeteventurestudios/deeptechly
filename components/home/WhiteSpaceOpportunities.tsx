import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { homepageSeed } from "@/lib/seed-homepage";

export function WhiteSpaceOpportunities() {
  return (
    <section className="mx-auto w-full max-w-md bg-white p-4 lg:max-w-none">
      <div className="text-center lg:text-left">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-ink">
          White-Space Opportunities
        </p>
      </div>
      <div className="mt-3 divide-y divide-[#D8D0C7]">
        {homepageSeed.whiteSpaceOpportunities.map((opportunity) => (
          <article
            key={opportunity.id}
            className="grid grid-cols-1 items-center gap-2 py-2 text-center sm:grid-cols-[1fr_auto] sm:text-left"
          >
            <h4 className="text-xs font-black leading-tight text-ink">
              {opportunity.title}
            </h4>
            <Link
              href={opportunity.href}
              className="inline-flex min-h-8 items-center justify-center gap-1 text-center text-[9px] font-black uppercase tracking-[0.12em] hover:text-deepOrange"
            >
              Why It Matters
              <ArrowRight size={11} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
      <Link
        href="/explore"
        className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-ink hover:text-deepOrange"
      >
        View All Opportunities
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </section>
  );
}
