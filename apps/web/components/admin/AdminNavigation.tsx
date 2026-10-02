import Link from "next/link";

type AdminSection = "overview" | "content" | "users" | "invite-codes";

const adminLinks: Array<{
  href: string;
  label: string;
  section: AdminSection;
}> = [
  { href: "/admin", label: "Overview", section: "overview" },
  { href: "/admin/content", label: "Content", section: "content" },
  { href: "/admin/users", label: "Users", section: "users" },
  {
    href: "/admin/invite-codes",
    label: "Invite Codes",
    section: "invite-codes"
  }
];

export function AdminNavigation({ active }: { active: AdminSection }) {
  return (
    <nav
      aria-label="Admin sections"
      className="flex flex-wrap items-center gap-2"
    >
      {adminLinks.map((link) => {
        const isActive = link.section === active;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-9 items-center border border-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] shadow-[2px_2px_0_#0f0f0f] ${
              isActive
                ? "bg-ink text-white"
                : "bg-white text-ink hover:bg-paleOrange"
            }`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
