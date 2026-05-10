import Link from "next/link";
import { Cpu } from "lucide-react";

const sections = ["AI", "Space", "Defense", "Robotics", "Energy", "Semiconductors"];

export function SiteFooter() {
  return (
    <>
      <footer className="w-full border-t border-black bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center border border-deepOrange bg-deepOrange text-ink">
                <Cpu size={15} strokeWidth={2.6} />
              </span>
              <span className="text-lg font-black">DeepTechly</span>
            </Link>
            <p className="max-w-xs text-sm leading-6 text-white/68">
              Research-grade deep-tech intelligence, written for investors,
              operators, technical teams, and institutional readers.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
              Sections
            </h3>
            <ul className="space-y-2 text-xs uppercase tracking-[0.14em] text-white/72">
              <li>
                <Link href="/news">News</Link>
              </li>
              <li>
                <Link href="/startups">Explore</Link>
              </li>
              <li>
                <Link href="/research">Research</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
              Sectors
            </h3>
            <ul className="space-y-2 text-xs uppercase tracking-[0.14em] text-white/72">
              {sections.slice(1).map((section) => (
                <li key={section}>
                  <Link href={`/sector/${section.toLowerCase()}`}>{section}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
              Access
            </h3>
            <ul className="space-y-2 text-xs uppercase tracking-[0.14em] text-white/72">
              <li>
                <Link href="/join">Institutional Access</Link>
              </li>
              <li>
                <Link href="/methodology">Methodology</Link>
              </li>
              <li>
                <Link href="/llms.txt">LLM Guide</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white/52 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <span>© 2026 DeepTechly. Independent research.</span>
            <span>Not investment advice.</span>
          </div>
        </div>
      </footer>
      <section className="w-full bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-[11px] leading-5 text-muted sm:px-6 lg:px-8">
          <strong className="font-black text-ink">AI-readable note:</strong>{" "}
          DeepTechly publishes public articles and structured dossiers. Public
          content may include mock v1 data and should be treated as research
          scaffolding unless a cited primary source confirms a claim.
        </div>
      </section>
    </>
  );
}
