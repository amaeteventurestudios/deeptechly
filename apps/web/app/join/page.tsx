import Link from "next/link";
import { ArrowRight, Cpu, UserPlus } from "lucide-react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { PasswordSuggestionField } from "@/components/auth/PasswordSuggestionField";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Join DeepTechly | DeepTechly",
  description:
    "Create a free research account or request verified institutional access to DeepTechly."
};

type JoinPageProps = {
  searchParams: Promise<{ error?: string; access?: string }>;
};

type AccessTab = "research" | "institutional";

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const { error, access } = await searchParams;
  const activeTab: AccessTab = access === "institutional" ? "institutional" : "research";

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Join DeepTechly
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Choose the access path that matches your role.
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-ink/82">
            Research accounts are free. Institutional analysis may require
            verification or an invite code.
          </p>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div
            aria-label="Choose access path"
            className="grid grid-cols-1 gap-px border border-black bg-black sm:grid-cols-2"
            role="tablist"
          >
            <AccessTabLink
              active={activeTab === "research"}
              href="/join?access=research"
              label="Research Access"
            />
            <AccessTabLink
              active={activeTab === "institutional"}
              href="/join?access=institutional"
              label="Institutional Access"
            />
          </div>

          <div className="mt-6">
            {activeTab === "institutional" ? (
              <InstitutionalAccessForm error={error} />
            ) : (
              <ResearchAccessForm error={error} />
            )}
          </div>

          <p className="mt-6 text-center text-[10px] font-black uppercase tracking-[0.16em] text-muted">
            Already a member?{" "}
            <Link className="text-deepOrange hover:text-ink" href="/sign-in">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      <section className="w-full border-t border-black bg-offWhite">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-center sm:justify-start sm:text-left">
            <span className="flex h-6 w-6 items-center justify-center border border-deepOrange bg-deepOrange text-ink">
              <Cpu size={14} strokeWidth={2.6} aria-hidden="true" />
            </span>
            <span className="text-sm font-black">DeepTechly</span>
          </div>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-charcoal sm:mx-0 sm:text-left">
            Public articles, profiles, public dossier snapshots, and markdown
            exports remain open. Verified accounts unlock the institutional
            dossier layer where available.
          </p>
          <Link
            href="/pricing"
            className="mx-auto mt-4 inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] hover:bg-paleOrange sm:mx-0"
          >
            View pricing
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

function AccessTabLink({
  active,
  href,
  label
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      aria-selected={active}
      className={`flex min-h-12 items-center justify-center border-0 px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.16em] focus:outline-none focus:ring-2 focus:ring-deepOrange focus:ring-offset-2 ${
        active ? "bg-ink text-white" : "bg-white text-ink hover:bg-paleOrange"
      }`}
      href={href}
      role="tab"
    >
      {label}
    </Link>
  );
}

function ResearchAccessForm({ error }: { error?: string }) {
  return (
    <form
      action="/api/auth/join"
      className="border border-black bg-white p-5 shadow-hard sm:p-6"
      method="post"
    >
      <input name="accessPath" type="hidden" value="research" />
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
        Research Access
      </p>
      <h2 className="mt-2 text-2xl font-black leading-tight">
        Create research account
      </h2>
      <p className="mt-2 text-sm leading-6 text-charcoal">
        Free account access for public research workflows, saved research, and
        basic queue activity.
      </p>
      {error ? <ErrorNotice error={error} /> : null}
      <div className="mt-5 space-y-4">
        <TextField label="Full Name" name="fullName" required />
        <TextField label="Email" name="email" required type="email" />
        <PasswordSuggestionField label="Password" minLength={8} name="password" />
      </div>
      <AuthSubmitButton
        className="mt-6 flex min-h-12 w-full items-center justify-between border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-darkOrange"
        pendingLabel="Creating Account..."
      >
        Create Research Account
        <UserPlus size={14} aria-hidden="true" />
      </AuthSubmitButton>
    </form>
  );
}

function InstitutionalAccessForm({ error }: { error?: string }) {
  return (
    <form
      action="/api/auth/join"
      className="border border-black bg-ink p-5 text-white shadow-hard sm:p-6"
      method="post"
    >
      <input name="accessPath" type="hidden" value="institutional" />
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
        Institutional Access
      </p>
      <h2 className="mt-2 text-2xl font-black leading-tight">
        Request institutional access
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/74">
        Submit a request for verified access. A valid invite code can unlock
        institutional access immediately; missing or invalid codes remain
        pending review.
      </p>
      {error ? <ErrorNotice dark error={error} /> : null}
      <div className="mt-5 space-y-4">
        <TextField dark label="Full Name" name="fullName" required />
        <TextField dark label="Organization" name="organization" />
        <TextField dark label="Work Email" name="workEmail" required type="email" />
        <PasswordSuggestionField
          inputClassName="mt-2 w-full border border-white bg-white px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
          label="Password"
          labelClassName="text-[10px] font-black uppercase tracking-[0.18em] text-white"
          minLength={8}
          name="password"
        />
        <TextField dark label="Invite Code" name="inviteCode" />
      </div>
      <AuthSubmitButton
        className="mt-6 flex min-h-12 w-full items-center justify-between border border-deepOrange bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-ink shadow-hard hover:bg-darkOrange"
        pendingLabel="Requesting Access..."
      >
        Request Institutional Access
        <ArrowRight size={14} aria-hidden="true" />
      </AuthSubmitButton>
    </form>
  );
}

function TextField({
  dark = false,
  label,
  name,
  required = false,
  type = "text"
}: {
  dark?: boolean;
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block">
      <span
        className={`text-[10px] font-black uppercase tracking-[0.18em] ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {label}
      </span>
      <input
        className={`mt-2 w-full border px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange ${
          dark ? "border-white bg-white" : "border-black bg-offWhite"
        }`}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function ErrorNotice({ dark = false, error }: { dark?: boolean; error: string }) {
  return (
    <p
      className={`mt-4 border px-3 py-2 text-xs font-bold leading-5 ${
        dark
          ? "border-deepOrange bg-white text-ink"
          : "border-black bg-paleOrange text-ink"
      }`}
    >
      {getErrorMessage(error)}
    </p>
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
