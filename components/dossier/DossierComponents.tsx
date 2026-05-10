"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Lock,
  Star,
  ExternalLink as ExternalLinkIcon
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ResearchEntity, RevenuePath, Source } from "@/lib/types";

const panelClass = "border border-black bg-white shadow-hard";
const labelClass =
  "text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange";

function SectionFrame({
  eyebrow,
  title,
  children
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-black/20 py-8">
      {eyebrow ? <p className={labelClass}>{eyebrow}</p> : null}
      <h2 className="mt-1 text-3xl font-black leading-tight">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TextList({ items }: { items: string[] }) {
  return (
    <div className="space-y-4 text-[16px] leading-7 text-ink/88">
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm leading-6 text-ink/84">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span className="mt-2 h-2 w-2 shrink-0 border border-black bg-deepOrange" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DossierHero({ entity }: { entity: ResearchEntity }) {
  return (
    <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.28em]">
              DeepTechly Research
            </span>
            <button
              aria-label={`Save ${entity.name}`}
              className="flex h-8 w-8 items-center justify-center border border-black bg-white shadow-hard"
            >
              <Star size={16} />
            </button>
          </div>
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h1 className="text-5xl font-black leading-[0.92] sm:text-6xl md:text-7xl">
                {entity.name}
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-ink/82 md:text-lg">
                {entity.summary}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {entity.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="border border-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.13em]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="border border-black bg-white p-4 text-sm shadow-hard md:w-64">
              <div className="grid gap-3">
                <p>
                  <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                    Confidence
                  </span>
                  <span className="font-black">{entity.confidenceLabel}</span>
                </p>
                <p>
                  <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                    Sources Analyzed
                  </span>
                  <span className="font-black">{entity.sourceCount}</span>
                </p>
                <p>
                  <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
                    Last Researched
                  </span>
                  <span className="font-black">{entity.lastResearchedAt}</span>
                </p>
                <Link
                  href={`/article/${entity.slug}`}
                  className="inline-flex items-center justify-center gap-2 border border-black bg-ink px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white"
                >
                  Read Article
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ExternalLinksRow({ entity }: { entity: ResearchEntity }) {
  return (
    <section className="w-full border-b border-black bg-offWhite">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="scrollbar-thin flex gap-2 overflow-x-auto py-4">
          {entity.externalLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="inline-flex shrink-0 items-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] hover:bg-deepOrange"
            >
              {link.label}
              <ExternalLinkIcon size={12} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SnapshotPanel({ entity }: { entity: ResearchEntity }) {
  const rows = [
    ["Entity type", entity.snapshot.entityType],
    ["Primary sector", entity.snapshot.primarySector],
    ["Secondary sectors", entity.snapshot.secondarySectors.join(", ")],
    ["Region", entity.snapshot.region],
    ["Stage", entity.snapshot.stage],
    ["Source count", String(entity.snapshot.sourceCount)],
    ["Confidence", entity.snapshot.confidence],
    ["Research status", entity.snapshot.researchStatus]
  ];

  return (
    <section className="w-full bg-paper">
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className={panelClass}>
          <div className="border-b border-black bg-ink px-4 py-3 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
              Snapshot
            </p>
          </div>
          <div className="grid sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div key={label} className="border-b border-black/20 px-4 py-3 sm:border-r">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted">
                  {label}
                </p>
                <p className="mt-1 text-sm font-bold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ExecutiveSummary({ entity }: { entity: ResearchEntity }) {
  return (
    <SectionFrame title="Executive summary">
      <TextList items={entity.dossier.executiveSummary} />
    </SectionFrame>
  );
}

export function TaxonomySnapshotTable({ entity }: { entity: ResearchEntity }) {
  const taxonomy = entity.dossier.taxonomySnapshot;
  const rows = [
    ["Entity type", taxonomy.entityType],
    ["Primary sector", taxonomy.primarySector],
    ["Secondary sectors", taxonomy.secondarySectors.join(", ")],
    ["Technology layer", taxonomy.technologyLayer],
    ["Business model", taxonomy.businessModel],
    ["Customer type", taxonomy.customerType],
    ["Deployment environment", taxonomy.deploymentEnvironment],
    ["Capital intensity", taxonomy.capitalIntensity],
    ["Regulatory exposure", taxonomy.regulatoryExposure],
    ["Government relevance", taxonomy.governmentRelevance]
  ];

  return (
    <SectionFrame title="Taxonomy snapshot">
      <div className="scrollbar-thin overflow-x-auto border border-black bg-white shadow-hard">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="border border-black px-3 py-2">Classification</th>
              <th className="border border-black px-3 py-2">DeepTechly Read</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <td className="border border-black px-3 py-3 font-black">{label}</td>
                <td className="border border-black px-3 py-3">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionFrame>
  );
}

export function CompanyOverviewSection({ entity }: { entity: ResearchEntity }) {
  return (
    <SectionFrame title="Company overview">
      <TextList items={entity.dossier.companyOverview} />
    </SectionFrame>
  );
}

export function ProductTechnologySection({ entity }: { entity: ResearchEntity }) {
  const facts = entity.dossier.productTechnologyFacts;
  return (
    <SectionFrame title="Product and technology">
      <div className="space-y-5">
        <TextList items={entity.dossier.productAndTechnology} />
        <div className={panelClass}>
          {[
            ["Core system", facts.coreSystem],
            ["Primary technical advantage", facts.primaryTechnicalAdvantage],
            ["Key dependencies", facts.keyDependencies],
            ["Validation needed", facts.validationNeeded],
            ["Deployment environment", facts.deploymentEnvironment]
          ].map(([label, value]) => (
            <div key={label} className="border-b border-black/20 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-deepOrange">
                {label}
              </p>
              <p className="mt-1 text-sm leading-6">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

export function MarketResearchSection({ entity }: { entity: ResearchEntity }) {
  return (
    <SectionFrame title="Market research">
      <div className="space-y-5">
        <TextList items={entity.dossier.marketResearch} />
        <div className="scrollbar-thin overflow-x-auto border border-black bg-white shadow-hard">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="bg-ink text-white">
              <tr>
                <th className="border border-black px-3 py-2">Customer Segment</th>
                <th className="border border-black px-3 py-2">Need</th>
                <th className="border border-black px-3 py-2">Adoption Constraint</th>
              </tr>
            </thead>
            <tbody>
              {entity.dossier.customerSegments.map((row) => (
                <tr key={row.customerSegment}>
                  <td className="border border-black px-3 py-3 font-black">
                    {row.customerSegment}
                  </td>
                  <td className="border border-black px-3 py-3">{row.need}</td>
                  <td className="border border-black px-3 py-3">
                    {row.adoptionConstraint}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionFrame>
  );
}

function ConfidenceScoreCard({ entity }: { entity: ResearchEntity }) {
  return (
    <div className={panelClass}>
      <div className="border-b border-black bg-ink px-4 py-3 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
          Confidence Score
        </p>
      </div>
      <div className="p-4">
        <p className="text-5xl font-black">{entity.confidenceScore}</p>
        <p className="mt-1 text-sm font-bold">{entity.confidenceLabel} confidence</p>
        <div className="mt-4 h-3 border border-black bg-offWhite">
          <div
            className="h-full bg-deepOrange"
            style={{ width: `${entity.confidenceScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ReadinessBars({ entity }: { entity: ResearchEntity }) {
  const readiness = [
    { label: "TRL", value: entity.dossier.dataSnapshot.trl },
    { label: "MRL", value: entity.dossier.dataSnapshot.mrl }
  ];

  return (
    <div className={panelClass}>
      <div className="border-b border-black bg-ink px-4 py-3 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
          TRL / MRL Readiness
        </p>
      </div>
      <div className="space-y-4 p-4">
        {readiness.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.14em]">
              <span>{item.label}</span>
              <span>{item.value}/9</span>
            </div>
            <div className="h-4 border border-black bg-offWhite">
              <div
                className="h-full bg-deepOrange"
                style={{ width: `${(item.value / 9) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskRadarChart({ entity }: { entity: ResearchEntity }) {
  const base = entity.dossier.dataSnapshot.riskScore;
  const data = [
    { subject: "Technical", risk: base },
    { subject: "MFG", risk: Math.min(92, base + 8) },
    { subject: "Capital", risk: Math.min(95, base + 12) },
    { subject: "Customer", risk: Math.max(30, base - 5) },
    { subject: "Policy", risk: Math.max(30, base - 12) }
  ];

  return (
    <div className={panelClass}>
      <div className="border-b border-black bg-ink px-4 py-3 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
          Risk Radar
        </p>
      </div>
      <div className="h-64 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#111111" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#0E0E0E", fontSize: 11 }} />
            <Radar
              dataKey="risk"
              stroke="#FF5A00"
              fill="#FF5A00"
              fillOpacity={0.32}
              isAnimationActive={false}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SectorActivityChart({ entity }: { entity: ResearchEntity }) {
  const activity = entity.dossier.dataSnapshot.sectorActivity;
  const data = [
    { name: "Sources", value: entity.sourceCount * 4 },
    { name: "Sector", value: activity },
    { name: "Risk", value: entity.dossier.dataSnapshot.riskScore },
    { name: "Signal", value: entity.confidenceScore }
  ];

  return (
    <div className={panelClass}>
      <div className="border-b border-black bg-ink px-4 py-3 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
          Market Signal
        </p>
      </div>
      <div className="h-56 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#E5E0D8" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#0E0E0E" }} />
            <YAxis tick={{ fontSize: 11, fill: "#0E0E0E" }} />
            <Tooltip />
            <Bar dataKey="value" fill="#FF5A00" stroke="#111111" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DataSnapshotPanel({ entity }: { entity: ResearchEntity }) {
  return (
    <SectionFrame title="Data snapshot">
      <div className="grid gap-5 md:grid-cols-2">
        <ConfidenceScoreCard entity={entity} />
        <ReadinessBars entity={entity} />
        <RiskRadarChart entity={entity} />
        <SectorActivityChart entity={entity} />
      </div>
    </SectionFrame>
  );
}

export function AccuracyConfidencePanel({ entity }: { entity: ResearchEntity }) {
  const accuracy = entity.dossier.accuracyAndConfidence;
  return (
    <SectionFrame title="Accuracy and confidence">
      <div className={`${panelClass} border-t-4 border-t-deepOrange`}>
        <div className="border-b border-black px-4 py-3">
          <p className="inline-flex border border-black bg-deepOrange px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
            {accuracy.label} Confidence
          </p>
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          <div className="border-b border-black/20 p-4 md:border-b-0 md:border-r">
            <h3 className="mb-3 text-sm font-black">Confirmed</h3>
            <BulletList items={accuracy.confirmed} />
          </div>
          <div className="border-b border-black/20 p-4 md:border-b-0 md:border-r">
            <h3 className="mb-3 text-sm font-black">Inferred</h3>
            <BulletList items={accuracy.inferred} />
          </div>
          <div className="p-4">
            <h3 className="mb-3 text-sm font-black">Unverified</h3>
            <BulletList items={accuracy.unverified} />
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}

export function CompetitiveLandscapeTable({ entity }: { entity: ResearchEntity }) {
  return (
    <SectionFrame title="Competitive landscape">
      <div className="scrollbar-thin overflow-x-auto border border-black bg-white shadow-hard">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead className="bg-ink text-white">
            <tr>
              {["Company / Approach", "Category", "Strength", "Constraint", "Relevance"].map(
                (heading) => (
                  <th key={heading} className="border border-black px-3 py-2">
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {entity.dossier.competitiveLandscape.map((row) => (
              <tr key={row.companyOrApproach}>
                <td className="border border-black px-3 py-3 font-black">
                  {row.companyOrApproach}
                </td>
                <td className="border border-black px-3 py-3">{row.category}</td>
                <td className="border border-black px-3 py-3">{row.strength}</td>
                <td className="border border-black px-3 py-3">{row.constraint}</td>
                <td className="border border-black px-3 py-3">{row.relevance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionFrame>
  );
}

export function CompanyPositioningPanel({ entity }: { entity: ResearchEntity }) {
  const positioning = entity.dossier.companyPositioning;
  const rows = [
    ["Where it competes", positioning.whereItCompetes],
    ["Where it may differentiate", positioning.whereItMayDifferentiate],
    ["Where it is exposed", positioning.whereItIsExposed],
    ["Likely buyer", positioning.likelyBuyer],
    ["Strategic wedge", positioning.strategicWedge]
  ];

  return (
    <SectionFrame title="Company positioning">
      <div className={`${panelClass} grid gap-0 md:grid-cols-[1.2fr_0.8fr]`}>
        <div>
          {rows.map(([label, value]) => (
            <div key={label} className="border-b border-black/20 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-deepOrange">
                {label}
              </p>
              <p className="mt-1 text-sm leading-6">{value}</p>
            </div>
          ))}
        </div>
        <div className="relative min-h-64 border-t border-black p-4 md:border-l md:border-t-0">
          <div className="absolute left-4 right-4 top-1/2 border-t border-black" />
          <div className="absolute bottom-4 top-4 left-1/2 border-l border-black" />
          <div className="absolute right-10 top-10 border border-black bg-deepOrange px-3 py-2 text-xs font-black shadow-hard">
            Strategic
          </div>
          <div className="absolute bottom-10 left-8 border border-black bg-white px-3 py-2 text-xs font-black shadow-hard">
            Emerging
          </div>
          <p className="absolute bottom-3 right-4 text-[10px] font-black uppercase tracking-[0.16em] text-muted">
            Positioning axis
          </p>
        </div>
      </div>
    </SectionFrame>
  );
}

export function OpportunityPanel({ entity }: { entity: ResearchEntity }) {
  const blocks = [
    ["Commercial opportunity", entity.dossier.opportunity.commercial],
    ["Government opportunity", entity.dossier.opportunity.government],
    ["Technical opportunity", entity.dossier.opportunity.technical],
    ["Strategic partnership opportunity", entity.dossier.opportunity.partnerships]
  ];

  return (
    <SectionFrame title="Opportunity">
      <div className="grid gap-4 sm:grid-cols-2">
        {blocks.map(([title, items]) => (
          <div key={title as string} className={`${panelClass} p-4`}>
            <h3 className="mb-3 text-sm font-black">{title as string}</h3>
            <BulletList items={items as string[]} />
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

export function ScenarioScroller({ entity }: { entity: ResearchEntity }) {
  return (
    <SectionFrame title="Scenarios / what happens next">
      <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-3">
        {entity.dossier.scenarios.map((scenario) => (
          <article
            key={scenario.title}
            className="min-w-[280px] max-w-[320px] border border-black bg-white p-4 shadow-hard"
          >
            <p className={labelClass}>{scenario.title}</p>
            <div className="mt-4 space-y-3 text-sm leading-6">
              <p>
                <span className="font-black">What happens: </span>
                {scenario.whatHappens}
              </p>
              <p>
                <span className="font-black">What must be true: </span>
                {scenario.whatMustBeTrue}
              </p>
              <p>
                <span className="font-black">Key risk: </span>
                {scenario.keyRisk}
              </p>
              <p>
                <span className="font-black">Investor read: </span>
                {scenario.investorRead}
              </p>
            </div>
          </article>
        ))}
      </div>
    </SectionFrame>
  );
}

export function MembersOnlyBlock({
  title,
  items,
  intro
}: {
  title: string;
  items: string[];
  intro?: string;
}) {
  return (
    <section className="border-t border-black/20 py-8">
      <div className="border border-black bg-offWhite shadow-hard">
        <div className="flex items-center justify-between gap-4 border-b border-black bg-white px-4 py-3">
          <div>
            <p className={labelClass}>Members Only</p>
            <h2 className="mt-1 text-2xl font-black leading-tight">{title}</h2>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-black bg-deepOrange">
            <Lock size={18} />
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <p className="max-w-2xl text-sm font-bold leading-6 text-ink/82">
            {intro ??
              `${title} is available to institutional users. The preview below shows the diligence categories included in the locked research block.`}
          </p>
          <div className="mt-4 border-l-4 border-deepOrange bg-white p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-muted">
              Preview
            </p>
            <BulletList items={items.slice(0, 5)} />
          </div>
          <Link
            href="/join"
            className="mt-5 inline-flex items-center justify-center gap-2 border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard"
          >
            Request Institutional Access
            <ArrowRight size={14} />
          </Link>
          <p className="mt-4 text-xs leading-5 text-muted">
            Institutional access includes founder analysis, investor read,
            revenue scenarios, traction signals, and commercialization risk
            modeling.
          </p>
        </div>
      </div>
    </section>
  );
}

export function InvestorReadSection({ entity }: { entity: ResearchEntity }) {
  return (
    <MembersOnlyBlock
      title="Investor read"
      items={entity.dossier.investorRead}
      intro="Founder analysis, investor read, revenue scenarios, traction signals, and commercialization risk modeling are gated for institutional users."
    />
  );
}

export function FounderTeamSection({ entity }: { entity: ResearchEntity }) {
  return <MembersOnlyBlock title="Founders and team" items={entity.dossier.foundersAndTeam} />;
}

export function SeniorTeamSection({ entity }: { entity: ResearchEntity }) {
  return <MembersOnlyBlock title="Senior team" items={entity.dossier.seniorTeam} />;
}

export function TeamSignalSection({ entity }: { entity: ResearchEntity }) {
  return (
    <MembersOnlyBlock
      title="Team signal for investors"
      items={entity.dossier.teamSignalForInvestors}
    />
  );
}

export function CultureHealthSection({ entity }: { entity: ResearchEntity }) {
  return (
    <MembersOnlyBlock
      title="Culture and team health"
      items={entity.dossier.cultureAndTeamHealth}
    />
  );
}

export function HiringSignalSection({ entity }: { entity: ResearchEntity }) {
  return <MembersOnlyBlock title="Hiring signal" items={entity.dossier.hiringSignal} />;
}

export function TractionMetricsSection({ entity }: { entity: ResearchEntity }) {
  return (
    <MembersOnlyBlock title="Traction and metrics" items={entity.dossier.tractionAndMetrics} />
  );
}

export function SocialPRSignalSection({ entity }: { entity: ResearchEntity }) {
  return (
    <MembersOnlyBlock title="Social and PR signal" items={entity.dossier.socialAndPRSignal} />
  );
}

function RevenueScenarioChart({ paths }: { paths: RevenuePath[] }) {
  const data = paths.map((path, index) => ({
    name: path.path,
    score: [68, 74, 56, 44, 62][index] ?? 52
  }));

  return (
    <div className="h-64 border border-black bg-white p-3 shadow-hard">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid stroke="#E5E0D8" />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#0E0E0E" }} />
          <YAxis
            dataKey="name"
            type="category"
            width={110}
            tick={{ fontSize: 10, fill: "#0E0E0E" }}
          />
          <Tooltip />
          <Bar dataKey="score" fill="#FF5A00" stroke="#111111" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueUnitEconomicsTable({ entity }: { entity: ResearchEntity }) {
  return (
    <section className="border-t border-black/20 py-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center border border-black bg-deepOrange">
          <BarChart3 size={17} />
        </span>
        <div>
          <p className={labelClass}>Members Only</p>
          <h2 className="text-3xl font-black leading-tight">Revenue and unit economics</h2>
        </div>
      </div>
      <div className="space-y-5">
        <RevenueScenarioChart paths={entity.dossier.revenueAndUnitEconomics} />
        <div className="scrollbar-thin overflow-x-auto border border-black bg-white shadow-hard">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-ink text-white">
              <tr>
                {["Revenue Path", "What Must Be True", "Margin Potential", "Time Horizon", "Risk"].map(
                  (heading) => (
                    <th key={heading} className="border border-black px-3 py-2">
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {entity.dossier.revenueAndUnitEconomics.map((row) => (
                <tr key={row.path}>
                  <td className="border border-black px-3 py-3 font-black">{row.path}</td>
                  <td className="border border-black px-3 py-3">{row.whatMustBeTrue}</td>
                  <td className="border border-black px-3 py-3">{row.marginPotential}</td>
                  <td className="border border-black px-3 py-3">{row.timeHorizon}</td>
                  <td className="border border-black px-3 py-3">{row.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border border-black bg-offWhite p-4 shadow-hard">
          <p className="text-sm leading-6">
            The revenue model remains gated because actual pricing, revenue,
            margin, and deployment economics are not publicly confirmed.
          </p>
        </div>
      </div>
    </section>
  );
}

export function ScenarioTextSection({
  title,
  items,
  membersOnly = true
}: {
  title: string;
  items: string[];
  membersOnly?: boolean;
}) {
  if (membersOnly) {
    return <MembersOnlyBlock title={title} items={items} />;
  }

  return (
    <SectionFrame title={title}>
      <TextList items={items} />
    </SectionFrame>
  );
}

export function RisksConstraintsSection({ entity }: { entity: ResearchEntity }) {
  return (
    <SectionFrame title="Risks and constraints">
      <div className={panelClass}>
        <div className="grid gap-0 sm:grid-cols-2">
          {entity.dossier.risksAndConstraints.map((risk) => (
            <div key={risk} className="border-b border-black/20 p-4 sm:border-r">
              <p className="text-sm leading-6">{risk}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

export function StrategicOutlookSection({ entity }: { entity: ResearchEntity }) {
  return (
    <SectionFrame title="Strategic outlook">
      <TextList items={entity.dossier.strategicOutlook} />
    </SectionFrame>
  );
}

export function DossierSourcesBlock({ sources }: { sources: Source[] }) {
  return (
    <SectionFrame title="Sources">
      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.url} className={`${panelClass} p-4`}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
              {source.type}
            </p>
            <h3 className="mt-1 text-base font-black">{source.title}</h3>
            <p className="mt-1 text-xs leading-5 text-muted">
              {source.publisher ?? "Unknown publisher"}
              {source.date ? ` · ${source.date}` : ""}
            </p>
            <a
              href={source.url}
              className="mt-2 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-deepOrange underline"
            >
              Open source
              <ExternalLinkIcon size={12} />
            </a>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}

export function RelatedResearchGrid({ entity }: { entity: ResearchEntity }) {
  return (
    <SectionFrame title="Related research">
      <div className="grid gap-4 sm:grid-cols-2">
        {entity.dossier.relatedResearch.map((item) => (
          <Link
            href={`/startup/${item.slug}`}
            key={item.slug}
            className="block border border-black bg-white p-4 shadow-hard hover:bg-paleOrange"
          >
            <p className={labelClass}>{item.sector}</p>
            <h3 className="mt-2 text-xl font-black">{item.name}</h3>
            <p className="mt-2 text-sm leading-6 text-charcoal">{item.summary}</p>
          </Link>
        ))}
      </div>
    </SectionFrame>
  );
}
