import * as React from "react";
import { cn } from "../lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("border-t-4 border-ink pt-4", className)}>
      {eyebrow ? <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-darkOrange">{eyebrow}</p> : null}
      <h2 className="max-w-4xl font-serif text-3xl font-black leading-[1.05] tracking-[-0.025em] sm:text-4xl lg:text-5xl">{title}</h2>
      {description ? <p className="mt-4 max-w-2xl text-base leading-7 text-charcoal">{description}</p> : null}
    </div>
  );
}
