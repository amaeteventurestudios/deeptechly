import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { getPublishedEntities } from "@/lib/research/public-data";
import {
  formatByline,
  formatRelativeTime,
  storyFromEntity,
  storyTags
} from "@/lib/story-metadata";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const entities = await getPublishedEntities();
  const stories = entities.map(storyFromEntity);

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Articles
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            DeepTechly research articles.
          </h1>
        </div>
      </section>
      <section className="w-full bg-paper">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="space-y-5">
            {stories.map((story, index) => (
              <article key={story.slug} className="border border-black bg-white p-5 shadow-hard">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                  {String(index + 1).padStart(2, "0")} · {story.entityName} ·{" "}
                  {formatRelativeTime(story.publishedAt)}
                </p>
                <h2 className="mt-2 text-2xl font-black leading-tight">
                  {story.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-charcoal">
                  {story.dek}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {storyTags(story).map((tag) => (
                    <span
                      key={tag}
                      className="border border-black bg-offWhite px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
                  {formatByline(story.authorPersona)}
                </p>
                <Link
                  href={story.articleUrl}
                  className="mt-4 inline-flex items-center gap-2 border border-black bg-deepOrange px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
                >
                  Read Article
                  <ArrowRight size={13} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
