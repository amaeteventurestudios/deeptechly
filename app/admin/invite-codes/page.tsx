import Link from "next/link";
import { Ban, CheckCircle2, KeyRound, Plus, ShieldAlert } from "lucide-react";
import { forbidden, redirect } from "next/navigation";
import { CopyInviteCodeButton } from "@/components/admin/CopyInviteCodeButton";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { PageShell } from "@/components/layout/PageShell";
import { getAuthSession } from "@/lib/auth/session";
import {
  getInviteCodeStatus,
  isAdminEmail,
  listInviteCodes,
  type InviteCodeRecord
} from "@/lib/admin/invite-codes";
import {
  createInviteCodeAction,
  disableInviteCodeAction
} from "./actions";

export const metadata = {
  title: "Invite Codes | DeepTechly Admin",
  description: "Manage DeepTechly institutional invite codes."
};

type InviteCodesPageProps = {
  searchParams: Promise<{
    created?: string;
    disabled?: string;
    error?: string;
  }>;
};

export default async function InviteCodesPage({
  searchParams
}: InviteCodesPageProps) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/sign-in?redirectTo=/admin/invite-codes");
  }

  if (!isAdminEmail(session.email)) {
    forbidden();
  }

  const [params, inviteCodesResult] = await Promise.all([
    searchParams,
    listInviteCodes()
  ]);

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Admin Console
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
                Invite-code management.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-ink/82">
                Issue institutional access with server-generated codes tied to
                a label, tier, use limit, and optional expiration.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <nav className="flex flex-wrap gap-2">
                <AdminNavLink href="/admin/content" label="Content" />
                <AdminNavLink href="/admin/users" label="Users" />
              </nav>
              <div className="border border-black bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.14em] shadow-hard">
                Signed in as {session.email}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.65fr)] lg:px-8">
          <div>
            <StatusMessage params={params} />
            <CreateInviteCodeForm />
          </div>

          <InviteCodeList result={inviteCodesResult} />
        </div>
      </section>
    </PageShell>
  );
}

function StatusMessage({
  params
}: {
  params: { created?: string; disabled?: string; error?: string };
}) {
  if (params.created) {
    return (
      <div className="mb-6 flex items-start gap-3 border border-black bg-white p-4 shadow-hard">
        <CheckCircle2 className="mt-0.5 shrink-0 text-deepOrange" size={18} />
        <p className="text-sm font-bold leading-6 text-ink">
          Created invite code{" "}
          <span className="font-mono">{params.created}</span>.
        </p>
      </div>
    );
  }

  if (params.disabled) {
    return (
      <div className="mb-6 flex items-start gap-3 border border-black bg-white p-4 shadow-hard">
        <Ban className="mt-0.5 shrink-0 text-deepOrange" size={18} />
        <p className="text-sm font-bold leading-6 text-ink">
          Disabled invite code{" "}
          <span className="font-mono">{params.disabled}</span>.
        </p>
      </div>
    );
  }

  if (params.error) {
    return (
      <div className="mb-6 flex items-start gap-3 border border-black bg-paleOrange p-4 shadow-hard">
        <ShieldAlert className="mt-0.5 shrink-0 text-ink" size={18} />
        <p className="text-sm font-bold leading-6 text-ink">
          {getErrorMessage(params.error)}
        </p>
      </div>
    );
  }

  return null;
}

function CreateInviteCodeForm() {
  return (
    <form
      action={createInviteCodeAction}
      className="border border-black bg-white p-6 shadow-hard"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center border border-black bg-deepOrange text-ink">
          <KeyRound size={18} />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
            New Code
          </p>
          <h2 className="text-2xl font-black">Create invite</h2>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">
            Label / Note
          </span>
          <input
            className="mt-2 w-full border border-black bg-offWhite px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
            name="label"
            placeholder="Institution, cohort, or internal note"
            required
            type="text"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">
            Access Tier
          </span>
          <select
            className="mt-2 w-full border border-black bg-offWhite px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
            defaultValue="institutional"
            name="accessTier"
            required
          >
            <option value="institutional">Institutional</option>
            <option value="enterprise">Enterprise</option>
            <option value="research">Research</option>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">
              Max Uses
            </span>
            <input
              className="mt-2 w-full border border-black bg-offWhite px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
              defaultValue={1}
              min={1}
              name="maxUses"
              required
              type="number"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">
              Expiration Date
            </span>
            <input
              className="mt-2 w-full border border-black bg-offWhite px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
              name="expiresAt"
              type="date"
            />
          </label>
        </div>
      </div>

      <AuthSubmitButton
        className="mt-6 flex w-full items-center justify-between border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-darkOrange"
        pendingLabel="Creating..."
      >
        Create Code
        <Plus size={14} />
      </AuthSubmitButton>
    </form>
  );
}

