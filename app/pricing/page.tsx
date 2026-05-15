import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Pricing | DeepTechly",
  description:
    "DeepTechly pricing for public research, analyst tools, institutional dossiers, and enterprise intelligence."
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    summary: "Public research and AI-readable deep-tech profiles.",
    features: [
      "Public articles",
      "Public profiles",
      "Basic research queue",
      "Public dossier snapshots",
      "Markdown access"
    ],
    href: "/join?access=research",
    cta: "Create research account",
    highlight: false
  },
  {
    name: "Analyst",
    price: "$49/month",
    summary:
      "Research tools for founders, operators, analysts, and technical scouts.",
    features: [
      "Saved watchlists",
      "Research alerts",
      "Deep reports",
      "PDF exports",
      "Startup comparisons",
      "Patent monitoring"
    ],
    href: "/join?access=research",
    cta: "Join analyst waitlist",
    highlight: false
  },
  {
    name: "Institutional",
    price: "$499/month",
    summary:
      "Investor-grade intelligence for funds, corporate innovation teams, primes, and strategic operators.",
    features: [
      "Revenue projections",
      "Risk modeling",
      "Scenario analysis",
      "Investor dossiers",
      "TRL / MRL analysis",
      "Government relevance mapping",
      "Manufacturing constraints",
      "Commercialization scenarios"
    ],
    href: "/join?access=institutional",
    cta: "Request institutional access",
    highlight: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    summary: "Custom intelligence infrastructure for teams.",
    features: [
      "Team access",
      "API",
      "Private datasets",
      "Custom workflows",
      "Strategic intelligence"
    ],
    href: "mailto:enterprise@deeptechly.com",
    cta: "Request enterprise access",
    highlight: false
  }
] as const;

export default function PricingPage() {
  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Access Tiers
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Public research stays open. Institutional analysis requires verification.
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-ink/82">
            DeepTechly supports free public research accounts, analyst tooling,
            verified institutional dossier access, and custom enterprise
            intelligence infrastructure.
          </p>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-2 xl:grid-cols-4 lg:px-8">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`flex min-h-full flex-col border border-black p-5 shadow-hard ${
                tier.highlight ? "bg-ink text-white" : "bg-white text-ink"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-deepOrange">
                {tier.name}
              </p>
              <p className="mt-3 text-3xl font-black">{tier.price}</p>
              <p
                className={`mt-3 text-sm font-semibold leading-6 ${
                  tier.highlight ? "text-white/74" : "text-charcoal"
                }`}
              >
                {tier.summary}
              </p>
              <ul className="mt-5 space-y-2">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex gap-2 text-sm leading-5 ${
                      tier.highlight ? "text-white/82" : "text-charcoal"
                    }`}
                  >
                    <span className="font-black text-deepOrange">-</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={`mt-auto flex min-h-12 items-center justify-between gap-3 border px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] ${
                  tier.highlight
                    ? "border-deepOrange bg-deepOrange text-ink hover:bg-darkOrange"
                    : "border-black bg-offWhite hover:bg-paleOrange"
                }`}
              >
                {tier.cta}
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
