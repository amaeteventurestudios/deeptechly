import Link from "next/link";
import { ArrowRight, Minus, TrendingUp } from "lucide-react";
import { homepageSeed, type HomepageStory, type TechnologySignal } from "@/lib/seed-homepage";

export function TechnologySignals({ stories = [] }: { stories?: HomepageStory[] }) {
  const signals = deriveTechnologySignals(stories);

  return (
    <section className="mx-auto w-full max-w-md bg-white p-4 lg:max-w-none">
      <div className="text-center lg:text-left">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-ink">
          Technology Signals
        </p>
      </div>
      <div className="mt-3 divide-y divide-[#D8D0C7]">
        {signals.map((signal) => (
          <article
            key={signal.id}
            className="grid grid-cols-1 items-center gap-2 py-2 text-center sm:grid-cols-[1fr_auto] sm:text-left"
          >
            <div className="min-w-0 flex-1">
              <h4 className="flex items-center justify-center gap-2 text-xs font-black leading-tight text-ink sm:justify-start">
                {signal.change === "Editorial watch" ? (
                  <Minus size={12} className="text-deepOrange" aria-hidden="true" />
                ) : (
                  <TrendingUp size={12} className="text-deepOrange" aria-hidden="true" />
                )}
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

function deriveTechnologySignals(stories: HomepageStory[]): TechnologySignal[] {
  const counts = new Map<string, number>();
  for (const story of stories) {
    const sector = story.sector || story.tags[0];
    if (!sector) continue;
    counts.set(sector, (counts.get(sector) ?? 0) + 1);
  }

  const liveSignals = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([sector, count]) => ({
      id: `live-${sector.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: `${sector} activity`,
      explanation: `${count} published DeepTechly ${count === 1 ? "story" : "stories"} currently support this editorial signal.`,
      change: "Live coverage"
    }));

  if (liveSignals.length >= 3) {
    return liveSignals;
  }

  return [
    ...liveSignals,
    ...homepageSeed.technologySignals
      .filter((signal) => !liveSignals.some((item) => item.name === signal.name))
      .map((signal) => ({ ...signal, change: "Editorial watch" }))
  ].slice(0, 6);
}
