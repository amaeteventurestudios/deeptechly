import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeSaveButton } from "./HomeSaveButton";
import { getAuthSession } from "@/lib/auth/session";
import { listResearchJobs } from "@/lib/research/store";
import { formatRelativeTime } from "@/lib/story-metadata";
import { listSavedResearchItems, type SavedResearchItem } from "@/lib/saved-research";

const researchPanelClass =
  "min-w-0 border-t border-black pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0";

const starterResearchCards = [
  {
    id: "starter-titanym",
    entityName: "Titanym",
    sector: "SEMICONDUCTORS",
    status: "STARTER",
    profileHref: "/startup/titanym",
    dossierHref: "/dossier/titanym"
  },
  {
    id: "starter-helioforge",
    entityName: "HelioForge Systems",
    sector: "ENERGY",
    status: "STARTER",
    profileHref: "/startup/helioforge-systems",
    dossierHref: "/dossier/helioforge-systems"
  },
  {
    id: "starter-orbital-optics",
    entityName: "Orbital Optics Labs",
    sector: "SPACE",
    status: "STARTER",
    profileHref: "/sector/space",
    dossierHref: "/research"
  },
  {
    id: "starter-darpa-nom4d",
    entityName: "DARPA NOM4D",
    sector: "DEFENSE",
    status: "STARTER",
    profileHref: "/sector/defense",
    dossierHref: "/research"
  },
  {
    id: "starter-nano-forge",
    entityName: "Nano Forge Labs",
    sector: "MATERIALS",
    status: "STARTER",
    profileHref: "/sector/materials",
    dossierHref: "/research"
  },
  {
    id: "starter-sige-sapphire",
    entityName: "SiGe on Sapphire",
    sector: "SEMICONDUCTORS",
    status: "STARTER",
    profileHref: "/sector/semiconductors",
    dossierHref: "/research"
  }
];

export async function MyResearch() {
  const session = await getAuthSession();

  if (!session) {
    return (
      <section className={researchPanelClass}>
        <SectionHeader title="Your Research" />
        <StarterResearchGrid />
      </section>
    );
  }

  const [savedResearch, jobs] = await Promise.all([
    listSavedResearchItems(session.userId, 6),
    listResearchJobs(session.userId)
  ]);
  const savedCards = savedResearch.items.slice(0, 6).map(savedItemToCard);
  const jobCards = jobs.slice(0, 6).map((job) => ({
    id: `job-${job.createdAt}-${job.query}`,
    entityName: job.feed?.entityName ?? job.resolvedName ?? job.query,
    sector: job.feed?.sector ?? job.mode.toUpperCase(),
    status: job.statusLabel,
    updated: `Updated ${formatRelativeTime(job.updatedAt)}`,
    profileHref: job.profileUrl ?? "/research",
    articleHref: job.articleUrl,
    dossierHref: job.dossierUrl
  }));
  const cards = [...jobCards, ...savedCards].slice(0, 6);

  return (
    <section className={researchPanelClass}>
      <SectionHeader title="My Research" />

      {cards.length === 0 ? (
        <StarterResearchGrid />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {cards.map((item) => (
            <ResearchCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function ResearchCard({
  item
}: {
  item: {
    id: string;
    entityName: string;
    sector: string;
    status: string;
    updated?: string;
    profileHref: string;
    articleHref?: string | null;
    dossierHref?: string | null;
  };
}) {
  return (
    <article className="flex flex-col border border-black bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-deepOrange">
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-deepOrange">
        {item.sector}
      </p>
      <h3 className="mt-1 text-[13px] font-black leading-tight text-ink line-clamp-2">
        {item.entityName}
      </h3>
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex items-center border border-black bg-paleOrange px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.1em]">
          {item.status}
        </span>
        {item.updated ? (
          <span className="text-[8px] font-semibold text-muted">{item.updated}</span>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <Link
          href={item.profileHref}
          className="inline-flex min-h-11 items-center justify-center gap-1 border border-black bg-ink px-2 text-[8px] font-black uppercase tracking-[0.1em] text-white hover:bg-deepOrange hover:text-ink"
        >
          Profile
          <ArrowRight size={10} aria-hidden="true" />
        </Link>
        {item.dossierHref ?? item.articleHref ? (
          <Link
            href={item.dossierHref ?? item.articleHref ?? item.profileHref}
            className="inline-flex min-h-11 items-center justify-center gap-1 border border-black bg-white px-2 text-[8px] font-black uppercase tracking-[0.1em] hover:bg-paleOrange"
          >
            {item.dossierHref ? "Dossier" : "Article"}
            <ArrowRight size={10} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function StarterResearchGrid() {
  return (
    <>
      {/* Starter intro */}
      <div className="mb-4 border-b border-black/20 pb-3">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-deepOrange">
          Starter Research
        </p>
        <p className="mt-1 text-[11px] font-semibold leading-5 text-charcoal">
          No saved research yet. Start with one of these research paths or save articles to build your private queue.
        </p>
      </div>

      {/* Starter cards grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {starterResearchCards.map((item) => (
          <article
            key={item.id}
            className="flex flex-col border border-black bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-deepOrange"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[7px] font-black uppercase tracking-[0.16em] text-deepOrange">
                  {item.sector}
                </p>
                <h3 className="mt-1 text-[12px] font-black leading-tight text-ink">
                  {item.entityName}
                </h3>
              </div>
              <HomeSaveButton
                entityName={item.entityName}
                href={item.profileHref}
                itemId={item.id}
                itemType="STARTER_RESEARCH"
                label={item.entityName}
                className="shrink-0 shadow-none"
                sector={item.sector}
              />
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center border border-black bg-paleOrange px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.1em]">
                {item.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <Link
                href={item.profileHref}
                className="inline-flex min-h-11 items-center justify-center gap-1 border border-black bg-ink px-1.5 text-[7px] font-black uppercase tracking-[0.1em] text-white hover:bg-deepOrange hover:text-ink"
              >
                Profile
                <ArrowRight size={9} aria-hidden="true" />
              </Link>
              <Link
                href={item.dossierHref}
                className="inline-flex min-h-11 items-center justify-center gap-1 border border-black bg-white px-1.5 text-[7px] font-black uppercase tracking-[0.1em] hover:bg-paleOrange"
              >
                Dossier
                <ArrowRight size={9} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-black pb-3">
      <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-ink">
        {title}
      </h2>
      <Link
        href="/research"
        className="inline-flex min-h-11 items-center justify-center gap-1.5 border border-black bg-white px-3 text-[9px] font-black uppercase tracking-[0.16em] hover:bg-deepOrange"
      >
        View All
        <ArrowRight size={10} aria-hidden="true" />
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
    profileHref: item.href,
    articleHref: item.item_type === "ARTICLE" ? item.href : null,
    dossierHref: item.item_type === "DOSSIER" ? item.href : null
  };
}
