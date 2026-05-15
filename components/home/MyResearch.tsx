import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAuthSession } from "@/lib/auth/session";
import { listResearchJobs } from "@/lib/research/store";
import { formatRelativeTime } from "@/lib/story-metadata";
import { listSavedResearchItems, type SavedResearchItem } from "@/lib/saved-research";

export async function MyResearch() {
  const session = await getAuthSession();

  if (!session) {
    return (
      <section className="w-full">
        <SectionHeader />
        <div className="border border-black bg-white p-5 text-center shadow-[5px_5px_0_#0f0f0f] lg:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
            Research Account
          </p>
          <h3 className="mt-2 text-2xl font-black leading-tight text-ink">
            Build a private research shelf.
          </h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-charcoal">
            Sign in to save public research, track queued investigations, and return to profiles, articles, and dossiers from one institutional workspace.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:justify-start">
            <Link
              href="/join"
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-deepOrange px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] hover:bg-darkOrange"
            >
              Create Account
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] hover:bg-paleOrange"
            >
              Sign In
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const [savedResearch, jobs] = await Promise.all([
    listSavedResearchItems(session.userId, 4),
    listResearchJobs(session.userId)
  ]);
  const savedCards = savedResearch.items.slice(0, 4).map(savedItemToCard);
  const jobCards = jobs.slice(0, 4).map((job) => ({
    id: `job-${job.createdAt}-${job.query}`,
    entityName: job.feed?.entityName ?? job.resolvedName ?? job.query,
    sector: job.feed?.sector ?? job.mode.toUpperCase(),
    status: job.statusLabel,
    updated: `Updated ${formatRelativeTime(job.updatedAt)}`,
    confidence: job.feed?.confidenceLabel ?? "Pending",
    profileHref: job.profileUrl ?? "/research",
    articleHref: job.articleUrl,
    dossierHref: job.dossierUrl
  }));
  const cards = [...jobCards, ...savedCards].slice(0, 4);

  return (
    <section className="w-full">
      <SectionHeader />

      {cards.length === 0 ? (
        <div className="border border-black bg-white p-5 text-center lg:text-left">
          <h3 className="text-xl font-black leading-tight text-ink">
            No saved or queued research yet.
          </h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-charcoal">
            Use the homepage research form or star controls to start building your private queue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {cards.map((item) => (
            <article
              key={item.id}
              className="mx-auto flex w-full max-w-sm flex-col items-center border border-black bg-white p-3 text-center transition hover:-translate-y-0.5 hover:border-deepOrange sm:max-w-none lg:items-start lg:text-left"
            >
              <div className="flex w-full items-start justify-between gap-3">
                <div className="min-w-0 text-left">
                  <h3 className="text-base font-black leading-tight text-ink">
                    {item.entityName}
                  </h3>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-deepOrange">
                    {item.sector}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex w-full flex-wrap justify-center gap-2 lg:justify-start">
                <span className="inline-flex min-h-7 items-center justify-center border border-black bg-paleOrange px-2 py-1 text-center text-[9px] font-black uppercase tracking-[0.1em]">
                  {item.status}
                </span>
                <span className="inline-flex min-h-7 items-center justify-center px-1 py-1 text-center text-[9px] font-black uppercase tracking-[0.1em] text-charcoal">
                  {item.confidence}
                </span>
              </div>
              <p className="mt-2 text-[10px] font-bold leading-5 text-charcoal">
                {item.updated}
              </p>
              <div className="mt-3 grid w-full grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                <Link
                  href={item.profileHref}
                  className="inline-flex min-h-9 items-center justify-center gap-1 border border-black bg-ink px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.12em] text-white hover:bg-deepOrange hover:text-ink"
                >
                  Open Profile
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
                {item.articleHref ?? item.dossierHref ? (
                  <Link
                    href={item.dossierHref ?? item.articleHref ?? item.profileHref}
                    className="inline-flex min-h-9 items-center justify-center gap-1 border border-black bg-white px-2 py-2 text-center text-[9px] font-black uppercase tracking-[0.12em] hover:bg-paleOrange"
                  >
                    {item.dossierHref ? "Open Dossier" : "Open Article"}
                    <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="mb-3 flex flex-col items-center gap-3 border-b border-black pb-2 text-center sm:flex-row sm:justify-between sm:text-left">
      <h2 className="text-[13px] font-black uppercase tracking-[0.18em] text-ink">
        My Research
      </h2>
      <Link
        href="/research"
        className="inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] hover:bg-deepOrange"
      >
        View All
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}

function savedItemToCard(item: SavedResearchItem) {
  return {
    id: `saved-${item.item_id}`,
    entityName: item.entity_name ?? item.title,
    sector: item.sector ?? item.item_type,
    status: "SAVED",
    updated: `Saved ${formatRelativeTime(item.updated_at)}`,
    confidence: item.item_type,
    profileHref: item.href,
    articleHref: item.item_type === "ARTICLE" ? item.href : null,
    dossierHref: item.item_type === "DOSSIER" ? item.href : null
  };
}
