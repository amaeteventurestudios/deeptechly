"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";
import { PasswordSuggestionField } from "@/components/auth/PasswordSuggestionField";

type ResetPasswordFormProps = { token?: string };
type FormState = "ready" | "submitting" | "success" | "error";

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const validLink = Boolean(token);
  const [state, setState] = useState<FormState>(validLink ? "ready" : "error");
  const [message, setMessage] = useState(
    validLink
      ? "Enter a new password for your DeepTechly account."
      : "Open the reset link from your email before setting a new password."
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validLink || state === "submitting") return;
    const formData = new FormData(event.currentTarget);
    const password = getField(formData, "password");
    const confirmPassword = getField(formData, "confirmPassword");
    if (password.length < 8) { setState("error"); setMessage("Use at least 8 characters for the new password."); return; }
    if (password !== confirmPassword) { setState("error"); setMessage("The password confirmation does not match."); return; }

    setState("submitting");
    setMessage("Updating your password...");
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    if (!response.ok) {
      setState("error");
      setMessage("The password could not be updated. Request a fresh reset link.");
      return;
    }
    setState("success");
    setMessage("Your password has been updated. Sign in with the new password.");
  }

  const canSubmit = validLink && state !== "success";
  return (
    <div className="border border-black bg-white p-8 shadow-hard">
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center border border-deepOrange bg-deepOrange text-ink"><KeyRound size={16} strokeWidth={2.6} /></span>
        <span className="text-base font-black tracking-tight">DeepTechly</span>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-deepOrange">New Password</p>
      <p className={`mt-4 border border-black px-3 py-2 text-xs font-bold text-ink ${state === "error" ? "bg-paleOrange" : "bg-offWhite"}`}>{message}</p>
      {state === "success" ? (
        <Link href="/sign-in" className="mt-6 flex w-full items-center justify-between border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-darkOrange">Back to Sign In<ArrowRight size={14} /></Link>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <PasswordSuggestionField confirmLabel="Confirm Password" confirmName="confirmPassword" disabled={state === "submitting"} label="New Password" minLength={8} name="password" />
          <button className="flex w-full items-center justify-between border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-darkOrange disabled:cursor-not-allowed disabled:bg-offWhite disabled:text-muted" disabled={!canSubmit || state === "submitting"} type="submit">
            {state === "submitting" ? "Updating..." : "Update Password"}<ArrowRight size={14} />
          </button>
        </form>
      )}
    </div>
  );
}

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
