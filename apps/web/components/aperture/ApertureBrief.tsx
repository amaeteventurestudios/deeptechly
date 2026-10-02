import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import type {
  ApertureOpportunity,
  ApertureProblem,
  ApertureSignal,
  ApertureSource
} from "@deeptechly/aperture";

export function SignalBrief({ signal }: { signal: ApertureSignal }) {
  return (
    <BriefFrame
      eyebrow={`${signal.agency.abbreviation ?? signal.agency.name} · ${signal.signalType}`}
      title={signal.title}
      summary={signal.summary}
      confidence={signal.confidenceLabel}
      sourceCount={signal.sourceCount}
      markdownHref={`/aperture/signals/${signal.slug}.md`}
      sections={[
        ["Agency ask", signal.agencyAsk],
        ["Underlying problem statement", signal.problemStatement],
        ["Evidence base", signal.evidenceBase],
        ["Technical requirement map", signal.technicalRequirements],
        ["Prior and repeated signals", signal.repeatedSignals],
        ["Related companies", signal.relatedCompanies],
        ["Related patents", signal.relatedPatents],
        ["Related labs", signal.relatedLabs],
        ["Opportunity read", signal.opportunityRead],
        ["Investor / institutional read", signal.institutionalRead ?? []]
      ]}
      sources={signal.sources}
    />
  );
}

export function ProblemBrief({ problem }: { problem: ApertureProblem }) {
  return (
    <BriefFrame
      eyebrow={`${problem.agency?.abbreviation ?? "Cross-agency"} · Problem statement`}
      title={problem.title}
      summary={problem.summary}
      confidence={problem.confidenceLabel}
      sourceCount={problem.sourceCount}
      markdownHref={`/aperture/problems/${problem.slug}.md`}
      sections={[
        ["Problem statement", [problem.problemText]],
        ["Evidence base", problem.evidence],
        ["Technical requirements", problem.technicalRequirements],
        ["Related signals", problem.relatedSignalSlugs]
      ]}
      sources={problem.sources}
    />
  );
}

export function OpportunityBrief({ opportunity }: { opportunity: ApertureOpportunity }) {
  return (
    <BriefFrame
      eyebrow="Opportunity map"
      title={opportunity.title}
      summary={opportunity.summary}
      confidence={opportunity.confidenceLabel}
      sourceCount={opportunity.sourceCount}
      markdownHref={`/aperture/opportunities/${opportunity.slug}.md`}
      sections={[
        ["Problem statement", opportunity.problemStatement],
        ["Repeated demand pattern", opportunity.demandPattern],
        ["Technical requirement map", opportunity.requirementMap],
        ["Company matches", opportunity.companyMatches],
        ["Patent matches", opportunity.patentMatches],
        ["Lab matches", opportunity.labMatches],
        ["Opportunity read", opportunity.opportunityRead]
      ]}
      sources={opportunity.sources}
    />
  );
}

function BriefFrame({
  eyebrow,
  title,
  summary,
  confidence,
  sourceCount,
  markdownHref,
  sections,
  sources
}: {
  eyebrow: string;
  title: string;
  summary: string;
  confidence: string;
  sourceCount: number;
  markdownHref: string;
  sections: Array<[string, string[]]>;
  sources: ApertureSource[];
}) {
  const visibleSections = sections.filter(([, items]) => items.length > 0);
  return (
    <article className="bg-paper">
      <section className="border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em]">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl font-black leading-[0.96] tracking-[-0.035em] sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-semibold leading-8">{summary}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <BriefDatum>{confidence}</BriefDatum>
            <BriefDatum>{sourceCount} public sources</BriefDatum>
            <Link href={markdownHref} className="inline-flex min-h-9 items-center border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.13em]">
              Markdown
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8">
        <div className="space-y-10">
          {visibleSections.map(([heading, items]) => (
            <section key={heading} className="border-t border-black pt-5">
              <h2 className="font-serif text-3xl font-black leading-tight">{heading}</h2>
              <div className="mt-4 space-y-4 text-base font-medium leading-8 text-charcoal">
                {items.map((item, index) => <p key={`${heading}-${index}`}>{item}</p>)}
              </div>
            </section>
          ))}
          <section className="border-t border-black pt-5">
            <h2 className="font-serif text-3xl font-black leading-tight">Sources</h2>
            <ol className="mt-5 space-y-3">
              {sources.map((source, index) => (
                <li key={`${source.url}-${index}`} className="border border-black bg-white p-4">
                  <a href={source.url} target="_blank" rel="noreferrer" className="font-black leading-6 hover:underline">
                    {source.title} <ExternalLink className="ml-1 inline" size={13} />
                  </a>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.13em] text-muted">
                    {source.publisher} · {source.documentType}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="h-fit border border-black bg-white p-5 shadow-hard lg:sticky lg:top-24">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">Aperture framework</p>
          <p className="mt-3 text-sm font-semibold leading-6 text-charcoal">
            Discovery identifies candidate government demand. Evidence establishes the ask. Repetition, requirements, and capability matches are evaluated separately and retain explicit uncertainty.
          </p>
          <Link href="/aperture/methodology" className="mt-4 inline-flex min-h-11 items-center border border-black bg-ink px-3 py-2 text-[10px] font-black uppercase tracking-[0.13em] text-white">
            Read Methodology
          </Link>
        </aside>
      </div>
    </article>
  );
}

function BriefDatum({ children }: { children: ReactNode }) {
  return <span className="inline-flex min-h-9 items-center border border-black bg-offWhite px-3 py-2 text-[10px] font-black uppercase tracking-[0.13em]">{children}</span>;
}
