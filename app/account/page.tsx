import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LogOut } from "lucide-react";
import { AdminToolsPanel } from "@/components/admin/AdminToolsPanel";
import { ProfileSettings } from "@/components/account/ProfileSettings";
import { PageShell } from "@/components/layout/PageShell";
import { isAdminEmail } from "@/lib/admin/invite-codes";
import { getAuthSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account | DeepTechly",
  description: "DeepTechly profile and access state."
};

export default async function AccountPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/sign-in?redirectTo=/account");
  }

  const profile = session.profile;
  const accessAction = getAccessAction(session);
  const isAdmin = isAdminEmail(session.email);
  const verification = session.isInstitutionalVerified
    ? "Verified"
    : session.institutionalRequestPending
      ? "Pending Review"
      : "Not Verified";

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white">
            Account
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] text-white sm:text-6xl">
            Profile and access state.
          </h1>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <ProfileSettings
            initialProfile={{
              fullName: session.name ?? "",
              email: session.email,
              organization: profile?.organization ?? "",
              accessLevel: formatAccessTier(session.accessTier),
              verification,
              accountCreated: profile?.created_at
                ? formatDate(profile.created_at)
                : "Unknown"
            }}
          />

          <aside className="space-y-4">
            {isAdmin ? <AdminToolsPanel /> : null}
            <section className="border border-black bg-white p-5 shadow-hard">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                Next Action
              </p>
              <h2 className="mt-2 text-xl font-black leading-tight">
                {accessAction.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-charcoal">
                {accessAction.body}
              </p>
              <Link
                href={accessAction.href}
                className="mt-4 flex min-h-12 items-center justify-between border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-darkOrange"
              >
                {accessAction.cta}
                <ArrowRight size={14} />
              </Link>
            </section>
            <Link
              href="/dashboard"
              className="flex min-h-12 items-center justify-between border border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-paleOrange"
            >
              Dashboard
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/research"
              className="flex min-h-12 items-center justify-between border border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-paleOrange"
            >
              Queue Research
              <ArrowRight size={14} />
            </Link>
            <form action="/api/auth/sign-out" method="post">
              <button
                className="flex min-h-12 w-full items-center justify-between border border-black bg-ink px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-hard hover:bg-charcoal"
                type="submit"
              >
                Sign Out
                <LogOut size={14} />
              </button>
            </form>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function getAccessAction(session: {
  isInstitutionalVerified: boolean;
  institutionalRequestPending: boolean;
}) {
  if (session.isInstitutionalVerified) {
    return {
      title: "Institutional access verified.",
      body: "Open your dashboard or public profiles to continue into unlocked dossier sections.",
      cta: "Open Dashboard",
      href: "/dashboard"
    };
  }

  if (session.institutionalRequestPending) {
    return {
      title: "Institutional review pending.",
      body: "Your request is under review. Public research, saved items, and the research queue remain available.",
      cta: "View Pricing",
      href: "/pricing"
    };
  }

  return {
    title: "Request institutional review.",
    body: "Free accounts can request verified access when investor-grade dossier sections are needed.",
    cta: "Request Access",
    href: "/join?access=institutional"
  };
}

function formatAccessTier(value: string) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
