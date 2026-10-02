import * as React from "react";
import { Badge } from "./badge";
import { cn } from "../lib/cn";

export type ConfidenceLevel = "high" | "moderate" | "limited" | "low";

const confidenceLabels: Record<ConfidenceLevel, string> = {
  high: "High confidence",
  moderate: "Moderate confidence",
  limited: "Limited public data",
  low: "Low confidence"
};

const confidenceVariants: Record<ConfidenceLevel, "success" | "warning" | "muted" | "danger"> = {
  high: "success",
  moderate: "warning",
  limited: "muted",
  low: "danger"
};

export function ConfidenceBadge({ level, className }: { level: ConfidenceLevel; className?: string }) {
  return <Badge className={className} variant={confidenceVariants[level]}>{confidenceLabels[level]}</Badge>;
}

export function ResearchMetadata({
  sourceCount,
  confidence,
  updated,
  className
}: {
  sourceCount: number;
  confidence: ConfidenceLevel;
  updated?: string;
  className?: string;
}) {
  return (
    <dl className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em]", className)}>
      <div className="flex items-center gap-1.5">
        <dt className="text-muted">Sources</dt>
        <dd className="font-bold text-ink">{sourceCount}</dd>
      </div>
      {updated ? (
        <div className="flex items-center gap-1.5">
          <dt className="text-muted">Updated</dt>
          <dd className="font-bold text-ink">{updated}</dd>
        </div>
      ) : null}
      <div>
        <dt className="sr-only">Confidence</dt>
        <dd><ConfidenceBadge level={confidence} /></dd>
      </div>
    </dl>
  );
}
