import Link from "next/link";

const sectors = [
  "Space",
  "Defense",
  "Robotics",
  "Energy",
  "Semiconductors",
  "Photonics",
  "Materials",
  "Manufacturing"
] as const;

export function SectorNav() {
  return (
    <div className="w-full border-b border-white/15 bg-[#111111] text-white">
      <div className="mx-auto max-w-[1840px] px-4 sm:px-5 lg:px-6 xl:px-8 2xl:px-10">
        <nav aria-label="Research sectors" className="scrollbar-thin flex max-w-full items-center gap-7 overflow-x-auto whitespace-nowrap text-[0.625rem] font-black uppercase tracking-[0.17em]">
          {sectors.map((sector) => (
            <Link
              key={sector}
              href={`/sector/${sector.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="flex min-h-10 shrink-0 items-center text-white/70 transition-colors hover:text-deepOrange"
            >
              {sector}
            </Link>
          ))}
          <Link className="flex min-h-10 shrink-0 items-center border-x border-white/20 px-4 text-deepOrange hover:bg-deepOrange hover:text-ink" href="/sectors">
            More +
          </Link>
        </nav>
      </div>
    </div>
  );
}
