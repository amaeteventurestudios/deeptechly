import Link from "next/link";
import { Cpu, ArrowRight, UserPlus } from "lucide-react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { PasswordSuggestionField } from "@/components/auth/PasswordSuggestionField";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Institutional Access | DeepTechly",
  description: "Request institutional or research access to DeepTechly's full dossier and intelligence platform."
};

type JoinPageProps = {
  searchParams: Promise<{ error?: string; access?: string }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { error, access } = await searchParams;

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
          <div className="grid gap-6 md:grid-cols-2">
            <form
              action="/api/auth/join"
              className="border border-black bg-white p-6 shadow-hard"
              method="post"
            >
              <input name="accessPath" type="hidden" value="research" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
                Research Access
              </p>
              <h2 className="mt-2 text-2xl font-black">Create research account</h2>
              <p className="mt-2 text-sm leading-6 text-charcoal">
                Free account access for public research workflows and saved
                queue state.
              </p>
              {error && (!access || access === "research") ? (
                <p className="mt-4 border border-black bg-paleOrange px-3 py-2 text-xs font-bold text-ink">
                  {getErrorMessage(error)}
                </p>
              ) : null}
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">
                    Full Name
                  </span>
                  <input
                    className="mt-2 w-full border border-black bg-offWhite px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
                    name="fullName"
                    required
                    type="text"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">
                    Email
                  </span>
                  <input
                    className="mt-2 w-full border border-black bg-offWhite px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
                    name="email"
                    required
                    type="email"
                  />
                </label>
                <PasswordSuggestionField
                  label="Password"
                  minLength={8}
                  name="password"
                />
              </div>
              <AuthSubmitButton
                className="mt-6 flex w-full items-center justify-between border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-darkOrange"
                pendingLabel="Creating Account..."
              >
                Create Research Account
                <UserPlus size={14} />
              </AuthSubmitButton>
            </form>

            <form
              action="/api/auth/join"
              className="border border-black bg-ink p-6 text-white shadow-hard"
              method="post"
            >
              <input name="accessPath" type="hidden" value="institutional" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
                Institutional Access
              </p>
              <h2 className="mt-2 text-2xl font-black">Request institutional access</h2>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Verification path for dossier analysis, scenario models, and
                institutional intelligence features.
              </p>
              {error && access === "institutional" ? (
                <p className="mt-4 border border-deepOrange bg-white px-3 py-2 text-xs font-bold text-ink">
                  {getErrorMessage(error)}
                </p>
              ) : null}
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
                    Full Name
                  </span>
                  <input
                    className="mt-2 w-full border border-white bg-white px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
                    name="fullName"
                    required
                    type="text"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
                    Organization
                  </span>
                  <input
                    className="mt-2 w-full border border-white bg-white px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
                    name="organization"
                    type="text"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
                    Work Email
                  </span>
                  <input
                    className="mt-2 w-full border border-white bg-white px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
                    name="workEmail"
                    required
                    type="email"
                  />
                </label>
                <PasswordSuggestionField
                  inputClassName="mt-2 w-full border border-white bg-white px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
                  label="Password"
                  labelClassName="text-[10px] font-black uppercase tracking-[0.18em] text-white"
                  minLength={8}
                  name="password"
                />
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
                    Invite Code
                  </span>
                  <input
                    className="mt-2 w-full border border-white bg-white px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
                    name="inviteCode"
                    type="text"
                  />
                </label>
              </div>
              <AuthSubmitButton
                className="mt-6 flex w-full items-center justify-between border border-deepOrange bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-ink shadow-hard hover:bg-darkOrange"
                pendingLabel="Requesting Access..."
              >
                Request Institutional Access
                <ArrowRight size={14} />
              </AuthSubmitButton>
            </form>
          </div>

          <p className="mt-6 text-center text-[10px] font-black uppercase tracking-[0.16em] text-muted">
            Already a member?{" "}
            <Link className="text-deepOrange" href="/sign-in">
              Sign in
            </Link>
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
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

function getErrorMessage(error: string) {
  if (error === "config") {
    return "Supabase authentication or profile persistence is not configured in this environment.";
  }

  if (error === "signup") {
    return "Supabase could not create that account. Try signing in if you already joined.";
  }

  if (error === "profile") {
    return "The account was not completed because the profile row could not be saved.";
  }

  if (error === "invite") {
    return "The invite code could not be checked. You can retry or request access without a code.";
  }

  return "Complete the required fields to continue.";
}
