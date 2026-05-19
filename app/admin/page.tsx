import Link from "next/link";
import type { ReactNode } from "react";
import { forbidden, redirect } from "next/navigation";
import {
  ArrowRight,
  FileText,
  KeyRound,
  ListChecks,
  ShieldAlert,
  Users
} from "lucide-react";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import {
  ResearchPipelineChart,
  UserInviteActivityChart
} from "@/components/admin/AdminOverviewCharts";
import { PageShell } from "@/components/layout/PageShell";
import { getAdminOverviewData, type AdminMetric } from "@/lib/admin/overview";
import { isAdminEmail } from "@/lib/admin/invite-codes";
import { displayAdminStoredValue } from "@/lib/admin/users";
import { getAuthSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Control Center | DeepTechly Admin",
  description: "DeepTechly admin overview, metrics, and operational controls."
};

type AdminPageProps = {
  searchParams: Promise<{
    range?: string;
  }>;
};

const toolCards = [
  {
    title: "Content Review",
    description:
      "Review generated articles, profiles, dossiers, source records, and publishing state.",
    cta: "Open Content",
    href: "/admin/content",
    icon: FileText
  },
  {
    title: "Users",
    description:
      "View users, access levels, verification state, and admin-controlled account status.",
    cta: "Open Users",
    href: "/admin/users",
    icon: Users
  },
  {
    title: "Invite Codes",
    description: "Create and manage institutional invite codes.",
    cta: "Open Invite Codes",
    href: "/admin/invite-codes",
    icon: KeyRound
  },
  {
    title: "Research Queue",
    description: "Monitor submitted research jobs and publishing status.",
    cta: "Open Queue",
    href: "/research",
    icon: ListChecks
  }
];

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/sign-in?redirectTo=/admin");
  }

  if (!isAdminEmail(session.email)) {
    forbidden();
  }

  const params = await searchParams;
  const range = parseRange(params.range);
  const overview = await getAdminOverviewData({ windowDays: range });

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            DeepTechly Admin
          </p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.92] sm:text-6xl">
                DeepTechly control center
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-ink/82">
                Manage research content, users, institutional access, and
                invite-code operations.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <AdminNavigation active="overview" />
              <div className="border border-black bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] shadow-hard">
                Signed in as {session.email}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <section className="grid grid-cols-1 gap-px border border-black bg-black sm:grid-cols-2 lg:grid-cols-4">
            {overview.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <GraphCard
              label="Research Pipeline"
              title="Jobs by status"
              footer="Queued, running, failed, and published jobs from stored research activity."
            >
              <ResearchPipelineChart data={overview.pipeline} />
            </GraphCard>
            <GraphCard
              action={<RangeSwitch active={overview.activityWindow} />}
              label="User + Invite Activity"
              title="Account activity"
              footer={
                overview.inviteRedemptionsStored
                  ? "Invite-code redemptions are included where stored."
                  : "Invite-code redemptions: Not stored"
              }
            >
              <UserInviteActivityChart data={overview.activity} />
            </GraphCard>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <PendingReviewPanel overview={overview} />
            <QuickActionsPanel />
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <RecentActivityPanel message={overview.recentActivity.message} />
            <AdminToolCards />
          </section>
        </div>
      </section>
    </PageShell>
  );
}

function MetricCard({ metric }: { metric: AdminMetric }) {
  return (
    <article className="min-h-[132px] bg-white p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-deepOrange">
        {metric.label}
      </p>
      <p className="mt-4 break-words text-3xl font-black leading-none text-ink">
        {metric.value}
      </p>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
        {metric.detail}
      </p>
    </article>
  );
}

function GraphCard({
  action,
  children,
  footer,
  label,
  title
}: {
  action?: ReactNode;
  children: ReactNode;
  footer: string;
  label: string;
  title: string;
}) {
  return (
    <section className="border border-black bg-white p-5 shadow-hard">
      <div className="mb-4 flex flex-col gap-3 border-b border-black pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
            {label}
          </p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-ink">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
        {footer}
      </p>
    </section>
  );
}

function RangeSwitch({ active }: { active: 7 | 30 | 90 }) {
  return (
    <div className="flex flex-wrap gap-1">
      {([7, 30, 90] as const).map((range) => (
        <Link
          className={`inline-flex min-h-8 items-center border border-black px-2.5 text-[10px] font-black uppercase tracking-[0.12em] ${
            active === range
              ? "bg-ink text-white"
              : "bg-offWhite text-ink hover:bg-paleOrange"
          }`}
          href={`/admin?range=${range}`}
          key={range}
        >
          {range}D
        </Link>
      ))}
    </div>
  );
}

