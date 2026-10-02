import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Sectors | DeepTechly",
  description: "Browse DeepTechly research by deep-tech sector."
};

const sectors = [
  {
    label: "Space",
    slug: "space",
    description: "Satellite infrastructure, orbital systems, launch, and cislunar programs."
  },
  {
    label: "Defense",
    slug: "defense",
    description: "Dual-use systems, autonomy, ISR, and contested-environment technologies."
  },
  {
    label: "Robotics",
    slug: "robotics",
    description: "Autonomous field systems, inspection platforms, and robotic deployment."
  },
  {
    label: "Energy",
    slug: "energy",
    description: "Grid infrastructure, storage, thermal systems, and distributed power."
  },
  {
    label: "Semiconductors",
    slug: "semiconductors",
    description: "Chip packaging, RF systems, power electronics, and advanced materials."
  },
  {
    label: "Manufacturing",
    slug: "manufacturing",
    description: "Industrial scaling, qualification, supply chain, and MRL-stage systems."
  },
  {
    label: "Materials",
    slug: "materials",
    description: "Advanced materials, structural systems, and thermal management."
  },
  {
    label: "Photonics",
    slug: "photonics",
    description: "Optical systems, laser technology, and photonic sensing platforms."
  },
  {
    label: "Sensors",
    slug: "sensors",
    description: "Environmental monitoring, ISR sensing, and integrated sensor systems."
  },
  {
    label: "Bioinfrastructure",
    slug: "bioinfrastructure",
    description: "Lab automation, medical systems, biosecurity, and health infrastructure."
  }
] as const;

export default function SectorsPage() {
  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Sectors
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Browse research by technical market.
          </h1>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {sectors.map((sector) => (
            <Link
              key={sector.slug}
              href={`/sector/${sector.slug}`}
              className="block border border-black bg-white p-5 shadow-hard hover:bg-paleOrange"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                Deep-Tech Sector
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase leading-tight">
                {sector.label}
              </h2>
              <p className="mt-2 text-sm leading-6 text-charcoal">
                {sector.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
                Open Sector
                <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
