"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle, Star } from "lucide-react";

export type SaveResearchButtonProps = {
  itemId: string;
  itemType: string;
  title: string;
  href: string;
  sector?: string;
  entityName?: string;
  className?: string;
  compact?: boolean;
  source?: string;
};

export function SaveResearchButton({
  itemId,
  itemType,
  title,
  href,
  sector,
  entityName,
  className = "",
  compact = false,
  source = "deeptechly"
}: SaveResearchButtonProps) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  useEffect(() => {
    let active = true;

    async function loadSavedState() {
      try {
        const response = await fetch("/api/saved-research", { cache: "no-store" });
        if (!response.ok) return;

        const body = (await response.json()) as {
          items?: { item_id?: string }[];
        };
        if (
          active &&
          body.items?.some((item) => item.item_id === itemId)
        ) {
          setState("saved");
        }
      } catch {
        // Existing signed-out and unavailable states are handled when the user clicks.
      }
    }

    loadSavedState();

    return () => {
      active = false;
    };
  }, [itemId]);

  async function saveItem() {
    if (state === "saving") {
      return;
    }

    setState("saving");

    try {
      const response = await fetch("/api/saved-research", {
        method: state === "saved" ? "DELETE" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          state === "saved"
            ? { itemId }
            : {
                itemId,
                itemType,
                title,
                href,
                sector,
                entityName,
                source
              }
        )
      });

      if (response.status === 401) {
        const redirectTo = encodeURIComponent(
          `${window.location.pathname}${window.location.search}`
        );
        window.location.href = `/sign-in?redirectTo=${redirectTo}`;
        return;
      }

      if (!response.ok) {
        setState("error");
        return;
      }

      setState(state === "saved" ? "idle" : "saved");
    } catch {
      setState("error");
    }
  }

  const Icon =
    state === "saving" ? LoaderCircle : state === "saved" ? Check : Star;
  const label =
    state === "saving"
      ? "Saving"
      : state === "saved"
        ? "Unsave"
        : state === "error"
          ? "Try Again"
          : compact
            ? "Save"
            : "Save Research";

  return (
    <button
      type="button"
      aria-label={`${label}: ${title}`}
      aria-live="polite"
      className={
        className ||
        "inline-flex min-h-10 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-ink shadow-[3px_3px_0_#0f0f0f] hover:bg-deepOrange disabled:cursor-wait"
      }
      disabled={state === "saving"}
      onClick={saveItem}
      title={state === "error" ? "Save failed. Try again." : undefined}
    >
      <Icon
        size={compact ? 14 : 13}
        aria-hidden="true"
        className={state === "saving" ? "animate-spin" : undefined}
      />
      {compact ? <span className="sr-only">{label}</span> : label}
    </button>
  );
}