function PendingReviewPanel({
  overview
}: {
  overview: Awaited<ReturnType<typeof getAdminOverviewData>>;
}) {
  return (
    <section className="border border-black bg-white p-5 shadow-hard">
      <div className="flex flex-col gap-3 border-b border-black pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
            Pending Review
          </p>
          <h2 className="mt-1 text-2xl font-black leading-tight">
            Institutional access requests
          </h2>
        </div>
        <Link
          className="inline-flex min-h-10 items-center gap-2 border border-black bg-offWhite px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] hover:bg-paleOrange"
          href="/admin/users"
        >
          Open Users
          <ArrowRight size={13} />
        </Link>
      </div>

      {overview.pendingReviews.status === "not_stored" ? (
        <EmptyAdminPanel message={overview.pendingReviews.message} />
      ) : overview.pendingReviews.users.length === 0 ? (
        <EmptyAdminPanel message="No institutional requests pending." />
      ) : (
        <div className="mt-4 divide-y divide-black/15">
          {overview.pendingReviews.users.map((user) => (
            <article className="py-4 first:pt-0 last:pb-0" key={user.id}>
              <p className="font-black text-ink">
                {displayAdminStoredValue(user.fullName)}
              </p>
              <p className="mt-1 text-sm font-semibold text-charcoal">
                {user.email}
              </p>
              <dl className="mt-3 grid gap-2 text-xs font-bold sm:grid-cols-2">
                <ReviewFact
                  label="Organization"
                  value={displayAdminStoredValue(user.organization)}
                />
                <ReviewFact label="Signup Date" value={formatDate(user.createdAt)} />
                <ReviewFact label="Requested Access" value={formatTier(user.accessTier)} />
                <ReviewFact label="Status" value="Pending review" />
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function QuickActionsPanel() {
  return (
    <section className="border border-black bg-ink p-5 text-white shadow-hard">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
        Quick Actions
      </p>
      <h2 className="mt-2 text-2xl font-black leading-tight">Admin shortcuts</h2>
      <div className="mt-5 grid gap-3">
        <QuickAction href="/admin/invite-codes" label="Create Invite Code" />
        <QuickAction href="/admin/users" label="Open User List" />
        <QuickAction href="/admin/content" label="Review Content" />
        <QuickAction href="/research" label="View Research Queue" />
      </div>
    </section>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="flex min-h-11 items-center justify-between border border-deepOrange bg-deepOrange px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-ink hover:bg-darkOrange"
      href={href}
    >
      {label}
      <ArrowRight size={13} />
    </Link>
  );
}

function RecentActivityPanel({ message }: { message: string }) {
  return (
    <section className="border border-black bg-white p-5 shadow-hard">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
        Recent Activity
      </p>
      <h2 className="mt-2 text-2xl font-black leading-tight">
        Operational events
      </h2>
      <EmptyAdminPanel message={message} />
    </section>
  );
}

function AdminToolCards() {
  return (
    <section className="border border-black bg-white p-5 shadow-hard">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
        Admin Tools
      </p>
      <h2 className="mt-2 text-2xl font-black leading-tight">
        Control surfaces
      </h2>
      <div className="mt-5 grid gap-px border border-black bg-black sm:grid-cols-2">
        {toolCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="flex min-h-[210px] flex-col bg-white p-4" key={card.href}>
              <span className="flex h-9 w-9 items-center justify-center border border-black bg-offWhite text-deepOrange">
                <Icon size={17} />
              </span>
              <h3 className="mt-4 text-xl font-black leading-tight">
                {card.title}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-charcoal">
                {card.description}
              </p>
              <Link
                className="mt-auto inline-flex min-h-10 items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] hover:text-deepOrange"
                href={card.href}
              >
                {card.cta}
                <ArrowRight size={13} />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function EmptyAdminPanel({ message }: { message: string }) {
  return (
    <div className="mt-4 border border-black bg-offWhite p-4">
      <p className="flex items-center gap-2 text-sm font-bold leading-6 text-charcoal">
        <ShieldAlert className="shrink-0 text-deepOrange" size={16} />
        {message}
      </p>
    </div>
  );
}

function ReviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] font-black uppercase tracking-[0.16em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words font-black text-ink">{value}</dd>
    </div>
  );
}

function parseRange(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (parsed === 7 || parsed === 90) return parsed;
  return 30;
}

function formatTier(tier: string) {
  return tier
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not stored";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}
