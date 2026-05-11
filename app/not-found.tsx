import Link from "next/link";
import { ArrowRight, Cpu } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="w-full border-b border-white/10 bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center border border-deepOrange bg-deepOrange text-ink">
              <Cpu size={15} strokeWidth={2.6} />
            </span>
            <span className="text-lg font-black tracking-tight">DeepTechly</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="w-full max-w-lg">
          <div className="border border-black bg-white p-8 shadow-hard">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-deepOrange">
              404 · Research page not found
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight">
              This page could not be found.
            </h1>
            <p className="mt-4 text-sm leading-6 text-charcoal">
              This article, profile, or dossier may still be publishing, the
              link may be outdated, or the research job may not have completed
              yet.
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/"
                className="flex items-center justify-between border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard"
              >
                Back to Homepage
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/news"
                className="flex items-center justify-between border border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em]"
              >
                View Research Archive
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/research"
                className="flex items-center justify-between border border-black bg-ink px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white"
              >
                Queue New Research
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            DeepTechly · Independent research
          </p>
        </div>
      </main>
    </div>
  );
}
