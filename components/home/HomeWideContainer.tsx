import type { ReactNode } from "react";

export function HomeWideContainer({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[1560px] px-4 sm:px-5 lg:px-8 2xl:px-10 ${className}`}
    >
      {children}
    </div>
  );
}
