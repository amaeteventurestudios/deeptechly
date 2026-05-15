import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeTag } from "./HomeTag";
import { homepageSeed, type HomepageStory, type WhiteSpaceOpportunity } from "@/lib/seed-homepage";

export function WhiteSpaceOpportunities({ stories = [] }: { stories?: HomepageStory[] }) {
  const opportunities = deriveOpportunities(stories);

  return (
    <section className="mx-auto w-full max-w-md bg-white p-4 lg:max-w-none">
      <div className="text-center lg:text-left">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-ink">
          White-Space Opportunities
        </p>
      </div>
      <div className="mt-3 divide-y divide-[#D8D0C7]">
        {opportunities.map((opportunity) => (
          <article
            key={opportunity.id}
            className="py-2 text-center sm:text-left"
          >
            <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto]">
              <h4 className="text-xs font-black leading-tight text-ink">
                {opportunity.title}
              </h4>
              <Link
                href={opportunity.href}
                className="inline-flex min-h-8 items-center justify-center gap-1 text-center text-[9px] font-black uppercase tracking-[0.12em] hover:text-deepOrange"
              >
                Related Research
                <ArrowRight size={11} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 sm:justify-start">
              {opportunity.tags.slice(0, 2).map((tag) => (
                <HomeTag key={`${opportunity.id}-${tag}`}>{tag}</HomeTag>
              ))}
            </div>
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

function deriveOpportunities(stories: HomepageStory[]): WhiteSpaceOpportunity[] {
  const live = stories.slice(0, 3).map((story) => ({
    id: `live-opportunity-${story.id}`,
    title: `${story.sector} validation gap: ${story.entityName}`,
    href: story.dossierHref ?? story.href,
    tags: [story.sector.toUpperCase(), `${story.confidence ?? "Moderate"} CONFIDENCE`]
  }));

  return [...live, ...homepageSeed.whiteSpaceOpportunities].slice(0, 6);
}
