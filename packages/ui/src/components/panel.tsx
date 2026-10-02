import * as React from "react";
import { cn } from "../lib/cn";

const Panel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("border border-ink bg-paper text-ink", className)} {...props} />
  )
);
Panel.displayName = "Panel";

const PanelHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("border-b border-ink p-5 sm:p-6", className)} {...props} />
  )
);
PanelHeader.displayName = "PanelHeader";

const PanelTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-serif text-2xl font-bold leading-tight tracking-tight", className)} {...props} />
  )
);
PanelTitle.displayName = "PanelTitle";

const PanelDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("mt-2 max-w-prose text-sm leading-6 text-muted", className)} {...props} />
  )
);
PanelDescription.displayName = "PanelDescription";

const PanelContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-5 sm:p-6", className)} {...props} />
);
PanelContent.displayName = "PanelContent";

const PanelFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center border-t border-ink p-5 sm:p-6", className)} {...props} />
  )
);
PanelFooter.displayName = "PanelFooter";

export { Panel, PanelHeader, PanelTitle, PanelDescription, PanelContent, PanelFooter };
