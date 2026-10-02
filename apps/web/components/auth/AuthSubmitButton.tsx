"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type AuthSubmitButtonProps = {
  children: ReactNode;
  pendingLabel: string;
  className: string;
};

export function AuthSubmitButton({
  children,
  pendingLabel,
  className
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending}
      className={className}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
