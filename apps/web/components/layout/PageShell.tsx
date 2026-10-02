import { ReactNode } from "react";
import { SectorNav } from "./SectorNav";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PageShell({
  children,
  hideSectorNav = false
}: {
  children: ReactNode;
  hideSectorNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[100] -translate-y-24 border border-ink bg-deepOrange px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-ink shadow-hard transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <SiteHeader />
      {hideSectorNav ? null : <SectorNav />}
      <div id="main-content" tabIndex={-1}>{children}</div>
      <SiteFooter />
    </div>
  );
}
