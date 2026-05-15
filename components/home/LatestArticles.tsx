import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  const visibleArticles: LatestArticle[] = articles?.length
    ? articles
    : homepageSeed.latestArticles;

  return (
    <section className="w-full">
      <div className="mb-3 flex flex-col items-center gap-3 border-b border-black pb-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <h2 className="text-[13px] font-black uppercase tracking-[0.18em] text-ink">
          Recent Research
        </h2>
        <Link
          href="/articles"
          className="inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] hover:bg-deepOrange"
        >
          View All
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleArticles.map((article) => (
          <article
            key={article.id}
            className="group mx-auto flex w-full max-w-sm flex-col border border-black bg-white transition hover:-translate-y-0.5 hover:border-deepOrange sm:max-w-none"
          >
            <div className="relative">
              <FallbackVisual
                kind={article.visual ?? visualForSector(article.sector)}
                label={`${article.sector} editorial visual`}
              />
              <HomeSaveButton
                entityName={article.entityName}
                href={article.href}
                itemId={article.id}
                itemType="ARTICLE"
                label={article.headline}
                className="absolute right-2 top-2 h-8 w-8 shadow-none"
                sector={article.sector}
              />
            </div>
            <div className="flex flex-1 flex-col items-center p-4 text-center lg:items-start lg:text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-deepOrange">
                {article.sector}
              </p>
              <h3 className="mt-2 text-lg font-black leading-tight text-ink">
                <Link href={profileHrefFor(article)}>{article.entityName}</Link>
              </h3>
              <p className="mt-2 text-sm font-semibold leading-5 text-charcoal">
                {article.dek}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                {article.tags.slice(0, 3).map((tag) => (
                  <span
                    key={`${article.id}-${tag}`}
                    className="border border-black bg-offWhite px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-auto pt-5 text-[9px] font-black uppercase tracking-[0.14em] text-muted">
                {article.time} · {article.sourceCount ?? 0} sources · {article.confidence ?? "Moderate"} confidence
              </p>
              <div className="mt-3 grid w-full grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                <Link
                  href={profileHrefFor(article)}
                  className="inline-flex min-h-9 items-center justify-center gap-1 border border-black bg-ink px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.12em] text-white hover:bg-deepOrange hover:text-ink"
                >
                  Open Profile
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
                <Link
                  href={dossierHrefFor(article)}
                  className="inline-flex min-h-9 items-center justify-center gap-1 border border-black bg-white px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.12em] hover:bg-paleOrange"
                >
                  Open Dossier
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
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

function profileHrefFor(article: LatestArticle) {
  if (article.profileHref) return article.profileHref;
  if (article.href.startsWith("/article/")) {
    return article.href.replace("/article/", "/startup/");
  }
  return article.href.startsWith("/sector/") ? article.href : "/explore";
}

function dossierHrefFor(article: LatestArticle) {
  if (article.dossierHref) return article.dossierHref;
  if (article.href.startsWith("/article/")) {
    return article.href.replace("/article/", "/dossier/");
  }
  return "/research";
}
