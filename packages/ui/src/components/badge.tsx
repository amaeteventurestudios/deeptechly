import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center border px-2.5 py-1 font-mono text-[0.6875rem] font-bold uppercase leading-none tracking-[0.08em]",
  {
    variants: {
      variant: {
        default: "border-ink bg-ink text-white",
        orange: "border-ink bg-deepOrange text-ink",
        outline: "border-ink bg-transparent text-ink",
        muted: "border-line bg-offWhite text-charcoal",
        success: "border-emerald-800 bg-emerald-50 text-emerald-950",
        warning: "border-amber-800 bg-amber-50 text-amber-950",
        danger: "border-red-800 bg-red-50 text-red-950"
      }
    },
    defaultVariants: { variant: "default" }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
