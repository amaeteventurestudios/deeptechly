"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Star } from "lucide-react";
import {
  formatByline,
  formatRelativeTime,
  storyFromEntity,
  storyTags,
  type StoryCardData
} from "@/lib/story-metadata";
import type { ResearchEntity } from "@/lib/types";

const favoritesKey = "deeptechly_favorites";
const sectorNav = [
  ["ALL", "/explore"],
  ["SPACE", "/explore?sector=space"],
  ["DEFENSE", "/explore?sector=defense"],
  ["ROBOTICS", "/explore?sector=robotics"],
  ["ENERGY", "/explore?sector=energy"],
  ["SEMICONDUCTORS", "/explore?sector=semiconductors"],
  ["MANUFACTURING", "/explore?sector=manufacturing"],
  ["MATERIALS", "/explore?sector=materials"],
  ["PHOTONICS", "/explore?sector=photonics"],
  ["SENSORS", "/explore?sector=sensors"],
  ["BIOINFRASTRUCTURE", "/explore?sector=bioinfrastructure"]
] as const;

type FavoriteMap = Record<string, true>;

export function HomeResearchFeed({ entities }: { entities: ResearchEntity[] }) {
  const [favorites, setFavorites] = useState<FavoriteMap>({});

  useEffect(() => {
    const readFavorites = () => {
      try {
        const raw = window.localStorage.getItem(favoritesKey);
        setFavorites(raw ? (JSON.parse(raw) as FavoriteMap) : {});
      } catch {
        setFavorites({});
      }
    };

    readFavorites();
    window.addEventListener("storage", readFavorites);
    return () => window.removeEventListener("storage", readFavorites);
  }, []);

  const stories = useMemo(() => {
    const serverStories = entities.map(storyFromEntity);
    const seen = new Set<string>();

    return serverStories
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .filter((story) => {
        if (seen.has(story.slug)) return false;
        seen.add(story.slug);
        return true;
      });
  }, [entities]);

  const topStories = fillStoryList(stories.slice(0, 5), stories, 5);
  const alsoReading = fillStoryList(stories.slice(5, 10), stories, 5);

  function toggleFavorite(slug: string) {
    setFavorites((current) => {
      const next = { ...current };
      if (next[slug]) {
        delete next[slug];
      } else {
        next[slug] = true;
      }
      window.localStorage.setItem(favoritesKey, JSON.stringify(next));
      return next;
    });
  }

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
            <div className="space-y-0 border-t border-black/10">
              {topStories.map((story, index) => (
                <TopStoryRow
                  key={`${story.slug}-${index}`}
                  story={story}
                  rank={index + 1}
                  featured={index === 0}
                  favorited={Boolean(favorites[story.slug])}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>

          <aside className="space-y-8 lg:border-l lg:border-black/20 lg:pl-6">
            <AlsoReading
              stories={alsoReading}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
            <BrowseBySector />
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
            {stories.slice(0, 9).map((story) => (
              <RecentResearchCard
                key={story.slug}
                story={story}
                favorited={Boolean(favorites[story.slug])}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function TopStoryRow({
  story,
  rank,
  featured,
  favorited,
  onToggleFavorite
}: {
  story: StoryCardData;
  rank: number;
  featured: boolean;
  favorited: boolean;
  onToggleFavorite: (slug: string) => void;
}) {
  return (
    <article className="border-b border-black/20 py-5">
      <div className={`grid gap-4 ${featured ? "sm:grid-cols-[48px_4px_1fr_auto]" : "sm:grid-cols-[40px_3px_1fr_auto]"}`}>
        <span className={featured ? "text-4xl font-black text-deepOrange" : "text-3xl font-black text-deepOrange"}>
          {rank}
        </span>
        <span className="hidden bg-deepOrange sm:block" />
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
            {story.entityName} · {formatRelativeTime(story.publishedAt)}
          </p>
          <h3
            className={`mt-2 max-w-2xl font-black leading-tight ${
              featured ? "text-3xl sm:text-4xl" : "text-2xl"
            }`}
          >
            <Link href={story.articleUrl}>{story.title}</Link>
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal">
            {story.dek}
          </p>
          <MetadataTags story={story} />
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-black uppercase tracking-[0.16em]">
            <span className="text-muted">{formatByline(story.authorPersona)}</span>
            <span className="text-black/30">|</span>
            <Link href={story.articleUrl} className="inline-flex items-center gap-1 text-ink">
              Read Article
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
        <FavoriteButton
          slug={story.slug}
          label={story.entityName}
          favorited={favorited}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    </article>
  );
}

function AlsoReading({
  stories,
  favorites,
  onToggleFavorite
}: {
  stories: StoryCardData[];
  favorites: FavoriteMap;
  onToggleFavorite: (slug: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-4 border-b border-black pb-3 text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
        Also Reading
      </h2>
      <div className="space-y-4">
        {stories.map((story, index) => (
          <article
            key={`${story.slug}-also-${index}`}
            className="grid grid-cols-[32px_1fr_auto] gap-3 border-b border-black/15 pb-4"
          >
            <span className="flex h-7 w-7 items-center justify-center border border-black bg-white text-[10px] font-black">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-deepOrange">
                {story.entityName}
              </p>
              <h3 className="mt-1 text-sm font-black leading-tight">
                <Link href={story.articleUrl}>{story.title}</Link>
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {storyTags(story).slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="border border-black bg-offWhite px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[9px] font-black uppercase tracking-[0.14em] text-muted">
                {formatByline(story.authorPersona)} · {formatRelativeTime(story.publishedAt)}
              </p>
            </div>
            <FavoriteButton
              slug={story.slug}
              label={story.entityName}
              favorited={Boolean(favorites[story.slug])}
              onToggleFavorite={onToggleFavorite}
              compact
            />
          </article>
        ))}
      </div>
    </section>
  );
}

function BrowseBySector() {
  return (
    <section>
      <h2 className="mb-4 border-b border-black pb-3 text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
        Browse By Sector
      </h2>
      <div className="flex flex-wrap gap-2">
        {sectorNav.map(([label, href], index) => (
          <Link
            key={label}
            href={href}
            className={`border border-black px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] hover:bg-deepOrange ${
              index === 0 ? "bg-ink text-white" : "bg-white text-ink"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      <Link
        href="/articles"
        className="mt-5 inline-flex w-full items-center justify-between border border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-deepOrange"
      >
        Read More Research
        <ArrowRight size={14} />
      </Link>
    </section>
  );
}

function RecentResearchCard({
  story,
  favorited,
  onToggleFavorite
}: {
  story: StoryCardData;
  favorited: boolean;
  onToggleFavorite: (slug: string) => void;
}) {
  return (
    <article className="relative border border-black bg-white shadow-hard">
      <FavoriteButton
        slug={story.slug}
        label={story.entityName}
        favorited={favorited}
        onToggleFavorite={onToggleFavorite}
        compact
        className="absolute right-3 top-3 z-10 bg-white"
      />
      <Link href={story.profileUrl ?? story.dossierUrl ?? story.articleUrl} className="block">
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
            {story.sectorTags[0] ?? "Research"}
          </p>
          <p className="mt-3 text-sm font-black">
            {story.confidenceLabel ?? "Research"} Signal
          </p>
        </div>
        <div className="p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
            {story.entityName} · {formatRelativeTime(story.publishedAt)}
          </p>
          <h3 className="mt-2 text-xl font-black">{story.entityName}</h3>
          <MetadataTags story={story} compact />
          <p className="mt-2 text-sm leading-6 text-charcoal">{story.summary}</p>
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-muted">
            {formatByline(story.authorPersona)}
          </p>
        </div>
      </Link>
    </article>
  );
}

function MetadataTags({
  story,
  compact = false
}: {
  story: StoryCardData;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-2" : "mt-4"}`}>
      {storyTags(story).map((tag) => (
        <span
          key={tag}
          className="border border-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function FavoriteButton({
  slug,
  label,
  favorited,
  onToggleFavorite,
  compact = false,
  className = ""
}: {
  slug: string;
  label: string;
  favorited: boolean;
  onToggleFavorite: (slug: string) => void;
  compact?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`${favorited ? "Remove" : "Save"} ${label}`}
      aria-pressed={favorited}
      onClick={() => onToggleFavorite(slug)}
      className={`flex shrink-0 items-center justify-center border border-black ${
        compact ? "h-7 w-7" : "h-9 w-9"
      } ${favorited ? "bg-deepOrange text-ink" : "bg-white text-ink"} ${className}`}
    >
      <Star size={compact ? 13 : 16} fill={favorited ? "currentColor" : "none"} />
    </button>
  );
}

function fillStoryList(
  preferredStories: StoryCardData[],
  fallbackStories: StoryCardData[],
  targetLength: number
) {
  if (preferredStories.length >= targetLength || fallbackStories.length === 0) {
    return preferredStories.slice(0, targetLength);
  }

  const filled = [...preferredStories];
  let index = 0;
  while (filled.length < targetLength && index < targetLength * 3) {
    filled.push(fallbackStories[index % fallbackStories.length]);
    index += 1;
  }

  return filled.slice(0, targetLength);
}
