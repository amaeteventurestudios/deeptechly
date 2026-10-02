import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap border border-ink px-5 text-xs font-black uppercase tracking-[0.12em] transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deepOrange focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-deepOrange text-ink shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-burntOrange hover:shadow-hardLg active:translate-x-0 active:translate-y-0 active:shadow-none",
        secondary: "bg-ink text-white shadow-orange hover:bg-charcoal",
        outline: "bg-transparent text-ink hover:bg-paleOrange",
        ghost: "border-transparent bg-transparent text-ink hover:border-ink hover:bg-offWhite",
        destructive: "border-destructive bg-destructive text-destructive-foreground hover:brightness-90"
      },
      size: {
        default: "h-11",
        sm: "h-11 px-3 text-[0.6875rem]",
        lg: "h-12 px-7 text-sm",
        icon: "h-11 w-11 px-0"
      }
    },
    defaultVariants: { variant: "primary", size: "default" }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
