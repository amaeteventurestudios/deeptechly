"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Star } from "lucide-react";
import { loadLocalQueueJobs, sortQueueJobs } from "@/components/research/queueStorage";
import type { ResearchJob } from "@/lib/research/types";
import type { ResearchEntity } from "@/lib/types";

type HomeStory = {
  slug: string;
  entityName: string;
  headline: string;
  dek: string;
  summary: string;
  sector: string;
  confidenceLabel: string;
  sourceCount: number;
  heroImage: string | null;
  articleUrl: string;
  profileUrl: string;
  publishedAt: string;
  isGenerated: boolean;
};

export function HomeResearchFeed({ entities }: { entities: ResearchEntity[] }) {
  const [localJobs, setLocalJobs] = useState<ResearchJob[]>(() =>
    sortQueueJobs(loadLocalQueueJobs())
  );

  useEffect(() => {
    const refreshLocalJobs = () => setLocalJobs(sortQueueJobs(loadLocalQueueJobs()));
    window.addEventListener("storage", refreshLocalJobs);
    window.addEventListener("deeptechly-research-queue-updated", refreshLocalJobs);
    refreshLocalJobs();

    return () => {
      window.removeEventListener("storage", refreshLocalJobs);
      window.removeEventListener("deeptechly-research-queue-updated", refreshLocalJobs);
    };
  }, []);

  const stories = useMemo(() => {
    const localStories = localJobs
      .filter((job) => job.stage === "done" && (job.feed || job.articleUrl || job.profileUrl))
      .map(jobToStory)
      .filter((story): story is HomeStory => Boolean(story));
    const serverStories = entities.map(entityToStory);
    const seen = new Set<string>();

    return [...localStories, ...serverStories]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .filter((story) => {
        if (seen.has(story.slug)) return false;
        seen.add(story.slug);
        return true;
      });
  }, [entities, localJobs]);

  const alsoReading = stories.slice(1);

  return (
    <>
      <section className="w-full bg-paper">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-black pb-3">
              <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
                Top Stories
              </h2>
              <Link
                href="/articles"
                className="text-[10px] font-black uppercase tracking-[0.16em]"
              >
                Browse All
              </Link>
            </div>
            <div className="space-y-5">
              {stories.map((story, index) => (
                <article key={story.slug} className="border-b border-black/20 pb-5">
                  <div className="grid gap-4 sm:grid-cols-[40px_1fr_auto]">
                    <span className="text-3xl font-black text-deepOrange">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted">
                        {story.sector} · {story.confidenceLabel} confidence
                        {story.isGenerated ? " · generated" : ""}
                      </p>
                      <h3 className="mt-2 max-w-2xl text-2xl font-black leading-tight">
                        <Link href={story.articleUrl}>{story.headline}</Link>
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal">
                        {story.dek}
                      </p>
                    </div>
                    <Link
                      href={story.articleUrl}
                      className="inline-flex h-10 w-10 items-center justify-center border border-black bg-white shadow-hard"
                      aria-label={`Read article about ${story.entityName}`}
                    >
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="lg:border-l lg:border-black/20 lg:pl-6">
            <h2 className="mb-4 border-b border-black pb-3 text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
              Also Reading
            </h2>
            <div className="space-y-4">
              {alsoReading.map((story) => (
                <Link
                  href={story.articleUrl}
                  key={story.slug}
                  className="block border border-black bg-white p-4 shadow-hard hover:bg-paleOrange"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                      {story.sector}
                    </span>
                    <Star size={14} />
                  </div>
                  <h3 className="text-base font-black leading-tight">
                    {story.entityName}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-charcoal">
                    {story.summary}
                  </p>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="w-full border-y border-black bg-offWhite">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between border-b border-black pb-3">
            <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
              Recent Research
            </h2>
            <Link href="/explore" className="text-[10px] font-black uppercase tracking-[0.16em]">
              Browse All
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <Link
                href={story.profileUrl}
                key={story.slug}
                className="block border border-black bg-white shadow-hard"
              >
                <div
                  className="h-28 border-b border-black bg-ink bg-cover bg-center p-4 text-white"
                  style={
                    story.heroImage
                      ? {
                          backgroundImage: `linear-gradient(rgba(14,14,14,.72), rgba(14,14,14,.72)), url(${story.heroImage})`
                        }
                      : undefined
                  }
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
                    Research
                  </p>
                  <p className="mt-3 text-sm font-black">
                    {story.confidenceLabel} Signal
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                    {story.sector}
                  </p>
                  <h3 className="mt-2 text-xl font-black">{story.entityName}</h3>
                  <p className="mt-2 text-sm leading-6 text-charcoal">
                    {story.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function entityToStory(entity: ResearchEntity): HomeStory {
  return {
    slug: entity.slug,
    entityName: entity.name,
    headline: entity.article.headline,
    dek: entity.article.dek,
    summary: entity.summary,
    sector: entity.sector,
    confidenceLabel: entity.confidenceLabel,
    sourceCount: entity.sourceCount,
    heroImage: entity.heroImage ?? entity.article.heroImage ?? null,
    articleUrl: `/article/${entity.slug}`,
    profileUrl: `/startup/${entity.slug}`,
    publishedAt: entity.article.publishedAt ?? entity.updatedAt ?? entity.createdAt ?? "",
    isGenerated: entity.stage === "Generated research"
  };
}

function jobToStory(job: ResearchJob): HomeStory | null {
  const slug = job.feed?.slug ?? slugFromUrl(job.profileUrl ?? job.articleUrl);
  if (!slug) return null;

  return {
    slug,
    entityName: job.feed?.entityName ?? job.query,
    headline: job.feed?.articleTitle ?? `${job.query} research profile is ready`,
    dek:
      job.feed?.articleDek ??
      "DeepTechly generated a public article, profile, and investor dossier from the completed research job.",
    summary: job.feed?.summary ?? "Generated DeepTechly research profile.",
    sector: job.feed?.sector ?? "Deep Tech",
    confidenceLabel: job.feed?.confidenceLabel ?? "Generated",
    sourceCount: job.feed?.sourceCount ?? job.sourceCount,
    heroImage: job.feed?.heroImage ?? null,
    articleUrl: job.articleUrl ?? `/article/${slug}`,
    profileUrl: job.profileUrl ?? job.dossierUrl ?? `/startup/${slug}`,
    publishedAt: job.feed?.publishedAt ?? job.completedAt ?? job.updatedAt,
    isGenerated: true
  };
}

function slugFromUrl(url: string | null) {
  if (!url) return null;
  return url.split("/").filter(Boolean).at(-1) ?? null;
}
