import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Star,
  StarOff
} from "lucide-react";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { PageShell } from "@/components/layout/PageShell";
import { getAuthSession } from "@/lib/auth/session";
import { isAdminEmail } from "@/lib/admin/invite-codes";
import { listAllContent, type AdminContentRow } from "@/lib/admin/content";
import {
  featureContentAction,
  publishContentAction,
  unpublishContentAction
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Content Console | DeepTechly Admin",
  description: "Review, publish, and feature generated research content."
};

type ContentPageProps = {
  searchParams: Promise<{
    published?: string;
    unpublished?: string;
    featured?: string;
    value?: string;
    error?: string;
    filter?: string;
  }>;
};

export default async function AdminContentPage({ searchParams }: ContentPageProps) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/sign-in?redirectTo=/admin/content");
  }

  if (!isAdminEmail(session.email)) {
    forbidden();
  }

  const [params, rows] = await Promise.all([searchParams, listAllContent()]);
  const filter = params.filter ?? "all";
  const filtered = applyFilter(rows, filter);

  return (
    <PageShell>
      <section className="w-full border-b border-black bg-deepOrange deeptech-texture">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.28em]">
            Admin Console
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.92] sm:text-6xl">
                Content publishing.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-ink/82">
                Review generated research jobs and publish or unpublish articles,
                profiles, and dossiers. Mark featured content for the homepage.
              </p>
            </div>
            <nav className="flex flex-wrap gap-2">
              <AdminNavLink href="/admin/invite-codes" label="Invite Codes" />
              <AdminNavLink href="/admin/users" label="Users" />
            </nav>
          </div>
        </div>
      </section>

      <section className="w-full bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <StatusMessage params={params} />

          <div className="mb-6 flex flex-wrap gap-2">
            {(["all", "published", "draft", "active"] as const).map((f) => (
              <Link
                key={f}
                href={`/admin/content?filter=${f}`}
                className={`inline-flex min-h-9 items-center border border-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${
                  filter === f ? "bg-ink text-white" : "bg-white hover:bg-paleOrange"
                }`}
              >
                {f === "all" ? "All Jobs" : f === "active" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className="ml-2 opacity-60">{countForFilter(rows, f)}</span>
              </Link>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="border border-black bg-white p-8 text-center shadow-hard">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
                Empty
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-charcoal">
                No research jobs match this filter. Queue a research job to
                generate content.
              </p>
              <Link
                href="/research"
                className="mt-5 inline-flex min-h-10 items-center gap-2 border border-black bg-deepOrange px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em]"
              >
                Queue Research
              </Link>
            </div>
          ) : (
            <div className="border border-black bg-white shadow-hard">
              <div className="overflow-x-auto">
                <table className="min-w-[960px] w-full border-collapse text-left">
                  <thead className="bg-ink text-white">
                    <tr className="text-[10px] font-black uppercase tracking-[0.14em]">
                      <th className="px-4 py-3">Entity</th>
                      <th className="px-4 py-3">Article</th>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Sources</th>
                      <th className="px-4 py-3">Links</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <ContentRow key={row.jobId} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function ContentRow({ row }: { row: AdminContentRow }) {
  const isDone = row.stage === "done" || row.stage === "public_research_ready";
  const isPublished = row.publishedStatus === "published";
  const hasSlug = Boolean(row.slug);

  return (
    <tr className="border-t border-black/20 align-top hover:bg-offWhite">
      <td className="px-4 py-4">
        <p className="font-black text-sm text-ink">{row.entityName}</p>
        {row.slug ? (
          <p className="mt-0.5 font-mono text-[10px] text-muted">{row.slug}</p>
        ) : null}
        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
          {formatDate(row.createdAt)}
        </p>
      </td>

      <td className="px-4 py-4 max-w-[260px]">
        {row.articleTitle ? (
          <p className="text-sm font-semibold leading-snug text-charcoal line-clamp-2">
            {row.articleTitle}
          </p>
        ) : (
          <p className="text-[10px] font-bold text-muted/60 italic">No article yet</p>
        )}
        {row.confidenceLabel ? (
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-deepOrange">
            {row.confidenceLabel} · {row.sourceCount} src
          </p>
        ) : null}
      </td>

      <td className="px-4 py-4">
        <StageBadge stage={row.stage} />
      </td>

      <td className="px-4 py-4">
        {row.publishedStatus ? (
          <span
            className={`inline-flex border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
              isPublished
                ? "border-black bg-deepOrange text-ink"
                : "border-black bg-offWhite text-charcoal"
            }`}
          >
            {isPublished ? "Published" : "Draft"}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-muted/60 italic">—</span>
        )}
        {row.adminFeatured && isPublished ? (
          <p className="mt-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-deepOrange">
            <Star size={10} /> Featured
          </p>
        ) : null}
      </td>

      <td className="px-4 py-4 text-sm font-black text-ink">
        {row.sourceCount > 0 ? row.sourceCount : "—"}
      </td>

      <td className="px-4 py-4">
        {hasSlug ? (
          <div className="flex flex-col gap-1.5">
            {row.articleUrl ? (
              <ContentLink href={row.articleUrl} label="Article" icon={<FileText size={10} />} />
            ) : null}
            {row.profileUrl ? (
              <ContentLink href={row.profileUrl} label="Profile" icon={<BookOpen size={10} />} />
            ) : null}
            {row.dossierUrl ? (
              <ContentLink href={row.dossierUrl} label="Dossier" icon={<ArrowUpRight size={10} />} />
            ) : null}
          </div>
        ) : (
          <span className="text-[10px] font-bold text-muted/60 italic">—</span>
        )}
      </td>

      <td className="px-4 py-4">
        {isDone && hasSlug ? (
          <div className="flex flex-col gap-2">
            {isPublished ? (
              <form action={unpublishContentAction}>
                <input type="hidden" name="slug" value={row.slug!} />
                <AuthSubmitButton
                  className="inline-flex w-full items-center justify-center gap-1.5 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] hover:bg-paleOrange"
                  pendingLabel="Unpublishing…"
                >
                  Unpublish
                </AuthSubmitButton>
              </form>
            ) : (
              <form action={publishContentAction}>
                <input type="hidden" name="slug" value={row.slug!} />
                <AuthSubmitButton
                  className="inline-flex w-full items-center justify-center gap-1.5 border border-black bg-deepOrange px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] hover:bg-darkOrange"
                  pendingLabel="Publishing…"
                >
                  <CheckCircle2 size={11} />
                  Publish
                </AuthSubmitButton>
              </form>
            )}
            {isPublished ? (
              <form action={featureContentAction}>
                <input type="hidden" name="slug" value={row.slug!} />
                <input
                  type="hidden"
                  name="featured"
                  value={row.adminFeatured ? "false" : "true"}
                />
                <AuthSubmitButton
                  className="inline-flex w-full items-center justify-center gap-1.5 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] hover:bg-paleOrange"
                  pendingLabel="Saving…"
                >
                  {row.adminFeatured ? (
                    <>
                      <StarOff size={11} /> Unfeature
                    </>
                  ) : (
                    <>
                      <Star size={11} /> Feature
                    </>
                  )}
                </AuthSubmitButton>
              </form>
            ) : null}
          </div>
        ) : (
          <span className="text-[10px] font-bold text-muted/60 italic">
            {isDone ? "No slug" : "Pending"}
          </span>
        )}
      </td>
    </tr>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const isActive = !["done", "failed", "cancelled", "public_research_ready"].includes(stage);
  const isDone = stage === "done";
  const isFailed = stage === "failed";

  return (
    <span
      className={`inline-flex border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
        isDone
          ? "border-black bg-ink text-white"
          : isFailed
            ? "border-black bg-darkOrange text-white"
            : isActive
              ? "border-black bg-paleOrange text-ink"
              : "border-black bg-offWhite text-charcoal"
      }`}
    >
      {stage.replace(/_/g, " ")}
    </span>
  );
}

function ContentLink({
  href,
  label,
  icon
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-deepOrange hover:underline"
    >
      {icon}
      {label}
    </Link>
  );
}

function AdminNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center border border-black bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] hover:bg-paleOrange"
    >
      {label}
    </Link>
  );
}

function StatusMessage({
  params
}: {
  params: {
    published?: string;
    unpublished?: string;
    featured?: string;
    value?: string;
    error?: string;
  };
}) {
  if (params.published) {
    return (
      <div className="mb-6 flex items-start gap-3 border border-black bg-white p-4 shadow-hard">
        <CheckCircle2 className="mt-0.5 shrink-0 text-deepOrange" size={18} />
        <p className="text-sm font-bold leading-6">
          Published <span className="font-mono">{params.published}</span>. Article, profile, and dossier are now public.
        </p>
      </div>
    );
  }

  if (params.unpublished) {
    return (
      <div className="mb-6 flex items-start gap-3 border border-black bg-white p-4 shadow-hard">
        <CheckCircle2 className="mt-0.5 shrink-0 text-muted" size={18} />
        <p className="text-sm font-bold leading-6">
          Unpublished <span className="font-mono">{params.unpublished}</span>. Content is now draft.
        </p>
      </div>
    );
  }

  if (params.featured && params.value) {
    const isFeatured = params.value === "true";
    return (
      <div className="mb-6 flex items-start gap-3 border border-black bg-white p-4 shadow-hard">
        {isFeatured ? (
          <Star className="mt-0.5 shrink-0 text-deepOrange" size={18} />
        ) : (
          <StarOff className="mt-0.5 shrink-0 text-muted" size={18} />
        )}
        <p className="text-sm font-bold leading-6">
          <span className="font-mono">{params.featured}</span>{" "}
          {isFeatured ? "marked as featured" : "removed from featured"}.
        </p>
      </div>
    );
  }

  if (params.error) {
    return (
      <div className="mb-6 flex items-start gap-3 border border-black bg-paleOrange p-4 shadow-hard">
        <ShieldAlert className="mt-0.5 shrink-0 text-ink" size={18} />
        <p className="text-sm font-bold leading-6">{getErrorMessage(params.error)}</p>
      </div>
    );
  }

  return null;
}

function applyFilter(rows: AdminContentRow[], filter: string) {
  if (filter === "published") return rows.filter((r) => r.publishedStatus === "published");
  if (filter === "draft") return rows.filter((r) => r.publishedStatus === "draft");
  if (filter === "active") {
    return rows.filter(
      (r) => !["done", "failed", "cancelled", "public_research_ready"].includes(r.stage)
    );
  }
  return rows;
}

function countForFilter(rows: AdminContentRow[], filter: string) {
  return applyFilter(rows, filter).length;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function getErrorMessage(error: string) {
  if (error === "not_found") return "Content not found. The slug may not match any stored entity.";
  if (error === "invalid") return "Invalid request. Check the form submission.";
  return "An error occurred. Check the admin console and try again.";
}
