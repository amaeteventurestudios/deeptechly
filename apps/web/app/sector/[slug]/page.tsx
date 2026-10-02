import { notFound } from "next/navigation";
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

type SectorPageProps = {
  params: Promise<{ slug: string }>;
};

const sectorMap: Record<string, string> = {
  space: "SPACE",
  defense: "DEFENSE",
  robotics: "ROBOTICS",
  energy: "ENERGY",
  semiconductors: "SEMICONDUCTORS",
  manufacturing: "MANUFACTURING",
  materials: "MATERIALS",
  photonics: "PHOTONICS",
  sensors: "SENSORS",
  bioinfrastructure: "BIOINFRASTRUCTURE",
  autonomy: "AUTONOMY",
  aerospace: "AEROSPACE",
  quantum: "QUANTUM",
  deeptech: "DEEPTECH",
  "ai-infrastructure": "AI INFRASTRUCTURE",
  "industrial-systems": "INDUSTRIAL SYSTEMS",
  "climate-systems": "CLIMATE SYSTEMS",
  "supply-chain": "SUPPLY CHAIN",
  "water-systems": "WATER SYSTEMS",
  "cyber-physical-systems": "CYBER-PHYSICAL SYSTEMS"
};

const sectorDescriptions: Record<string, string> = {
  SPACE: "Space technology companies, satellite infrastructure, orbital systems, launch vehicles, and cislunar programs.",
  DEFENSE: "Defense technology companies, dual-use systems, autonomy, ISR, and contested environment solutions.",
  ROBOTICS: "Robotics companies, autonomous field systems, inspection platforms, and robotic deployment infrastructure.",
  ENERGY: "Energy technology companies, grid infrastructure, storage, thermal systems, and distributed power.",
  SEMICONDUCTORS: "Semiconductor companies, chip packaging, RF systems, power electronics, and advanced materials.",
  MANUFACTURING: "Advanced manufacturing, supply chain, industrial scaling, qualification, and MRL-stage companies.",
  MATERIALS: "Advanced materials companies, structural systems, thermal management, and materials innovation.",
  PHOTONICS: "Photonics companies, optical systems, laser technology, and photonic sensing platforms.",
  SENSORS: "Sensing technology, environmental monitoring, ISR sensing, and sensor-integrated systems.",
  BIOINFRASTRUCTURE: "Biotech infrastructure, medical systems, lab automation, sensing, and health intelligence."
};

export async function generateMetadata({ params }: SectorPageProps) {
  const { slug } = await params;
  const sectorKey = sectorMap[slug.toLowerCase()];
  const label = sectorKey ?? slug.replace(/-/g, " ").toUpperCase();

  return {
    title: `${label} Research | DeepTechly`,
    description:
      sectorDescriptions[sectorKey ?? ""] ??
      `Research archive for ${label} deep-tech companies, technologies, and programs.`
  };
}

export default async function SectorPage({ params }: SectorPageProps) {
  const { slug } = await params;
  const sectorKey = sectorMap[slug.toLowerCase()];

  if (!sectorKey && slug.length > 32) {
    notFound();
  }

  const normalizedSector = (sectorKey ?? slug.replace(/-/g, " ").toUpperCase()).toLowerCase();

  const entities = await getPublishedEntities();
  const allStories = entities.map(storyFromEntity);

  const sectorStories = allStories.filter((story) =>
    story.sectorTags.some((tag) => tag.toLowerCase() === normalizedSector) ||
    (story.entityName + " " + story.title + " " + story.dek)
      .toLowerCase()
      .includes(normalizedSector.replace(/-/g, " "))
  );

  const label = sectorKey ?? slug.replace(/-/g, " ").toUpperCase();
  const description = sectorDescriptions[sectorKey ?? ""] ?? null;

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Sector · {label}
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            {label} research.
          </h1>
          {description ? (
            <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-ink/82">
              {description}
            </p>
          ) : null}
        </div>
      </section>

      <SectorNav />

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          {sectorStories.length === 0 ? (
            <div className="border border-black bg-white p-8 text-center shadow-hard">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
                {label}
              </p>
              <h2 className="mt-3 text-2xl font-black">
                No published research in this sector yet.
              </h2>
              <p className="mt-3 text-sm leading-6 text-charcoal">
                Submit any {label.toLowerCase()} company, technology, lab, or
                government program to queue research.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 border border-black bg-deepOrange px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
                >
                  Queue Research
                  <ArrowRight size={13} />
                </Link>
                <Link
                  href="/news"
                  className="inline-flex items-center gap-2 border border-black bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
                >
                  View All Research
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between border-b border-black pb-3">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-deepOrange">
                  {sectorStories.length} published{" "}
                  {sectorStories.length === 1 ? "profile" : "profiles"}
                </p>
                <Link
                  href="/news"
                  className="text-[10px] font-black uppercase tracking-[0.16em]"
                >
                  All Research
                </Link>
              </div>
              <div className="space-y-5">
                {sectorStories.map((story, index) => (
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
                      <Link
                        href={story.profileUrl ?? story.articleUrl}
                        className="inline-flex items-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
                      >
                        Open Profile
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
