import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookmarkCheck,
  Building2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  UserRound
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { getAuthSession } from "@/lib/auth/session";
import { listSavedResearchItems } from "@/lib/saved-research";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | DeepTechly",
  description: "DeepTechly saved research and account state."
};

export default async function DashboardPage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/sign-in?redirectTo=/dashboard");
  }

  const savedResearch = await listSavedResearchItems(session.userId, 6);
  const profile = session.profile;
  const displayName = session.name ?? session.email;
  const institutionalStatus = getInstitutionalStatus(session);
  const nextAction = getNextAction(session);

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white">
            Research Dashboard
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.92] text-white sm:text-6xl">
            Your saved DeepTechly research.
          </h1>
          <p className="mt-5 max-w-3xl text-base font-black leading-7 text-white/86">
            Track saved articles, profiles, and signals while keeping your
            account state visible.
          </p>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-px border border-black bg-black sm:grid-cols-2 lg:grid-cols-4">
              <DashboardMetric
                icon={<UserRound size={17} />}
                label="User"
                value={displayName}
              />
              <DashboardMetric
                icon={<BookmarkCheck size={17} />}
                label="Saved Queue"
                value={`${savedResearch.count}`}
              />
              <DashboardMetric
                icon={<Building2 size={17} />}
                label="Access"
                value={formatAccessTier(session.accessTier)}
              />
              <DashboardMetric
                icon={institutionalStatus.icon}
                label="Institutional"
                value={institutionalStatus.label}
              />
            </div>

            <section className="border border-black bg-white p-5 shadow-hard">
              <div className="flex flex-col gap-3 border-b border-black pb-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                    Saved Research Queue
                  </p>
                  <h2 className="mt-2 text-2xl font-black leading-tight text-ink">
                    Recent saved items
                  </h2>
                </div>
                <Link
                  href="/research"
                  className="inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] hover:bg-deepOrange"
                >
                  Queue Research
                  <ArrowRight size={13} />
                </Link>
              </div>

              {savedResearch.unavailable ? (
                <p className="mt-5 border border-black bg-paleOrange p-4 text-sm font-bold leading-6">
                  Saved research storage is not available yet. Apply
                  `supabase/saved-research.sql` in Supabase to enable
                  persistent saved queues.
                </p>
              ) : savedResearch.items.length === 0 ? (
                <div className="mt-5 border border-black bg-offWhite p-5 text-center sm:text-left">
                  <p className="text-sm font-bold leading-6">
                    No saved items yet. Use the star controls on the homepage,
                    newsstand, or research queue to build your saved shelf.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid grid-cols-1 gap-px border border-black bg-black md:grid-cols-2">
                  {savedResearch.items.map((item) => (
                    <article
                      key={item.id}
                      className="flex min-h-[150px] flex-col bg-white p-4"
                    >
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-deepOrange">
                        {item.item_type} {item.sector ? `· ${item.sector}` : ""}
                      </p>
                      <h3 className="mt-2 text-lg font-black leading-tight text-ink">
                        <Link href={item.href}>{item.title}</Link>
                      </h3>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                        Saved {formatDate(item.updated_at)}
                      </p>
                      <Link
                        href={item.href}
                        className="mt-auto inline-flex min-h-9 items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] hover:text-deepOrange"
                      >
                        Open Item
                        <ArrowRight size={12} />
                      </Link>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="border border-black bg-ink p-5 text-white shadow-hard">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                Next Action
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight">
                {nextAction.title}
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/72">
                {nextAction.body}
              </p>
              <Link
                href={nextAction.href}
                className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 border border-deepOrange bg-deepOrange px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-ink hover:bg-darkOrange"
              >
                {nextAction.cta}
                <ArrowRight size={13} />
              </Link>
            </section>

            <section className="border border-black bg-white p-5 shadow-hard">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                Account State
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <ProfileFact label="Full Name" value={displayName} />
                <ProfileFact label="Email" value={session.email} />
                <ProfileFact
                  label="Organization"
                  value={profile?.organization ?? "Not provided"}
                />
                <ProfileFact
                  label="Access Level"
                  value={formatAccessTier(session.accessTier)}
                />
                <ProfileFact
                  label="Verification"
                  value={institutionalStatus.label}
                />
              </dl>
              <Link
                href="/account"
                className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-black bg-offWhite px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] hover:bg-paleOrange"
              >
                Open Account
                <ArrowRight size={13} />
              </Link>
            </section>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function DashboardMetric({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white p-4 text-center sm:text-left">
      <span className="mx-auto flex h-8 w-8 items-center justify-center border border-black bg-offWhite text-deepOrange sm:mx-0">
        {icon}
      </span>
      <p className="mt-3 text-[9px] font-black uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-lg font-black leading-tight text-ink">
        {value}
      </p>
    </div>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-black/10 pb-2 last:border-b-0">
      <dt className="text-[9px] font-black uppercase tracking-[0.16em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words font-black text-ink">{value}</dd>
    </div>
  );
}

function getInstitutionalStatus(session: {
  isInstitutionalVerified: boolean;
  institutionalRequestPending: boolean;
}) {
  if (session.isInstitutionalVerified) {
    return {
      label: "Verified",
      icon: <CheckCircle2 size={17} />
    };
  }

  if (session.institutionalRequestPending) {
    return {
      label: "Pending Review",
      icon: <Clock3 size={17} />
    };
  }

  return {
    label: "Not Verified",
    icon: <CircleAlert size={17} />
  };
}

function getNextAction(session: {
  isInstitutionalVerified: boolean;
  institutionalRequestPending: boolean;
}) {
  if (session.isInstitutionalVerified) {
    return {
      title: "Open institutional dossiers.",
      body: "Your account is verified for institutional analysis. Continue into saved items or open dossier pages from research profiles.",
      cta: "Browse Dossiers",
      href: "/startups"
    };
  }

  if (session.institutionalRequestPending) {
    return {
      title: "Institutional review is pending.",
      body: "You can keep saving public research while DeepTechly reviews institutional access.",
      cta: "Save More Research",
      href: "/news"
    };
  }

  return {
    title: "Build your public research shelf.",
    body: "Free accounts can save public articles, profiles, signals, and queue new research. Institutional analysis remains locked.",
    cta: "Browse Newsstand",
    href: "/news"
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
