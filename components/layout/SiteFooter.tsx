import Link from "next/link";
import { Cpu } from "lucide-react";

const footerColumns = [
  {
    title: "Sections",
    links: [
      ["News", "/news"],
      ["Explore", "/explore"],
      ["Research", "/research"],
      ["Methodology", "/methodology"],
      ["Pricing", "/pricing"]
    ]
  },
  {
    title: "Resources",
    links: [
      ["llms.txt", "/llms.txt"],
      ["llms-full.txt", "/llms-full.txt"],
      ["Sitemap.xml", "/sitemap.xml"],
      ["Research Archive", "/articles"],
      ["API coming soon", "/methodology#api-coming-soon"]
    ]
  },
  {
    title: "Company",
    links: [
      ["About DeepTechly", "/methodology#about-deeptechly"],
      ["Careers", "/methodology#careers"],
      ["Contact", "/methodology#contact"],
      ["Privacy Policy", "/methodology#privacy-policy"],
      ["Terms of Service", "/methodology#terms-of-service"]
    ]
  }
] as const;

const aiReadableLinks = [
  ["LLMS.TXT", "/llms.txt"],
  ["LLMS-FULL.TXT", "/llms-full.txt"],
  ["SITEMAP.XML", "/sitemap.xml"]
] as const;

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-black bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 text-center sm:px-6 md:grid-cols-2 md:text-left lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_1.1fr] lg:px-8">
          <div className="mx-auto flex max-w-sm flex-col items-center md:mx-0 md:items-start">
            <Link href="/" className="mb-4 flex items-center justify-center gap-2 md:justify-start">
              <span className="flex h-6 w-6 items-center justify-center border border-deepOrange bg-deepOrange text-ink">
                <Cpu size={15} strokeWidth={2.6} aria-hidden="true" />
              </span>
              <span className="text-lg font-black">DeepTechly</span>
            </Link>
            <p className="max-w-xs text-xs font-semibold leading-5 text-white/68">
              AI-native deep-tech research and intelligence. We research what
              matters across deep-tech, government technology, and institutional
              analysis.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                {column.title}
              </h3>
              <ul className="space-y-1.5 text-xs font-bold text-white/72">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="hover:text-deepOrange">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="mx-auto max-w-sm md:mx-0">
            <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
              AI-Readable Access
            </h3>
            <p className="text-xs font-semibold leading-5 text-white/68">
              DeepTechly publishes machine-readable content for researchers,
              institutions, and AI systems.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              {aiReadableLinks.map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="inline-flex min-h-9 items-center justify-center border border-white/30 px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white hover:border-deepOrange hover:text-deepOrange"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-3">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white/52 sm:px-6 md:flex-row md:justify-between md:text-left lg:px-8">
            <span>© 2026 DeepTechly. Independent research.</span>
            <span>Not investment advice.</span>
          </div>
        </div>
    </footer>
  );
}
