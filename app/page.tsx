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
      <section className="w-full border-b border-black bg-deepOrange deeptech-home-hero">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-16 lg:items-start lg:px-8 lg:py-20 lg:text-left">
          <p className="text-[12px] font-black uppercase tracking-[0.28em] text-white">
            Deep-Tech Research
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-[44px] font-black leading-[0.9] text-white min-[390px]:text-5xl sm:text-6xl md:text-7xl lg:mx-0 lg:text-[76px]">
            Search any deep-tech entity. We will research it.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base font-black leading-6 text-white sm:text-lg lg:mx-0">
            DeepTechly pairs agentic research with newsroom-quality writing.
            Type a name. Get a researched profile, a feature article, and
            investor-ready analysis.
          </p>
          <div className="mx-auto w-full max-w-3xl lg:mx-0 [&>form]:mx-auto [&>form]:w-full [&>form]:max-w-none [&>form]:border-2 [&>form]:shadow-[6px_6px_0_#111111] [&>form]:lg:flex-row [&_button]:min-h-14 [&_button]:bg-black [&_button]:px-7 [&_button]:text-deepOrange [&_input]:h-12">
            <ResearchSubmitForm
              placeholder="Type any company, patent, lab or technology"
              submitLabel="Research →"
            />
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-center text-[11px] font-black uppercase tracking-[0.16em] text-white lg:mx-0 lg:text-left">
            Free to read · Free to research · Invite required for investor analysis
          </p>
        </div>
      </section>

      <section className="w-full border-b border-black bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.18em] sm:px-6 md:flex-row md:justify-between md:text-left lg:px-8">
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
