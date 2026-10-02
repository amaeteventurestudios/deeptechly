import Link from "next/link";
import { ArrowLeft, KeyRound, Send } from "lucide-react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Reset Password | DeepTechly",
  description: "Request a DeepTechly password reset link."
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string; sent?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams
}: ForgotPasswordPageProps) {
  const { error, sent } = await searchParams;

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Account Recovery
          </p>
          <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Reset your password.
          </h1>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
          <div className="border border-black bg-white p-8 shadow-hard">
            <div className="mb-6 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center border border-deepOrange bg-deepOrange text-ink">
                <KeyRound size={16} strokeWidth={2.6} />
              </span>
              <span className="text-base font-black tracking-tight">
                DeepTechly
              </span>
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
              Password Reset
            </p>
            <p className="mt-2 text-sm leading-6 text-charcoal">
              Enter your account email and DeepTechly will send a secure reset
              link.
            </p>

            {sent === "1" ? (
              <p className="mt-4 border border-black bg-offWhite px-3 py-2 text-xs font-bold text-ink">
                Check your email for a password reset link.
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 border border-black bg-paleOrange px-3 py-2 text-xs font-bold text-ink">
                {getErrorMessage(error)}
              </p>
            ) : null}

            <form
              action="/api/auth/forgot-password"
              className="mt-6 space-y-4"
              method="post"
            >
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
              <AuthSubmitButton
                className="flex w-full items-center justify-between border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-darkOrange"
                pendingLabel="Sending..."
              >
                Send Reset Link
                <Send size={14} />
              </AuthSubmitButton>
            </form>

            <Link
              href="/sign-in"
              className="mt-4 flex w-full items-center justify-between border border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] hover:bg-offWhite"
            >
              Back to Sign In
              <ArrowLeft size={14} />
            </Link>
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

  if (error === "send") {
    return "The reset email could not be sent. Try again in a moment.";
  }

  return "Enter a valid email address to continue.";
}
