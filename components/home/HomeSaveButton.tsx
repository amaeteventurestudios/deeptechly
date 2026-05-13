import Link from "next/link";
import { Star } from "lucide-react";

export function HomeSaveButton({
  label,
  className = ""
}: {
  label: string;
  className?: string;
}) {
  return (
    <Link
      href="/research"
      aria-label={`Save ${label} to research workspace`}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center border border-black bg-white text-ink shadow-[3px_3px_0_#0f0f0f] hover:bg-deepOrange focus:outline-none focus:ring-2 focus:ring-deepOrange focus:ring-offset-2 ${className}`}
    >
      <Star size={16} aria-hidden="true" />
    </Link>
  );
}
