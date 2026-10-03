import Link from "next/link";
import { Cpu, LogOut, Menu, UserRound } from "lucide-react";
import { getAuthSession } from "@/lib/auth/session";

const primaryLinks = [
  ["News", "/news"],
  ["Explore", "/explore"],
  ["Aperture", "/aperture"],
  ["Research", "/research"]
] as const;

const navLinkClass =
  "inline-flex min-h-11 items-center border-b-2 border-transparent text-white/80 transition-colors hover:border-deepOrange hover:text-white";
const joinLinkClass =
  "inline-flex min-h-11 items-center justify-center border border-deepOrange bg-deepOrange px-4 text-ink transition-colors hover:bg-white";

function Brand() {
  return (
    <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2.5" aria-label="DeepTechly home">
      <span className="flex h-8 w-8 items-center justify-center border border-deepOrange bg-deepOrange text-ink" aria-hidden="true">
        <Cpu size={18} strokeWidth={2.6} />
      </span>
      <span className="text-xl font-black tracking-[-0.04em]">DeepTechly</span>
    </Link>
  );
}

function PrimaryLinks({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {primaryLinks.map(([label, href]) => (
        <Link
          key={href}
          className={mobile ? "flex min-h-11 items-center border-b border-white/15 text-base font-black uppercase tracking-[0.1em] hover:text-deepOrange" : navLinkClass}
          href={href}
        >
          {label}
        </Link>
      ))}
    </>
  );
}

function AccountControls({
  email,
  accountLabel,
  isAdmin,
  mobile = false
}: {
  email?: string;
  accountLabel?: string;
  isAdmin: boolean;
  mobile?: boolean;
}) {
  if (!email) {
    return (
      <>
        <Link className={mobile ? "flex min-h-11 items-center border-b border-white/15 font-black uppercase tracking-[0.1em]" : navLinkClass} href="/sign-in">
          Sign in
        </Link>
        <Link className={joinLinkClass} href="/join">Join</Link>
      </>
    );
  }

  return (
    <>
      <Link
        className={mobile ? "flex min-h-11 items-center gap-2 border-b border-white/15 font-black uppercase tracking-[0.1em]" : "flex min-h-11 max-w-48 items-center gap-2 truncate border border-white/30 px-3 text-white/80 hover:border-deepOrange hover:text-white"}
        href="/dashboard"
      >
        <UserRound size={14} aria-hidden="true" />
        <span className="truncate">{accountLabel}</span>
      </Link>
      <Link className={mobile ? "flex min-h-11 items-center border-b border-white/15 font-black uppercase tracking-[0.1em]" : navLinkClass} href="/settings">
        Settings
      </Link>
      {isAdmin ? <Link className={joinLinkClass} href="/admin">Admin</Link> : null}
      <form action="/api/auth/sign-out" method="post">
        <button className="flex min-h-11 items-center gap-2 text-left font-black uppercase tracking-[0.1em] hover:text-deepOrange" type="submit">
          <LogOut size={14} aria-hidden="true" />
          Sign out
        </button>
      </form>
    </>
  );
}

export async function SiteHeader() {
  const session = await getAuthSession();
  const isAdmin = Boolean(session?.isAdmin);
  const accountLabel = isAdmin ? "Dashboard" : session?.name || session?.email;

  return (
    <header className="relative z-50 w-full border-b border-white/15 bg-ink text-white">
      <div className="mx-auto flex min-h-16 max-w-[1840px] items-center justify-between gap-4 px-4 sm:px-5 lg:px-6 xl:px-8 2xl:px-10">
        <Brand />

        <nav aria-label="Primary navigation" className="hidden items-center gap-6 text-[0.6875rem] font-black uppercase tracking-[0.14em] lg:flex xl:gap-8">
          <PrimaryLinks />
        </nav>

        <div className="hidden items-center gap-3 text-[0.6875rem] font-black uppercase tracking-[0.12em] lg:flex">
          <AccountControls email={session?.email} accountLabel={accountLabel} isAdmin={isAdmin} />
        </div>

        <details className="group relative lg:hidden">
          <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center border border-white/40 text-white marker:content-none hover:border-deepOrange hover:text-deepOrange" aria-label="Open navigation menu">
            <Menu size={21} aria-hidden="true" />
          </summary>
          <nav aria-label="Mobile navigation" className="absolute right-0 top-[calc(100%+0.625rem)] w-[min(19rem,calc(100vw-2rem))] border border-white/25 bg-ink p-4 shadow-hard">
            <div className="flex flex-col text-sm">
              <PrimaryLinks mobile />
              <div className="mt-3 flex flex-col gap-2">
                <AccountControls email={session?.email} accountLabel={accountLabel} isAdmin={isAdmin} mobile />
              </div>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
