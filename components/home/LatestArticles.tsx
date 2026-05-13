import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FallbackVisual } from "./FallbackVisual";
import { HomeSaveButton } from "./HomeSaveButton";
import { HomeSectionHeader } from "./HomeSectionHeader";
import { HomeTag } from "./HomeTag";
import { homepageSeed } from "@/lib/seed-homepage";

export function LatestArticles() {
  return (
    <section className="w-full border-t border-black bg-offWhite">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <HomeSectionHeader
          eyebrow="Latest Articles"
          title="Fresh public research from the DeepTechly desk"
          dek="Seed editorial coverage across semiconductors, space, robotics, and energy."
          actionHref="/articles"
          actionLabel="Browse All"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {homepageSeed.latestArticles.map((article) => (
            <article
              key={article.id}
              className="group mx-auto flex w-full max-w-md flex-col border border-black bg-white shadow-hard transition hover:-translate-y-0.5 hover:border-deepOrange hover:shadow-hardLg lg:max-w-none"
            >
              <div className="relative">
                <FallbackVisual
                  kind={article.visual}
                  label={`${article.sector} editorial visual`}
                />
                <HomeSaveButton
                  label={article.headline}
                  className="absolute right-3 top-3"
                />
              </div>
              <div className="flex flex-1 flex-col items-center p-5 text-center lg:items-start lg:text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                  {article.sector} · {article.time}
                </p>
                <h3 className="mt-3 text-xl font-black leading-[1.04] text-ink">
                  <Link href={article.href}>{article.headline}</Link>
                </h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-charcoal">
                  {article.dek}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                  {article.tags.map((tag) => (
                    <HomeTag key={tag}>{tag}</HomeTag>
                  ))}
                </div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                  By {article.analyst}
                </p>
                <Link
                  href={article.href}
                  className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 border border-black bg-ink px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.14em] text-white hover:bg-deepOrange hover:text-ink"
                >
                  Read Article
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
