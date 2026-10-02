import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { HomeResearchFeed } from "@/components/home/HomeResearchFeed";
import { HomeWideContainer } from "@/components/home/HomeWideContainer";
import { ResearchSubmitForm } from "@/components/research/ResearchSubmitForm";
import { Badge } from "@deeptechly/ui";

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
        <HomeWideContainer className="flex flex-col items-center py-14 text-center sm:py-16 lg:py-20">
          <Badge variant="outline" className="border-white bg-white/10 text-white">
            Deep-Tech Research / Evidence First
          </Badge>
          <h1 className="mx-auto mt-4 max-w-5xl text-[44px] font-black leading-[0.9] text-white min-[390px]:text-5xl sm:text-6xl md:text-7xl lg:text-[76px]">
            Search any deep-tech entity. We will research it.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base font-black leading-6 text-white sm:text-lg">
            DeepTechly pairs agentic research with newsroom-quality writing.
            Type a name. Get a researched profile, a feature article, and an
            institutional dossier.
          </p>
          <div className="mx-auto w-full max-w-[860px] [&>form]:mx-auto [&>form]:w-full [&>form]:max-w-none [&>form]:border-2 [&>form]:shadow-[6px_6px_0_#111111] [&>form]:lg:flex-row [&_button]:min-h-14 [&_button]:bg-black [&_button]:px-7 [&_button]:text-deepOrange [&_input]:h-12">
            <ResearchSubmitForm
              placeholder="Type any company, patent, lab or technology"
              submitLabel="Research →"
            />
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-center text-[11px] font-black uppercase tracking-[0.16em] text-white">
            Free to read · Free to research · Invite required for investor analysis
          </p>
        </HomeWideContainer>
      </section>

      <section className="w-full border-b border-black bg-ink text-white">
        <HomeWideContainer className="flex flex-col items-center justify-center gap-2 py-3 text-center text-[11px] font-black uppercase tracking-[0.18em] md:flex-row md:justify-between md:text-left">
          <span>&#8599; Today&apos;s Edition · <time>{formatEditionDate()}</time></span>
          <Link className="text-deepOrange hover:text-white" href="/news">
            Full Archive &rarr;
          </Link>
        </HomeWideContainer>
      </section>

      <HomeResearchFeed />
    </PageShell>
  );
}
