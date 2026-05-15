import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LogOut, UserRound } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
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
          <section className="border border-black bg-white p-6 shadow-hard">
            <div className="flex flex-col items-center gap-3 border-b border-black pb-4 text-center sm:flex-row sm:text-left">
              <span className="flex h-12 w-12 items-center justify-center border border-black bg-offWhite text-deepOrange">
                <UserRound size={22} />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                  DeepTechly Profile
                </p>
                <h2 className="mt-1 text-2xl font-black leading-tight">
                  {session.name ?? session.email}
                </h2>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-px border border-black bg-black sm:grid-cols-2">
              <ProfileTile label="Full Name" value={session.name ?? "Not provided"} />
              <ProfileTile label="Email" value={session.email} />
              <ProfileTile
                label="Organization"
                value={profile?.organization ?? "Not provided"}
              />
              <ProfileTile
                label="Access Level"
                value={formatAccessTier(session.accessTier)}
              />
              <ProfileTile
                label="Institutional Verification"
                value={
                  session.isInstitutionalVerified
                    ? "Verified"
                    : session.institutionalRequestPending
                      ? "Pending Review"
                      : "Not Verified"
                }
              />
              <ProfileTile
                label="Account Created"
                value={profile?.created_at ? formatDate(profile.created_at) : "Unknown"}
              />
            </dl>
          </section>

          <aside className="space-y-4">
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

function ProfileTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <dt className="text-[9px] font-black uppercase tracking-[0.16em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-base font-black text-ink">{value}</dd>
    </div>
  );
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
