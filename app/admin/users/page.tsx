import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Users
} from "lucide-react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { PageShell } from "@/components/layout/PageShell";
import { getAuthSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/admin/invite-codes";
import {
  displayAdminStoredValue,
  getAdminUserInstitutionalStatus,
  listAllUsers,
  type AdminUserRow
} from "@/lib/admin/users";
import { verifyUserAction, revokeUserAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Management | DeepTechly Admin",
  description: "Review and manage DeepTechly user access and institutional verification."
};

type UsersPageProps = {
  searchParams: Promise<{
    verified?: string;
    revoked?: string;
    error?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/sign-in?redirectTo=/admin/users");
  }

  if (!isAdminEmail(session.email)) {
    forbidden();
  }

  const [params, usersResult] = await Promise.all([searchParams, listAllUsers()]);

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
                User management.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-ink/82">
                Review user accounts, verify institutional access, and manage
                access tiers.
              </p>
            </div>
            <nav className="flex flex-wrap gap-2">
              <AdminNavLink href="/admin/invite-codes" label="Invite Codes" />
              <AdminNavLink href="/admin/content" label="Content" />
            </nav>
          </div>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <StatusMessage params={params} />

          {!usersResult.ok ? (
            <div className="border border-black bg-white p-8 shadow-hard">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                Error
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-charcoal">
                {getErrorMessage(usersResult.reason)}
              </p>
            </div>
          ) : usersResult.users.length === 0 ? (
            <div className="border border-black bg-white p-8 text-center shadow-hard">
              <Users className="mx-auto text-muted" size={32} />
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                No Users
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-charcoal">
                No user profiles found. Users appear here after signing up.
              </p>
            </div>
          ) : (
            <div className="border border-black bg-white shadow-hard">
              <div className="flex flex-col gap-3 border-b border-black p-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
                    User Accounts
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Registered users</h2>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">
                  {usersResult.users.length} total
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full border-collapse text-left">
                  <thead className="bg-ink text-white">
                    <tr className="text-[10px] font-black uppercase tracking-[0.14em]">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Organization</th>
                      <th className="px-4 py-3">Access Tier</th>
                      <th className="px-4 py-3">Institutional</th>
                      <th className="px-4 py-3">Invite Code</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersResult.users.map((user) => (
                      <UserRow key={user.id} user={user} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function UserRow({ user }: { user: AdminUserRow }) {
  const institutionalStatus = getAdminUserInstitutionalStatus(user);

  return (
    <tr className="border-t border-black/20 align-top hover:bg-offWhite">
      <td className="px-4 py-4">
        <p className="font-black text-sm text-ink">
          {displayAdminStoredValue(user.fullName)}
        </p>
        <p className="mt-0.5 text-[10px] font-semibold text-charcoal">{user.email}</p>
      </td>

      <td className="px-4 py-4 text-sm font-semibold text-charcoal">
        {displayAdminStoredValue(user.organization)}
      </td>

      <td className="px-4 py-4">
        <span className="inline-flex border border-black bg-offWhite px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
          {formatTier(user.accessTier)}
        </span>
      </td>

      <td className="px-4 py-4">
        <InstitutionalStatus
          status={institutionalStatus}
        />
        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-muted">
          Pending review: {user.institutionalRequestPending ? "Yes" : "No"}
        </p>
      </td>

      <td className="px-4 py-4 text-sm font-semibold text-muted">
        {displayAdminStoredValue(user.inviteCodeUsed)}
      </td>

      <td className="px-4 py-4 text-sm font-semibold text-charcoal">
        <p>Joined {formatDate(user.createdAt)}</p>
        <p className="mt-1 text-xs text-muted">
          Updated {user.updatedAt ? formatDate(user.updatedAt) : "Not stored"}
        </p>
      </td>

      <td className="px-4 py-4">
        <div className="flex flex-col gap-2">
          {!user.isInstitutionalVerified ? (
            <form action={verifyUserAction}>
              <input type="hidden" name="authUserId" value={user.authUserId} />
              <AuthSubmitButton
                className="inline-flex w-full items-center justify-center gap-1.5 border border-black bg-deepOrange px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] hover:bg-darkOrange"
                pendingLabel="Verifying…"
              >
                <ShieldCheck size={11} />
                Verify
              </AuthSubmitButton>
            </form>
          ) : (
            <form action={revokeUserAction}>
              <input type="hidden" name="authUserId" value={user.authUserId} />
              <AuthSubmitButton
                className="inline-flex w-full items-center justify-center gap-1.5 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] hover:bg-paleOrange"
                pendingLabel="Revoking…"
              >
                <ShieldOff size={11} />
                Revoke
              </AuthSubmitButton>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}

function InstitutionalStatus({ status }: { status: string }) {
  if (status === "Verified") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-deepOrange">
        <CheckCircle2 size={13} />
        Verified
      </span>
    );
  }

  if (status === "Pending review") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-charcoal">
        <Clock3 size={13} />
        Pending review
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
      <CircleAlert size={13} />
      Not verified
    </span>
  );
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

function StatusMessage({
  params
}: {
  params: { verified?: string; revoked?: string; error?: string };
}) {
  if (params.verified) {
    return (
      <div className="mb-6 flex items-start gap-3 border border-black bg-white p-4 shadow-hard">
        <ShieldCheck className="mt-0.5 shrink-0 text-deepOrange" size={18} />
        <p className="text-sm font-bold leading-6">
          Institutional access verified. User can now access gated dossier sections.
        </p>
      </div>
    );
  }

  if (params.revoked) {
    return (
      <div className="mb-6 flex items-start gap-3 border border-black bg-white p-4 shadow-hard">
        <ShieldOff className="mt-0.5 shrink-0 text-muted" size={18} />
        <p className="text-sm font-bold leading-6">
          Institutional access revoked. User access tier returned to free.
        </p>
      </div>
    );
  }

  if (params.error) {
    return (
      <div className="mb-6 flex items-start gap-3 border border-black bg-paleOrange p-4 shadow-hard">
        <ShieldAlert className="mt-0.5 shrink-0 text-ink" size={18} />
        <p className="text-sm font-bold leading-6">{getErrorMessage(params.error)}</p>
      </div>
    );
  }

  return null;
}

function formatTier(tier: string) {
  return tier
    .split(/[_-]/)
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

function getErrorMessage(error: string) {
  if (error === "configuration") return "Supabase admin configuration is missing.";
  if (error === "read_failed") return "User profiles could not be loaded.";
  if (error === "write_failed") return "User verification could not be saved. Try again.";
  if (error === "invalid") return "Invalid user ID. The form submission was malformed.";
  return "An unexpected error occurred.";
}
