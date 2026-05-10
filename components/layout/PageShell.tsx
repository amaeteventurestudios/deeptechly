import { ReactNode } from "react";
import { SectorNav } from "./SectorNav";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <SectorNav />
      {children}
      <SiteFooter />
    </div>
  );
}
