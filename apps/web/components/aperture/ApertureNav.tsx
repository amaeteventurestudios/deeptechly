import Link from "next/link";

const links = [
  ["Signals", "/aperture/signals"],
  ["Problems", "/aperture/problems"],
  ["Opportunities", "/aperture/opportunities"],
  ["Agencies", "/aperture/agencies"],
  ["Evidence", "/aperture/evidence"],
  ["Methodology", "/aperture/methodology"]
] as const;

export function ApertureNav({ active }: { active?: string }) {
  return (
    <nav aria-label="Aperture navigation" className="border-b border-black bg-ink text-white">
      <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
        {links.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            aria-current={active === label.toLowerCase() ? "page" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${
              active === label.toLowerCase()
                ? "border-deepOrange bg-deepOrange text-ink"
                : "border-white/35 bg-ink text-white hover:border-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
