import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { absoluteUrl } from "@/lib/site";
import { getPublicPatentRecord } from "@/lib/patents/public-data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const record = await getPublicPatentRecord((await params).slug);
  if (!record) return { title: "Patent signal not found | DeepTechly" };
  return {
    title: `${record.title} | DeepTechly Patent Intelligence`,
    description: record.summary,
    alternates: { canonical: `/patent/${record.slug}` },
    openGraph: {
      title: record.title,
      description: record.summary,
      url: `/patent/${record.slug}`,
      type: "article"
    }
  };
}

export default async function PatentPage({ params }: Props) {
  const record = await getPublicPatentRecord((await params).slug);
  if (!record) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: record.title,
    description: record.summary,
    url: absoluteUrl(`/patent/${record.slug}`),
    about: { "@type": "Organization", name: record.entityName },
    citation: record.sourceUrl,
    publisher: { "@type": "Organization", name: "DeepTechly" }
  };

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <article className="bg-paper">
        <section className="border-b border-black bg-deepOrange deeptech-texture">
          <div className="mx-auto max-w-[1120px] px-4 py-12 sm:px-6 lg:px-8">
            <p className="text-[11px] font-black uppercase tracking-[0.22em]">Patent intelligence / source brief</p>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl font-black leading-[0.96] tracking-[-0.035em] sm:text-6xl">{record.title}</h1>
            <p className="mt-5 max-w-3xl text-lg font-semibold leading-8">{record.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.13em]">
              <span className="border border-black bg-offWhite px-3 py-2">{record.confidenceLabel}</span>
              <span className="border border-black bg-offWhite px-3 py-2">{record.sector}</span>
              <Link href={`/patent/${record.slug}.md`} className="border border-black bg-white px-3 py-2">Markdown</Link>
            </div>
          </div>
        </section>
        <div className="mx-auto grid max-w-[1120px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
          <div className="space-y-8">
            <section className="border-t border-black pt-5">
              <h2 className="font-serif text-3xl font-black">Evidence boundary</h2>
              <p className="mt-4 text-base font-medium leading-8 text-charcoal">{record.caveat}</p>
            </section>
            <section className="border-t border-black pt-5">
              <h2 className="font-serif text-3xl font-black">Primary source</h2>
              <div className="mt-4 border border-black bg-white p-5 shadow-hard">
                <a href={record.sourceUrl} target="_blank" rel="noreferrer" className="font-black hover:underline">{record.title} <ExternalLink className="ml-1 inline" size={14} /></a>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted">{record.sourcePublisher}{record.sourceDate ? ` · ${record.sourceDate}` : ""}</p>
              </div>
            </section>
          </div>
          <aside className="h-fit border border-black bg-white p-5 shadow-hard lg:sticky lg:top-24">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">Related research</p>
            <h2 className="mt-3 text-xl font-black">{record.entityName}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-charcoal">This patent source is attached to the entity research file. Review the profile for its broader evidence and confidence context.</p>
            <Link href={`/startup/${record.entitySlug}`} className="mt-5 inline-flex min-h-11 items-center border border-black bg-ink px-3 py-2 text-[10px] font-black uppercase tracking-[0.13em] text-white">Open profile</Link>
          </aside>
        </div>
      </article>
    </PageShell>
  );
}
