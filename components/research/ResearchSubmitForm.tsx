"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function ResearchSubmitForm({
  compact = false,
  onSubmitted
}: {
  compact?: boolean;
  onSubmitted?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setError("Enter a company, patent, lab, technology, or government program.");
      return;
    }

    setSubmitting(true);
    setError(null);
    onSubmitted?.();

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: trimmed, mode: "company" })
      });
      const body = (await response.json()) as {
        jobId?: string;
        error?: string;
      };

      if (!response.ok || !body.jobId) {
        throw new Error(body.error ?? "Research job could not be created.");
      }

      router.push(`/research?jobId=${body.jobId}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Research job could not be created."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`flex max-w-2xl flex-col gap-3 border border-black bg-white p-2 shadow-hard sm:flex-row ${
        compact ? "" : "mt-7"
      }`}
    >
      <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
        <Search size={18} />
        <input
          aria-label="Research query"
          className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
          placeholder="e.g. Anduril, NASA SiGe on sapphire, DARPA NOM4D, or openai.com"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <button
        className="border border-black bg-ink px-5 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:bg-muted"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Queuing" : "Begin"}
      </button>
      {error ? (
        <p className="px-3 pb-2 text-xs font-bold text-darkOrange sm:basis-full">
          {error}
        </p>
      ) : null}
    </form>
  );
}
