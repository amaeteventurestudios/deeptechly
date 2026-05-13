import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FallbackVisual } from "./FallbackVisual";
import { HomeSaveButton } from "./HomeSaveButton";
import { homepageSeed } from "@/lib/seed-homepage";

export function LatestArticles() {
  return (
    <section className="w-full">
      <div className="mb-3 flex flex-col items-center gap-3 border-b border-black pb-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <h2 className="text-[13px] font-black uppercase tracking-[0.18em] text-ink">
          Latest Articles
        </h2>
        <Link
          href="/articles"
          className="inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] hover:bg-deepOrange"
        >
          View All
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {homepageSeed.latestArticles.map((article) => (
          <article
            key={article.id}
            className="group mx-auto flex w-full max-w-sm flex-col border border-black bg-white transition hover:-translate-y-0.5 hover:border-deepOrange sm:max-w-none"
          >
            <div className="relative">
              <FallbackVisual
                kind={article.visual}
                label={`${article.sector} editorial visual`}
              />
              <HomeSaveButton
                label={article.headline}
                className="absolute right-2 top-2 h-8 w-8 shadow-none"
              />
            </div>
            <div className="flex flex-1 flex-col items-center p-4 text-center lg:items-start lg:text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-deepOrange">
                {article.sector}
              </p>
              <h3 className="mt-2 text-base font-black leading-tight text-ink">
                <Link href={article.href}>{article.headline}</Link>
              </h3>
              <p className="mt-auto pt-5 text-[9px] font-black uppercase tracking-[0.14em] text-muted">
                By {article.analyst} · {article.time}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
