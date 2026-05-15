import Link from "next/link";
import { Cpu, LogIn, LogOut, UserRound } from "lucide-react";
import { getAuthSession } from "@/lib/auth/session";

const navLinkClass = "hover:text-deepOrange";
const researchLinkClass =
  "border border-deepOrange px-4 py-2 hover:bg-deepOrange hover:text-ink";
const joinLinkClass =
  "border border-deepOrange bg-deepOrange px-4 py-2 text-ink hover:bg-darkOrange";

export async function SiteHeader() {
  const session = await getAuthSession();
  const accountLabel = session?.name || session?.email;

  return (
    <header className="w-full border-b border-white/10 bg-ink text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center border border-deepOrange bg-deepOrange text-ink">
            <Cpu size={18} strokeWidth={2.6} />
          </span>
          <span className="text-xl font-black tracking-tight">DeepTechly</span>
        </Link>

        <nav className="hidden items-center gap-7 text-[12px] font-black uppercase tracking-[0.12em] md:flex">
          <Link className={navLinkClass} href="/news">
            News
          </Link>
          <Link className={navLinkClass} href="/explore">
            Explore
          </Link>
          <Link className={researchLinkClass} href="/research">
            Research
          </Link>
          {session ? (
            <>
              <Link
                className="flex max-w-[14rem] items-center gap-2 truncate border border-white/30 px-3 py-1.5 text-white/78 hover:border-deepOrange hover:text-deepOrange"
                href="/dashboard"
              >
                <UserRound size={13} />
                <span className="truncate">{accountLabel}</span>
              </Link>
              <form action="/api/auth/sign-out" method="post">
                <button
                  className="flex items-center gap-2 hover:text-deepOrange"
                  type="submit"
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link className={navLinkClass} href="/sign-in">
                Sign In
              </Link>
              <Link className={joinLinkClass} href="/join">
                Join
              </Link>
            </>
          )}
        </nav>

        <div className="flex w-full flex-wrap items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] md:hidden">
          {session ? (
            <>
              <Link
                className="flex min-w-0 items-center gap-2 border border-white/30 px-3 py-1.5 text-white/78 hover:border-deepOrange hover:text-deepOrange"
                href="/dashboard"
              >
                <UserRound size={13} className="shrink-0" />
                <span className="truncate">{accountLabel}</span>
              </Link>
              <form action="/api/auth/sign-out" method="post">
                <button
                  className="flex items-center gap-2 border border-white px-3 py-1.5 text-white hover:border-deepOrange hover:text-deepOrange"
                  type="submit"
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                className="flex items-center gap-2 border border-white px-3 py-1.5 text-white hover:border-deepOrange hover:text-deepOrange"
                href="/sign-in"
              >
                <LogIn size={13} />
                Sign In
              </Link>
              <Link className={joinLinkClass} href="/join">
                Join DeepTechly
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
