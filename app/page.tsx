import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { HomeResearchFeed } from "@/components/home/HomeResearchFeed";
import { ResearchSubmitForm } from "@/components/research/ResearchSubmitForm";

export const dynamic = "force-dynamic";

function formatEditionDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  })
    .format(date)
    .toUpperCase();
}

export default function HomePage() {
  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-14 text-center sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Deep-Tech Research
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-[42px] font-black leading-[0.94] min-[390px]:text-5xl sm:text-6xl md:text-7xl">
            Search any deep-tech entity. We will research it.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-ink/82">
            DeepTechly turns public signals into editorial articles, structured
            dossiers, confidence labels, and institutional diligence previews.
          </p>
          <div className="mx-auto w-full max-w-2xl [&>form]:mx-auto [&>form]:w-full [&_button]:min-h-12">
            <ResearchSubmitForm />
          </div>
          <p className="mx-auto mt-4 max-w-xl text-center text-[10px] font-black uppercase tracking-[0.16em] text-ink/78">
            Public research queue · Institutional previews · AI-readable archive
          </p>
        </div>
      </section>

      <section className="w-full border-b border-black bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] sm:px-6 md:flex-row md:justify-between md:text-left lg:px-8">
          <span>&#8599; Today&apos;s Edition · {formatEditionDate()}</span>
          <Link className="text-deepOrange hover:text-white" href="/news">
            Full Archive &rarr;
          </Link>
        </div>
      </section>

      <HomeResearchFeed />
    </PageShell>
  );
}
