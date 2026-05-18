"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyInviteCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      className="inline-flex items-center gap-1.5 border border-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] hover:bg-paleOrange"
      onClick={copyCode}
      type="button"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
