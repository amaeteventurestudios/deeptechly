import Link from "next/link";
import { Cpu, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Institutional Access | DeepTechly",
  description: "Request institutional or research access to DeepTechly's full dossier and intelligence platform."
};

export default function JoinPage() {
  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Institutional Access
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Research-grade intelligence for serious institutions.
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-ink/82">
            Full investor dossiers, confidence scores, scenario analysis, and
            structured data exports. Built for VC, corporate development,
            government acquisition, and technical due diligence teams.
          </p>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                label: "Public Research",
                price: "Free",
                features: [
                  "Feature articles",
                  "Public profiles",
                  "Sector tags and readiness labels",
                  "Source citations",
                  "Markdown export"
                ],
                cta: "Browse Research",
                href: "/news",
                highlight: false
              },
              {
                label: "Institutional Dossier",
                price: "Request Access",
                features: [
                  "Full investor dossier",
                  "Confidence scoring",
                  "Scenario analysis (best / base / downside)",
                  "Team and hiring signals",
                  "Revenue and traction estimates",
                  "Competitive landscape",
                  "Strategic risk read"
                ],
                cta: "Request Access",
                href: "mailto:access@deeptechly.com",
                highlight: true
              },
              {
                label: "Enterprise",
                price: "Contact Us",
                features: [
                  "Bulk research queue",
                  "API access",
                  "Custom sector coverage",
                  "White-label exports",
                  "Dedicated analyst review"
                ],
                cta: "Get in Touch",
                href: "mailto:enterprise@deeptechly.com",
                highlight: false
              }
            ].map((tier) => (
              <div
                key={tier.label}
                className={`border border-black p-6 shadow-hard ${
                  tier.highlight ? "bg-ink text-white" : "bg-white text-ink"
                }`}
              >
                <p
                  className={`text-[10px] font-black uppercase tracking-[0.22em] ${
                    tier.highlight ? "text-deepOrange" : "text-deepOrange"
                  }`}
                >
                  {tier.label}
                </p>
                <p className="mt-2 text-2xl font-black">{tier.price}</p>
                <ul className="mt-4 space-y-2">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-start gap-2 text-sm leading-5 ${
                        tier.highlight ? "text-white/80" : "text-charcoal"
                      }`}
                    >
                      <span className="mt-0.5 shrink-0 font-black text-deepOrange">—</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`mt-6 flex items-center justify-between border px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] ${
                    tier.highlight
                      ? "border-deepOrange bg-deepOrange text-ink hover:bg-darkOrange"
                      : "border-black bg-offWhite hover:bg-paleOrange"
                  }`}
                >
                  {tier.cta}
                  <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-t border-black bg-offWhite">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center border border-deepOrange bg-deepOrange text-ink">
              <Cpu size={14} strokeWidth={2.6} />
            </span>
            <span className="text-sm font-black">DeepTechly</span>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-charcoal">
            All public research — articles, profiles, and markdown exports — is
            available without an account. Institutional access unlocks the full
            dossier layer.
          </p>
          <Link
            href="/news"
            className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-deepOrange"
          >
            Browse free research
            <ArrowRight size={12} />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
