import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Pricing | DeepTechly",
  description:
    "DeepTechly pricing for public research, analyst tools, and institutional dossier access."
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    summary: "Public deep-tech research for readers, founders, and technical scouts.",
    features: [
      "Public articles",
      "Public profiles",
      "Basic research queue",
      "Public dossier snapshots",
      "Markdown access"
    ],
    href: "/research",
    cta: "Queue Research",
    highlight: false
  },
  {
    name: "Analyst",
    price: "$49/month",
    summary: "Research tools for operators, analysts, and technical market scouts.",
    features: [
      "Saved watchlists",
      "Research alerts",
      "Deep reports",
      "PDF exports",
      "Startup comparisons",
      "Patent monitoring"
    ],
    href: "/join",
    cta: "Request Analyst Access",
    highlight: true
  },
  {
    name: "Institutional",
    price: "$499/month",
    summary:
      "Investor-grade intelligence for funds, corporate teams, primes, and strategic operators.",
    features: [
      "Revenue projections",
      "Risk modeling",
      "Scenario analysis",
      "Investor dossiers",
      "TRL / MRL analysis",
      "Government relevance mapping"
    ],
    href: "/join",
    cta: "Request Institutional Access",
    highlight: false
  }
] as const;

export default function PricingPage() {
  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Pricing
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Research access that scales from public reading to institutional diligence.
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-ink/82">
            DeepTechly keeps public research open while reserving deeper investor,
            risk, and scenario work for analyst and institutional access.
          </p>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`border border-black p-6 shadow-hard ${
                tier.highlight ? "bg-ink text-white" : "bg-white text-ink"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-deepOrange">
                {tier.name}
              </p>
              <p className="mt-3 text-3xl font-black">{tier.price}</p>
              <p
                className={`mt-3 text-sm font-semibold leading-6 ${
                  tier.highlight ? "text-white/72" : "text-charcoal"
                }`}
              >
                {tier.summary}
              </p>
              <ul className="mt-5 space-y-2">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex gap-2 text-sm leading-5 ${
                      tier.highlight ? "text-white/78" : "text-charcoal"
                    }`}
                  >
                    <span className="font-black text-deepOrange">-</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={`mt-7 flex items-center justify-between border px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] ${
                  tier.highlight
                    ? "border-deepOrange bg-deepOrange text-ink hover:bg-darkOrange"
                    : "border-black bg-offWhite hover:bg-paleOrange"
                }`}
              >
                {tier.cta}
                <ArrowRight size={13} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
