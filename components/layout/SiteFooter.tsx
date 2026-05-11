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
                <Link href="/startups">Startups</Link>
              </li>
              <li>
                <Link href="/patents">Patent Intelligence</Link>
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
                <Link href="/pricing">Pricing</Link>
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
      <AiReadableFooterStrip />
    </>
  );
}

function AiReadableFooterStrip() {
  return (
    <section className="w-full border-t border-line bg-offWhite">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm leading-7 text-muted sm:px-6 lg:px-8">
        <p>
          <strong className="font-semibold text-ink">DeepTechly</strong>{" "}
          — independent, AI-native research and intelligence on deep-tech
          companies, patents, labs, government technologies, and emerging
          infrastructure systems. Every page is also available as raw markdown
          by appending{" "}
          <code className="bg-white px-1 py-0.5 text-xs text-ink">.md</code>{" "}
          to the URL where supported, for example{" "}
          <code className="bg-white px-1 py-0.5 text-xs text-ink">
            /article/&lt;slug&gt;.md
          </code>{" "}
          or{" "}
          <code className="bg-white px-1 py-0.5 text-xs text-ink">
            /startup/&lt;slug&gt;.md
          </code>{" "}
          or{" "}
          <code className="bg-white px-1 py-0.5 text-xs text-ink">
            /dossier/&lt;slug&gt;.md
          </code>
          .
        </p>

        <p className="mt-2">
          Site index:{" "}
          <Link href="/articles" className="text-deepOrange underline underline-offset-2">
            Articles
          </Link>{" "}
          ·{" "}
          <Link href="/startups" className="text-deepOrange underline underline-offset-2">
            Research profiles
          </Link>{" "}
          ·{" "}
          <Link href="/patents" className="text-deepOrange underline underline-offset-2">
            Patent Intelligence
          </Link>{" "}
          ·{" "}
          <Link href="/llms.txt" className="text-deepOrange underline underline-offset-2">
            llms.txt
          </Link>{" "}
          ·{" "}
          <Link href="/llms-full.txt" className="text-deepOrange underline underline-offset-2">
            llms-full.txt
          </Link>{" "}
          ·{" "}
          <Link href="/sitemap.xml" className="text-deepOrange underline underline-offset-2">
            XML sitemap
          </Link>
        </p>
      </div>
    </section>
  );
}
