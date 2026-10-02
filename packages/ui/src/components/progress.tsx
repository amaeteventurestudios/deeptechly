import * as React from "react";
import { cn } from "../lib/cn";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  label?: string;
}

function Progress({ value = 0, label = "Progress", className, ...props }: ProgressProps) {
  const bounded = Math.min(100, Math.max(0, value));
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={bounded}
      className={cn("h-3 w-full overflow-hidden border border-ink bg-white", className)}
      role="progressbar"
      {...props}
    >
      <div className="h-full bg-deepOrange transition-[width] duration-300" style={{ width: `${bounded}%` }} />
    </div>
  );
}

export { Progress };
