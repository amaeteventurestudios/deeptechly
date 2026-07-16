import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";

const routes = [
  ["Articles", "/articles", "/article/[slug].md"],
  ["Company profiles", "/startups", "/startup/[slug].md"],
  ["Research dossiers", null, "/dossier/[slug].md"]
];

export default function ApiAccessPage() {
  return (
    <PageShell>
      <section className="border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-[1840px] px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">DeepTechly Access</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.92] sm:text-6xl">AI-readable research access</h1>
          <p className="mt-5 max-w-3xl text-base font-semibold leading-7 text-ink/82">Public DeepTechly research is available as readable web pages and, where supported, machine-readable Markdown. Source and confidence metadata travel with the research.</p>
        </div>
      </section>
      <section className="bg-paper">
        <div className="mx-auto grid max-w-[1840px] gap-5 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
          {routes.map(([label, indexRoute, markdownRoute]) => (
            <article key={label} className="border border-black bg-white p-5 shadow-hard">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">{label}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-charcoal">Browse the public index, then append <code>.md</code> to a supported public artifact URL for Markdown.</p>
              {indexRoute ? <Link href={indexRoute} className="mt-5 inline-block text-[10px] font-black uppercase tracking-[0.14em] underline">Open index</Link> : <p className="mt-5 text-[10px] font-black uppercase tracking-[0.14em]">Linked from its public profile or article</p>}
              <p className="mt-3 break-all text-xs font-bold">{markdownRoute}</p>
            </article>
          ))}
        </div>
        <div className="mx-auto max-w-[1840px] px-4 pb-12 sm:px-6 lg:px-8">
          <div className="border border-black bg-offWhite p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">Crawling and attribution</p>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-charcoal">Use the original source links and confidence labels when citing DeepTechly. Research may distinguish confirmed facts, inferred analysis, and open questions; unavailable public evidence is not a claim of absence.</p>
            <div className="mt-5 flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-[0.14em] underline"><Link href="/llms.txt">llms.txt</Link><Link href="/llms-full.txt">llms-full.txt</Link><Link href="/sitemap.xml">sitemap.xml</Link></div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
