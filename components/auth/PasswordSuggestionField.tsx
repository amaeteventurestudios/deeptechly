"use client";

import { useId, useState } from "react";
import { Copy, Eye, EyeOff, Wand2 } from "lucide-react";

const passwordWords = [
  "Anchor",
  "Atlas",
  "Beacon",
  "Bridge",
  "Cipher",
  "Comet",
  "Copper",
  "Delta",
  "Echo",
  "Falcon",
  "Forge",
  "Harbor",
  "Helix",
  "Ion",
  "Kepler",
  "Lattice",
  "Matrix",
  "Meridian",
  "Nimbus",
  "Nova",
  "Orbit",
  "Photon",
  "Pilot",
  "Prism",
  "Quartz",
  "Radar",
  "Signal",
  "Summit",
  "Vector",
  "Vertex",
  "Violet",
  "Voyage",
  "Zenith"
];

type PasswordSuggestionFieldProps = {
  label: string;
  name: string;
  confirmLabel?: string;
  confirmName?: string;
  disabled?: boolean;
  inputClassName?: string;
  labelClassName?: string;
  minLength?: number;
  required?: boolean;
};

export function PasswordSuggestionField({
  label,
  name,
  confirmLabel,
  confirmName,
  disabled = false,
  inputClassName = "mt-2 w-full border border-black bg-offWhite px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-deepOrange disabled:cursor-not-allowed disabled:text-muted",
  labelClassName = "text-[10px] font-black uppercase tracking-[0.18em] text-ink",
  minLength,
  required = true
}: PasswordSuggestionFieldProps) {
  const id = useId();
  const passwordId = `${id}-${name}`;
  const confirmId = confirmName ? `${id}-${confirmName}` : undefined;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");

  function suggestPassword() {
    const nextPassword = generateSuggestedPassword();
    setPassword(nextPassword);
    setConfirmPassword(nextPassword);
    setIsVisible(true);
    setHasGenerated(true);
    setCopyLabel("Copy");
  }

  async function copyPassword() {
    if (!password || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(password);
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy"), 1600);
  }

  return (
    <div className="space-y-3">
      <label className="block" htmlFor={passwordId}>
        <span className={labelClassName}>{label}</span>
        <input
          autoComplete="new-password"
          className={inputClassName}
          disabled={disabled}
          id={passwordId}
          minLength={minLength}
          name={name}
          onChange={(event) => {
            setPassword(event.target.value);
            setCopyLabel("Copy");
          }}
          required={required}
          type={isVisible ? "text" : "password"}
          value={password}
        />
      </label>

      {confirmName && confirmLabel ? (
        <label className="block" htmlFor={confirmId}>
          <span className={labelClassName}>{confirmLabel}</span>
          <input
            autoComplete="new-password"
            className={inputClassName}
            disabled={disabled}
            id={confirmId}
            minLength={minLength}
            name={confirmName}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required={required}
            type={isVisible ? "text" : "password"}
            value={confirmPassword}
          />
        </label>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-ink hover:bg-paleOrange disabled:cursor-not-allowed disabled:text-muted"
          disabled={disabled}
          onClick={suggestPassword}
          type="button"
        >
          <Wand2 size={14} aria-hidden="true" />
          Suggest Password
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-white px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-ink hover:bg-paleOrange disabled:cursor-not-allowed disabled:text-muted"
          disabled={disabled || !password}
          onClick={() => setIsVisible((current) => !current)}
          type="button"
        >
          {isVisible ? (
            <EyeOff size={14} aria-hidden="true" />
          ) : (
            <Eye size={14} aria-hidden="true" />
          )}
          {isVisible ? "Hide" : "Show"}
        </button>
        {hasGenerated ? (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-black bg-ink px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white hover:bg-charcoal disabled:cursor-not-allowed disabled:bg-muted"
            disabled={disabled || !password}
            onClick={copyPassword}
            type="button"
          >
            <Copy size={14} aria-hidden="true" />
            {copyLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function generateSuggestedPassword() {
  const firstWord = pickWord();
  const secondWord = pickWord([firstWord]);
  const thirdWord = pickWord([firstWord, secondWord]);
  const number = 100 + randomInt(900);

  return `${firstWord}-${number}#${secondWord}-${thirdWord}!`;
}

function pickWord(excludedWords: string[] = []) {
  const availableWords = passwordWords.filter(
    (word) => !excludedWords.includes(word)
  );

  return availableWords[randomInt(availableWords.length)];
}

function randomInt(maxExclusive: number) {
  if (maxExclusive <= 0) {
    throw new Error("Password generator requires a positive range.");
  }

  const maxUint32 = 0xffffffff;
  const limit = maxUint32 - (maxUint32 % maxExclusive);
  const values = new Uint32Array(1);

  do {
    crypto.getRandomValues(values);
  } while (values[0] >= limit);

  return values[0] % maxExclusive;
}
