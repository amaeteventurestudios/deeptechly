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
    <section className="min-w-0">
      <div className="mb-4 flex flex-col items-center gap-3 border-b border-black pb-3 text-center md:flex-row md:items-end md:justify-between md:text-left">
        <h2 className="text-[13px] font-black uppercase tracking-[0.18em] text-ink">
          Latest Articles
        </h2>
        <Link
          href="/articles"
          className="inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] shadow-[2px_2px_0_#0f0f0f] hover:bg-deepOrange md:min-h-9"
        >
          View All
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      <div
        aria-label="Latest articles"
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visibleArticles.map((article) => (
          <article
            key={article.id}
            className="group flex min-h-[520px] w-[280px] shrink-0 snap-center flex-col border border-black bg-white shadow-[3px_3px_0_#0f0f0f] transition hover:-translate-y-0.5 hover:border-deepOrange min-[390px]:w-[320px] sm:w-[330px] lg:w-[300px] xl:w-[320px]"
          >
            <div className="relative">
              <ArticleVisual article={article} />
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
            <div className="flex flex-1 flex-col p-4 text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-deepOrange">
                {article.sector}
              </p>
              <h3 className="mt-2 text-lg font-black leading-tight text-ink">
                <Link href={article.href}>{article.headline}</Link>
              </h3>
              <p className="mt-2 text-sm font-semibold leading-5 text-charcoal">
                {article.dek}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
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
                {article.analyst} · {article.time} · {article.sourceCount ?? 0} sources
              </p>
              <div className="mt-3 grid w-full grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                <Link
                  href={article.href}
                  className="inline-flex min-h-9 items-center justify-center gap-1 border border-black bg-ink px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.12em] text-white hover:bg-deepOrange hover:text-ink"
                >
                  Read Article
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
              <Link
                href={profileHrefFor(article)}
                className="mt-2 inline-flex min-h-8 items-center justify-center gap-1 border border-black bg-offWhite px-2 py-1.5 text-center text-[9px] font-black uppercase tracking-[0.12em] hover:bg-paleOrange"
              >
                Open Profile
                <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-1 text-center text-[9px] font-black uppercase tracking-[0.14em] text-muted md:text-left">
        Scroll horizontally &rarr;
      </p>
    </section>
  );
}

function ArticleVisual({ article }: { article: LatestArticle }) {
  if (article.heroImage) {
    return (
      <div
        aria-label={`${article.entityName} article visual`}
        className="h-44 border-b border-black bg-cover bg-center bg-no-repeat"
        role="img"
        style={{ backgroundImage: `url(${article.heroImage})` }}
      />
    );
  }

  return (
    <FallbackVisual
      kind={article.visual ?? visualForSector(article.sector)}
      label={`${article.sector} editorial visual`}
    />
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
