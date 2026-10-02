import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Methodology | DeepTechly",
  description: "How DeepTechly researches, verifies, and publishes institutional-grade deep-tech intelligence."
};

const stages = [
  {
    number: "01",
    label: "Entity Resolution",
    description:
      "DeepTechly identifies whether a submitted query is a company, patent, lab, technology, or government program. It confirms the official domain and resolves aliases before proceeding."
  },
  {
    number: "02",
    label: "Public Source Discovery",
    description:
      "A structured web search collects the official website, technical documentation, news coverage, patent filings, government records, job postings, academic publications, and third-party references."
  },
  {
    number: "03",
    label: "Deep Page Reading",
    description:
      "Homepages, about pages, product and technology pages, careers, and press pages are read in full. Metadata, internal links, and key claims are extracted."
  },
  {
    number: "04",
    label: "Fact Distillation",
    description:
      "Structured facts are extracted from source material: technology description, funding stage, founding date, team size, key personnel, headquarters, patents, customers, and government relationships."
  },
  {
    number: "05",
    label: "Gap-Filling and Verification",
    description:
      "Targeted follow-up searches address missing fields. Key claims — funding amounts, customer names, government contracts, team credentials — are cross-referenced across multiple sources."
  },
  {
    number: "06",
    label: "Technology Stack Mapping",
    description:
      "The product architecture, materials stack, software environment, hardware platform, and deployment model are mapped from technical documentation and source signals."
  },
  {
    number: "07",
    label: "Readiness Estimation",
    description:
      "Technology Readiness Level (TRL) and Manufacturing Readiness Level (MRL) are estimated from deployment signals, public test data, certifications, and market entry stage."
  },
  {
    number: "08",
    label: "Government and Defense Signal Mapping",
    description:
      "DARPA programs, SBIR/STTR awards, NASA contracts, DoD relationships, Space Force partnerships, and DOE programs are identified and cross-referenced against public databases."
  },
  {
    number: "09",
    label: "Parallel Output Drafting",
    description:
      "Three outputs are written simultaneously: a public feature article, a structured research profile, and a full institutional investor dossier. Each is attributed to the appropriate DeepTechly analyst persona."
  },
  {
    number: "10",
    label: "Confidence Scoring",
    description:
      "A confidence label (High / Medium / Preliminary) is assigned based on source count, source diversity, cross-reference depth, and recency. Low-confidence records are flagged or held from publication."
  }
];

const signals = [
  "Technology Readiness Level (TRL 1–9)",
  "Manufacturing Readiness Level (MRL 1–10)",
  "Funding stage and capital structure",
  "Government contract and program relationships",
  "Patent portfolio and IP position",
  "Founder and senior team credentials",
  "Hiring signals and open roles",
  "Revenue and traction indicators",
  "Competitive landscape positioning",
  "Customer and partner references",
  "Regulatory and certification status",
  "Strategic risk and deployment constraints"
];

export default function MethodologyPage() {
  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Methodology
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            How DeepTechly researches.
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-ink/82">
            Every published profile is the output of a structured, multi-stage
            research pipeline. No hallucinated data. No unverified claims.
          </p>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-[11px] font-black uppercase tracking-[0.28em] text-deepOrange">
            Research Pipeline
          </h2>
          <div className="space-y-0">
            {stages.map((stage, index) => (
              <div
                key={stage.number}
                className={`grid gap-4 border-t border-black py-6 sm:grid-cols-[64px_1fr] ${
                  index === stages.length - 1 ? "border-b" : ""
                }`}
              >
                <span className="text-3xl font-black text-deepOrange/40">
                  {stage.number}
                </span>
                <div>
                  <h3 className="text-base font-black uppercase tracking-[0.12em]">
                    {stage.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-charcoal">
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-t border-black bg-ink text-white">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-[11px] font-black uppercase tracking-[0.28em] text-deepOrange">
            Structured Signals Extracted
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {signals.map((signal) => (
              <div
                key={signal}
                className="border border-white/20 bg-white/5 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white/80"
              >
                {signal}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-t border-black bg-offWhite">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
            Accuracy &amp; Limitations
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-charcoal">
            DeepTechly research is generated from public sources only. Confidence
            labels reflect the depth and cross-reference quality of available
            source material — not direct company disclosure. All published research
            should be treated as a starting point for diligence, not a definitive
            data source. DeepTechly is not investment advice.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 border border-black bg-deepOrange px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
            >
              Browse Research
              <ArrowRight size={13} />
            </Link>
            <Link
              href="/llms.txt"
              className="inline-flex items-center gap-2 border border-black bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
            >
              LLM Guide
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
