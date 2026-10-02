import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HomeSectionHeader({
  eyebrow,
  title,
  dek,
  actionHref,
  actionLabel,
  inverted = false
}: {
  eyebrow: string;
  title: string;
  dek?: string;
  actionHref?: string;
  actionLabel?: string;
  inverted?: boolean;
}) {
  return (
    <div
      className={`mb-6 flex flex-col items-center gap-4 border-b pb-4 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left ${
        inverted ? "border-white/20" : "border-black"
      }`}
    >
      <div className="mx-auto max-w-2xl lg:mx-0">
        <p
          className={`text-[11px] font-black uppercase tracking-[0.18em] ${
            inverted ? "text-deepOrange" : "text-deepOrange"
          }`}
        >
          {eyebrow}
        </p>
        <h2
          className={`mt-2 text-3xl font-black leading-[1.02] sm:text-4xl ${
            inverted ? "text-white" : "text-ink"
          }`}
        >
          {title}
        </h2>
        {dek ? (
          <p
            className={`mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 lg:mx-0 ${
              inverted ? "text-white/68" : "text-charcoal"
            }`}
          >
            {dek}
          </p>
        ) : null}
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className={`inline-flex min-h-12 items-center justify-center gap-2 border px-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.14em] shadow-hard ${
            inverted
              ? "border-white bg-white text-ink hover:bg-deepOrange"
              : "border-black bg-white text-ink hover:bg-deepOrange"
          }`}
        >
          {actionLabel}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
