import Link from "next/link";
import { ArrowRight, FileText, Gauge, KeyRound, Users } from "lucide-react";

const adminTools = [
  { href: "/admin", label: "Admin Overview", icon: Gauge },
  { href: "/admin/content", label: "Content Review", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/invite-codes", label: "Invite Codes", icon: KeyRound }
];

export function AdminToolsPanel() {
  return (
    <section className="border border-black bg-white p-5 shadow-hard">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
        Admin Tools
      </p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-ink">
        DeepTechly control center
      </h2>
      <p className="mt-3 text-sm font-semibold leading-6 text-charcoal">
        Manage research content, users, and institutional invite-code access.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {adminTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              className="flex min-h-12 items-center justify-between gap-3 border border-black bg-offWhite px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] hover:bg-paleOrange"
              href={tool.href}
              key={tool.href}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="shrink-0 text-deepOrange" size={14} />
                <span className="truncate">{tool.label}</span>
              </span>
              <ArrowRight className="shrink-0" size={13} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