function InviteCodeList({
  result
}: {
  result:
    | Awaited<ReturnType<typeof listInviteCodes>>
    | { ok: false; reason: string };
}) {
  if (!result.ok) {
    return (
      <div className="border border-black bg-white p-6 shadow-hard">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
          Invite Codes
        </p>
        <h2 className="mt-2 text-2xl font-black">Unable to load codes</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-charcoal">
          {getErrorMessage(result.reason)}
        </p>
      </div>
    );
  }

  const inviteCodes = result.inviteCodes;

  return (
    <div className="border border-black bg-white shadow-hard">
      <div className="flex flex-col gap-3 border-b border-black p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
            Invite Codes
          </p>
          <h2 className="mt-1 text-2xl font-black">Issued codes</h2>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">
          {inviteCodes.length} total
        </p>
      </div>

      {inviteCodes.length === 0 ? (
        <div className="p-8">
          <div className="border border-black bg-offWhite p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
              Empty State
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-charcoal">
              No invite codes have been created yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="scrollbar-thin overflow-x-auto">
          <table className="min-w-[1040px] w-full border-collapse text-left">
            <thead className="bg-ink text-white">
              <tr className="text-[10px] font-black uppercase tracking-[0.16em]">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Redemptions</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Redeemed Users</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {inviteCodes.map((inviteCode) => (
                <InviteCodeRow inviteCode={inviteCode} key={inviteCode.id} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InviteCodeRow({ inviteCode }: { inviteCode: InviteCodeRecord }) {
  const status = getInviteCodeStatus(inviteCode);

  return (
    <tr className="border-t border-black align-top">
      <td className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-sm font-black">{inviteCode.code}</p>
          <CopyInviteCodeButton code={inviteCode.code} />
        </div>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
          Created {formatDate(inviteCode.created_at)}
        </p>
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-charcoal">
        {formatStoredValue(inviteCode.organization)}
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex border border-black bg-offWhite px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
          {formatTier(inviteCode.tier || "institutional")}
        </span>
      </td>
      <td className="px-4 py-4 text-sm font-black">
        {inviteCode.used_count}
        <span className="text-muted"> / {inviteCode.max_uses ?? "Unlimited"}</span>
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-charcoal">
        {inviteCode.expires_at ? formatDate(inviteCode.expires_at) : "No expiry"}
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-muted">
        Not stored
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
            status.isActive
              ? "border-black bg-deepOrange text-ink"
              : "border-black bg-ink text-white"
          }`}
        >
          {status.label}
        </span>
        <p className="mt-1 text-xs font-semibold text-muted">{status.reason}</p>
      </td>
      <td className="px-4 py-4">
        {status.isActive ? (
          <form action={disableInviteCodeAction}>
            <input name="inviteCodeId" type="hidden" value={inviteCode.id} />
            <AuthSubmitButton
              className="inline-flex items-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] hover:bg-paleOrange"
              pendingLabel="Disabling..."
            >
              <Ban size={13} />
              Disable
            </AuthSubmitButton>
          </form>
        ) : (
          <button
            className="inline-flex cursor-not-allowed items-center gap-2 border border-black bg-offWhite px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-muted"
            disabled
            type="button"
          >
            <Ban size={13} />
            {status.label}
          </button>
        )}
      </td>
    </tr>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function getErrorMessage(error: string) {
  if (error === "configuration") {
    return "Supabase admin configuration is missing for this environment.";
  }

  if (error === "generation_failed") {
    return "A unique invite code could not be generated. Try again.";
  }

  if (error === "write_failed") {
    return "The invite code could not be saved. Confirm the invite code schema has been applied.";
  }

  if (error === "read_failed") {
    return "Invite codes could not be loaded. Confirm the invite code schema has been applied.";
  }

  return "Check the invite-code fields and try again.";
}

function formatStoredValue(value?: string | null) {
  return value?.trim() ? value : "Not stored";
}

function formatTier(tier: string) {
  return tier
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function AdminNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center border border-black bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] hover:bg-paleOrange"
    >
      {label}
    </Link>
  );
}
