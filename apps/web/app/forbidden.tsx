import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";

export default function Forbidden() {
  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            403
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
            Not authorized.
          </h1>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="border border-black bg-white p-6 shadow-hard">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-black bg-ink text-white">
                <ShieldAlert size={18} />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">
                  Admin Allowlist Required
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-charcoal">
                  This account is signed in, but it is not allowlisted for
                  DeepTechly administration.
                </p>
              </div>
            </div>

            <Link
              className="mt-6 flex items-center justify-between border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard"
              href="/research"
            >
              Back to Research
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
