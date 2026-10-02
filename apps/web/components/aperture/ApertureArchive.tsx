import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AperturePublication } from "@deeptechly/aperture";

export function ApertureArchive({
  items,
  emptyTitle,
  emptyBody
}: {
  items: AperturePublication[];
  emptyTitle: string;
  emptyBody: string;
}) {
  if (items.length === 0) {
    return (
      <div className="border border-black bg-white p-8 text-center shadow-hard">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
          Evidence threshold active
        </p>
        <h2 className="mt-3 text-2xl font-black">{emptyTitle}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-charcoal">
          {emptyBody}
        </p>
        <Link
          href="/aperture/methodology"
          className="mt-6 inline-flex min-h-11 items-center gap-2 border border-black bg-deepOrange px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] shadow-hard"
        >
          Review Methodology <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={`${item.kind}:${item.slug}`}
          href={`/aperture/${item.kind === "opportunity" ? "opportunities" : `${item.kind}s`}/${item.slug}`}
          className="block border border-black bg-white p-5 shadow-hard hover:bg-paleOrange"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-deepOrange">
            {item.kind} · {item.confidenceLabel}
          </p>
          <h2 className="mt-2 text-xl font-black leading-tight">{item.title}</h2>
          <p className="mt-3 line-clamp-4 text-sm font-semibold leading-6 text-charcoal">
            {item.summary}
          </p>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-muted">
            {item.sourceCount} public sources
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em]">
            Open Brief <ArrowRight size={13} />
          </span>
        </Link>
      ))}
    </div>
  );
}
