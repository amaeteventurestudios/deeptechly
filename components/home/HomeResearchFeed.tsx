import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GovernmentSignals } from "./GovernmentSignals";
import { HomeSaveButton } from "./HomeSaveButton";
import { HomeTag } from "./HomeTag";
import { LatestArticles } from "./LatestArticles";
import { MyResearch } from "./MyResearch";
import { PatentIntelligence } from "./PatentIntelligence";
import { ResearchNewsstand } from "./ResearchNewsstand";
import { TechnologySignals } from "./TechnologySignals";
import { WhiteSpaceOpportunities } from "./WhiteSpaceOpportunities";
import { homepageSeed, type HomepageStory } from "@/lib/seed-homepage";

export function HomeResearchFeed() {
  return (
    <>
      <section className="w-full bg-paper">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 text-center sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)] lg:px-8 lg:text-left">
          <div className="mx-auto w-full max-w-3xl lg:max-w-none">
            <CompactSectionHeader
              title="Top Stories"
              actionHref="/articles"
              actionLabel="Browse All"
            />
            <div className="border-t border-black/10">
              {homepageSeed.topStories.slice(0, 4).map((story, index) => (
                <TopStoryRow
                  key={story.id}
                  story={story}
                  rank={index + 1}
                  featured={index === 0}
                />
              ))}
            </div>
          </div>

          <aside className="mx-auto w-full max-w-md space-y-8 lg:max-w-none lg:border-l lg:border-black/20 lg:pl-6">
            <AlsoReading stories={homepageSeed.alsoReading} />
          </aside>
        </div>
      </section>

      <section className="w-full border-t border-black bg-offWhite">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:px-8">
          <LatestArticles />
          <MyResearch />
        </div>
      </section>

      <section className="w-full border-t border-black bg-paper">
        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-px border border-black bg-black md:grid-cols-2 xl:grid-cols-4">
            <TechnologySignals />
            <GovernmentSignals />
            <PatentIntelligence />
            <WhiteSpaceOpportunities />
          </div>
        </div>
      </section>

      <ResearchNewsstand />
      <BrowseBySector />
    </>
  );
}

function TopStoryRow({
  story,
  rank,
  featured
}: {
  story: HomepageStory;
  rank: number;
  featured: boolean;
}) {
  return (
    <article className="border-b border-black/20 py-6">
      <div
        className={`grid gap-4 ${
          featured ? "lg:grid-cols-[64px_4px_1fr_40px]" : "lg:grid-cols-[56px_3px_1fr_40px]"
        }`}
      >
        <span
          className={`mx-auto flex items-start justify-center font-black leading-none text-deepOrange lg:mx-0 ${
            featured ? "text-5xl lg:text-6xl" : "text-4xl lg:text-5xl"
          }`}
        >
          {rank}
        </span>
        <span className="hidden bg-deepOrange lg:block" />
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
            {story.entityName} · {story.time}
          </p>
          <h3
            className={`mx-auto mt-2 max-w-3xl font-black leading-[1.02] text-ink lg:mx-0 ${
              featured ? "text-3xl sm:text-4xl lg:text-[42px]" : "text-2xl lg:text-[27px]"
            }`}
          >
            <Link href={story.href}>{story.headline}</Link>
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-charcoal lg:mx-0">
            {story.dek}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
            {story.tags.map((tag) => (
              <HomeTag key={`${story.id}-${tag}`}>{tag}</HomeTag>
            ))}
          </div>
          <div className="mt-4 flex flex-col items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] sm:flex-row lg:justify-start">
            <span className="text-muted">By {story.analyst}</span>
            <span className="hidden text-black/30 sm:inline">|</span>
            <Link
              href={story.href}
              className="inline-flex min-h-11 items-center justify-center gap-1 border border-black bg-white px-3 py-2 text-ink shadow-[3px_3px_0_#0f0f0f] hover:bg-deepOrange"
            >
              Read Article
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="flex justify-center lg:block">
          <HomeSaveButton
            entityName={story.entityName}
            href={story.href}
            itemId={story.id}
            itemType="ARTICLE"
            label={story.headline}
            sector={story.sector}
          />
        </div>
      </div>
    </article>
  );
}

function AlsoReading({ stories }: { stories: HomepageStory[] }) {
  return (
    <section>
      <CompactSectionHeader title="Also Reading" />
      <div className="divide-y divide-black/20 border-t border-black/10">
        {stories.map((story, index) => (
          <article
            key={story.id}
            className="py-4 text-center lg:text-left"
          >
            <div className="flex flex-col items-center gap-3 lg:flex-row lg:items-start">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-black bg-white text-[10px] font-black">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-deepOrange">
                  {story.entityName}
                </p>
                <h3 className="mt-1 text-base font-black leading-tight">
                  <Link href={story.href}>{story.headline}</Link>
                </h3>
                <p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-muted">
                  {story.analyst} · {story.time}
                </p>
              </div>
              <HomeSaveButton
                entityName={story.entityName}
                href={story.href}
                itemId={story.id}
                itemType="ARTICLE"
                label={story.headline}
                sector={story.sector}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function BrowseBySector() {
  return (
    <section className="w-full border-t border-black bg-offWhite">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 text-center sm:px-6 lg:px-8">
        <CompactSectionHeader
          title="Browse by Sector"
          actionHref="/sectors"
          actionLabel="View All Sectors"
        />
        <div className="mx-auto flex flex-wrap items-center justify-center gap-2">
          {homepageSeed.sectors.map((sector, index) => (
            <Link
              key={sector.label}
              href={sector.href}
              className={`inline-flex min-h-11 max-w-full items-center justify-center border border-black px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] hover:bg-deepOrange ${
                index === 0 ? "bg-ink text-white" : "bg-white text-ink"
              }`}
            >
              {sector.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CompactSectionHeader({
  title,
  actionHref,
  actionLabel
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-3 flex flex-col items-center gap-3 border-b border-black pb-2 text-center sm:flex-row sm:justify-between sm:text-left">
      <h2 className="text-[13px] font-black uppercase tracking-[0.18em] text-ink">
        {title}
      </h2>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] hover:bg-deepOrange"
        >
          {actionLabel}
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
