import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { HomeTag } from "./HomeTag";
import { homepageSeed, type GovernmentSignal, type HomepageStory } from "@/lib/seed-homepage";

export function GovernmentSignals({ stories = [] }: { stories?: HomepageStory[] }) {
  const signals = deriveGovernmentSignals(stories);

  return (
    <section className="mx-auto w-full max-w-md bg-white p-4 lg:max-w-none">
      <div className="text-center lg:text-left">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-ink">
          Government Signals
        </p>
      </div>
      <div className="mt-3 divide-y divide-[#D8D0C7]">
        {signals.map((signal) => (
          <article
            key={signal.id}
            className="py-2"
          >
            <div className="grid grid-cols-1 items-start gap-2 text-center sm:grid-cols-[1fr_auto] sm:text-left">
              <div className="min-w-0 flex-1">
                <p className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-deepOrange sm:justify-start">
                  <Landmark size={11} aria-hidden="true" />
                  {signal.agency}
                </p>
                <h4 className="mt-1 text-xs font-black leading-tight text-ink">
                  {signal.signal}
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
              {signal.sectors.map((sector) => (
                <HomeTag key={`${signal.id}-${sector}`}>{sector}</HomeTag>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function deriveGovernmentSignals(stories: HomepageStory[]): GovernmentSignal[] {
  const agencyPattern = /\b(DARPA|NASA|DOE|Navy|Space Force|DoD|Army|Air Force)\b/i;
  const liveSignals = stories
    .filter((story) => agencyPattern.test([story.entityName, story.headline, story.dek, ...story.tags].join(" ")))
    .slice(0, 3)
    .map((story) => {
      const match = [story.entityName, story.headline, ...story.tags].join(" ").match(agencyPattern);
      return {
        id: `live-gov-${story.id}`,
        agency: match?.[0].toUpperCase() ?? "GOVERNMENT",
        signal: story.headline,
        href: story.href,
        sectors: story.tags.slice(0, 2).length ? story.tags.slice(0, 2) : [story.sector.toUpperCase()]
      };
    });

  return [...liveSignals, ...homepageSeed.governmentSignals].slice(0, 5);
}
