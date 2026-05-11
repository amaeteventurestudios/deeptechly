import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { SectorNav } from "@/components/layout/SectorNav";
import { getPublishedEntities } from "@/lib/research/public-data";
import {
  formatByline,
  formatRelativeTime,
  storyFromEntity,
  storyTags
} from "@/lib/story-metadata";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "News | DeepTechly",
  description: "Deep-tech research articles from DeepTechly — space, defense, robotics, energy, semiconductors, and emerging infrastructure."
};

export default async function NewsPage() {
  const entities = await getPublishedEntities();
  const stories = entities.map(storyFromEntity);

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            News &amp; Research
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            DeepTechly research archive.
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-ink/82">
            Institutional-grade articles on deep-tech companies, patents,
            labs, and government programs.
          </p>
        </div>
      </section>

      <SectorNav />

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          {stories.length === 0 ? (
            <div className="border border-black bg-white p-8 text-center shadow-hard">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-deepOrange">
                Archive
              </p>
              <p className="mt-3 text-sm font-bold leading-6 text-charcoal">
                No published research yet. Submit an entity on the homepage to
                queue research.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex items-center gap-2 border border-black bg-deepOrange px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
              >
                Queue Research
                <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {stories.map((story, index) => (
                <article
                  key={story.slug}
                  className="border border-black bg-white p-5 shadow-hard"
                >
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
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={story.articleUrl}
                      className="inline-flex items-center gap-2 border border-black bg-deepOrange px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
                    >
                      Read Article
                      <ArrowRight size={13} />
                    </Link>
                    {story.profileUrl && story.profileUrl !== story.articleUrl ? (
                      <Link
                        href={story.profileUrl}
                        className="inline-flex items-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
                      >
                        Open Profile
                        <ArrowRight size={13} />
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
