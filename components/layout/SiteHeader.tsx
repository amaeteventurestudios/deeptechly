import Link from "next/link";
import { Cpu, LogIn } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="w-full border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center border border-deepOrange bg-deepOrange text-ink">
            <Cpu size={15} strokeWidth={2.6} />
          </span>
          <span className="text-lg font-black tracking-tight">DeepTechly</span>
        </Link>

        <nav className="hidden items-center gap-6 text-[11px] font-bold uppercase tracking-[0.12em] md:flex">
          <Link className="hover:text-deepOrange" href="/news">
            News
          </Link>
          <Link className="hover:text-deepOrange" href="/startups">
            Explore
          </Link>
          <Link
            className="border border-white px-3 py-1.5 hover:border-deepOrange hover:text-deepOrange"
            href="/research"
          >
            Research
          </Link>
          <Link className="hover:text-deepOrange" href="/sign-in">
            Sign In
          </Link>
        </nav>

        <Link
          className="flex items-center gap-2 border border-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white hover:border-deepOrange hover:text-deepOrange md:hidden"
          href="/sign-in"
        >
          <LogIn size={13} />
          Sign In
        </Link>
      </div>
    </header>
  );
}
