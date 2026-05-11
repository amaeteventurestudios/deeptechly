import Link from "next/link";
import { Cpu, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Sign In | DeepTechly",
  description: "Sign in to your DeepTechly research account."
};

export default function SignInPage() {
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
              Researcher and institutional accounts are currently in private access.
              Submit a request below to join the waitlist or request institutional
              credentials.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/join"
                className="flex w-full items-center justify-between border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-darkOrange"
              >
                Request Institutional Access
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/"
                className="flex w-full items-center justify-between border border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] hover:bg-offWhite"
              >
                Back to Homepage
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
