import Link from "next/link";

const sectors = ["SPACE", "DEFENSE", "ROBOTICS", "ENERGY", "SEMICONDUCTORS"];

export function SectorNav() {
  return (
    <section className="w-full border-b border-white/10 bg-[#111111] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="scrollbar-thin flex max-w-full justify-start gap-8 overflow-x-auto whitespace-nowrap py-2.5 text-[11px] font-black uppercase tracking-[0.18em]">
          {sectors.map((sector) => (
            <Link
              key={sector}
              href={`/sector/${sector.toLowerCase()}`}
              className="shrink-0 text-white/78 hover:text-deepOrange"
            >
              {sector}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
