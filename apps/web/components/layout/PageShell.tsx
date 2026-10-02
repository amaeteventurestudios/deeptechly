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
      <SiteHeader />
      {hideSectorNav ? null : <SectorNav />}
      {children}
      <SiteFooter />
    </div>
  );
}
