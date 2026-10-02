import Link from "next/link";
import { Cpu, ArrowRight, LogIn } from "lucide-react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Sign In | DeepTechly",
  description: "Sign in to your DeepTechly research account."
};

type SignInPageProps = {
  searchParams: Promise<{ error?: string; notice?: string; redirectTo?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error, notice, redirectTo } = await searchParams;
  const redirectPath = getSafeRedirectPath(redirectTo);

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Account Access
          </p>
          <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Sign in to DeepTechly.
          </h1>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
          <div className="border border-black bg-white p-8 shadow-hard">
            <div className="mb-6 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center border border-deepOrange bg-deepOrange text-ink">
                <Cpu size={16} strokeWidth={2.6} />
              </span>
              <span className="text-base font-black tracking-tight">DeepTechly</span>
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
              Authentication
            </p>
            <p className="mt-2 text-sm leading-6 text-charcoal">
              Sign in with your email-only DeepTechly account. Public research
              remains available without an account.
            </p>

            {notice === "check-email" ? (
              <p className="mt-4 border border-black bg-offWhite px-3 py-2 text-xs font-bold text-ink">
                Check your email to confirm the account, then sign in.
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 border border-black bg-paleOrange px-3 py-2 text-xs font-bold text-ink">
                {getErrorMessage(error)}
              </p>
            ) : null}

            <form
              action="/api/auth/sign-in"
              className="mt-6 space-y-4"
              method="post"
            >
              <input name="redirectTo" type="hidden" value={redirectPath} />
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
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-ink">
                  Password
                </span>
                <input
                  className="mt-2 w-full border border-black bg-offWhite px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange"
                  name="password"
                  required
                  type="password"
                />
              </label>
              <AuthSubmitButton
                className="flex w-full items-center justify-between border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-darkOrange"
                pendingLabel="Signing In..."
              >
                Sign In
                <LogIn size={14} />
              </AuthSubmitButton>
            </form>

            <div className="mt-4 space-y-3">
              <Link
                href="/forgot-password"
                className="flex w-full items-center justify-between border border-black bg-offWhite px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] hover:bg-paleOrange"
              >
                Forgot Password?
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/join"
                className="flex w-full items-center justify-between border border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] hover:bg-offWhite"
              >
                Join DeepTechly
                <ArrowRight size={14} />
              </Link>
            </div>

            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
              All public research is available without an account.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function getErrorMessage(error: string) {
  if (error === "config") {
    return "Supabase authentication is not configured for this environment.";
  }

  if (error === "invalid") {
    return "The email or password was not accepted.";
  }

  return "Enter a valid email and password to continue.";
}

function getSafeRedirectPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/research";
  }

  return value;
}
