"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FallbackVisual } from "./FallbackVisual";
import { HomeSaveButton } from "./HomeSaveButton";
import {
  homepageSeed,
  type HomepageStory,
  type HomepageVisualKind
} from "@/lib/seed-homepage";

type LatestArticle = HomepageStory & {
  visual?: HomepageVisualKind;
};

export function LatestArticles({ articles }: { articles?: LatestArticle[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const visibleArticles: LatestArticle[] = articles?.length
    ? articles
    : homepageSeed.latestArticles;

  const scrollRail = (direction: "left" | "right") => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction === "left" ? -rail.clientWidth * 0.8 : rail.clientWidth * 0.8,
      behavior: "smooth"
    });
  };

  return (
    <section className="min-w-0 lg:pr-8">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between border-b border-black pb-3">
        <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-ink">
          Latest Articles
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" aria-label="Latest articles scroll controls">
            <button
              type="button"
              aria-label="Scroll latest articles left"
              onClick={() => scrollRail("left")}
              className="inline-flex h-8 w-8 items-center justify-center border border-black bg-white text-ink hover:bg-deepOrange focus:outline-none focus:ring-2 focus:ring-deepOrange focus:ring-offset-1"
            >
              <ArrowLeft size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Scroll latest articles right"
              onClick={() => scrollRail("right")}
              className="inline-flex h-8 w-8 items-center justify-center border border-black bg-white text-ink hover:bg-deepOrange focus:outline-none focus:ring-2 focus:ring-deepOrange focus:ring-offset-1"
            >
              <ArrowRight size={12} aria-hidden="true" />
            </button>
          </div>
          <Link
            href="/articles"
            className="inline-flex h-8 items-center justify-center gap-1.5 border border-black bg-white px-3 text-[9px] font-black uppercase tracking-[0.16em] hover:bg-deepOrange"
          >
            View All
            <ArrowRight size={10} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Scrollable rail */}
      <div
        ref={railRef}
        aria-label="Latest articles"
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visibleArticles.map((article) => (
          <article
            key={article.id}
            className="group flex w-[252px] shrink-0 snap-start flex-col border border-black bg-white transition hover:-translate-y-0.5 hover:border-deepOrange min-[390px]:w-[268px] sm:w-[275px] lg:w-[258px] xl:w-[272px]"
          >
            {/* Visual */}
            <div className="relative shrink-0">
              <ArticleVisual article={article} />
              <HomeSaveButton
                entityName={article.entityName}
                href={article.href}
                itemId={article.id}
                itemType="ARTICLE"
                label={article.headline}
                className="absolute right-1.5 top-1.5 h-7 w-7 shadow-none"
                sector={article.sector}
              />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col p-3 text-left">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-deepOrange">
                {article.sector}
              </p>
              <h3 className="mt-1.5 text-[13px] font-black leading-[1.18] text-ink line-clamp-3">
                <Link href={article.href}>{article.headline}</Link>
              </h3>
              <p className="mt-1.5 text-[11px] font-semibold leading-[1.5] text-charcoal line-clamp-2">
                {article.dek}
              </p>

              {/* Tags */}
              <div className="mt-2 flex flex-wrap gap-1">
                {article.tags.slice(0, 2).map((tag) => (
                  <span
                    key={`${article.id}-${tag}`}
                    className="border border-black/25 bg-offWhite px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.12em] text-charcoal"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Meta */}
              <p className="mt-auto pt-3 text-[8px] font-black uppercase tracking-[0.12em] text-muted">
                {article.analyst} · {article.time} · {article.sourceCount ?? 0} src
              </p>

              {/* CTAs */}
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <Link
                  href={article.href}
                  className="inline-flex h-8 items-center justify-center gap-1 border border-black bg-ink px-2 text-[8px] font-black uppercase tracking-[0.12em] text-white hover:bg-deepOrange hover:text-ink"
                >
                  Read
                  <ArrowRight size={10} aria-hidden="true" />
                </Link>
                <Link
                  href={dossierHrefFor(article)}
                  className="inline-flex h-8 items-center justify-center gap-1 border border-black bg-white px-2 text-[8px] font-black uppercase tracking-[0.12em] hover:bg-paleOrange"
                >
                  Dossier
                  <ArrowRight size={10} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ArticleVisual({ article }: { article: LatestArticle }) {
  if (article.heroImage) {
    return (
      <div
        aria-label={`${article.entityName} article visual`}
        className="h-28 border-b border-black bg-cover bg-center bg-no-repeat"
        role="img"
        style={{ backgroundImage: `url(${article.heroImage})` }}
      />
    );
  }

  return (
    <div className="h-28 overflow-hidden border-b border-black">
      <FallbackVisual
        kind={article.visual ?? visualForSector(article.sector)}
        label={`${article.sector} editorial visual`}
      />
    </div>
  );
}

function visualForSector(sector: string): HomepageVisualKind {
  const normalized = sector.toLowerCase();
  if (normalized.includes("space")) return "orbit";
  if (normalized.includes("robot") || normalized.includes("autonomy")) return "robotics";
  if (normalized.includes("energy") || normalized.includes("climate")) return "energy";
  if (normalized.includes("material") || normalized.includes("manufacturing")) {
    return "materials";
  }
  if (normalized.includes("sensor") || normalized.includes("bio")) return "sensing";
  return "chip";
}

function dossierHrefFor(article: LatestArticle) {
  if (article.dossierHref) return article.dossierHref;
  if (article.href.startsWith("/article/")) {
    return article.href.replace("/article/", "/dossier/");
  }
  return "/research";
}
