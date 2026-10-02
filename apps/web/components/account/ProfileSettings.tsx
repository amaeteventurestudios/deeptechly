"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Save, UserRound } from "lucide-react";

type AccountProfileState = {
  fullName: string;
  email: string;
  organization: string;
  accessLevel: string;
  verification: string;
  accountCreated: string;
};

type ProfileSettingsProps = {
  initialProfile: AccountProfileState;
};

export function ProfileSettings({ initialProfile }: ProfileSettingsProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [organization, setOrganization] = useState(initialProfile.organization);
  const [email, setEmail] = useState(initialProfile.email);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  const isDirty = useMemo(
    () =>
      fullName !== profile.fullName ||
      organization !== profile.organization ||
      email !== profile.email,
    [email, fullName, organization, profile]
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fullName.trim()) {
      setStatus("error");
      setMessage("Full name is required.");
      return;
    }

    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName,
          organization,
          email
        })
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
        profile?: {
          fullName: string | null;
          organization: string | null;
          email: string;
        };
        emailChangeRequested?: boolean;
      };

      if (!response.ok || !result.profile) {
        throw new Error(
          result.error || "We could not update your profile. Please try again."
        );
      }

      const nextProfile = {
        ...profile,
        fullName: result.profile.fullName || "",
        organization: result.profile.organization || "",
        email: result.profile.email
      };

      setProfile(nextProfile);
      setFullName(nextProfile.fullName);
      setOrganization(nextProfile.organization);
      setEmail(nextProfile.email);
      setStatus("success");
      setMessage(result.message || "PROFILE UPDATED");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not update your profile. Please try again."
      );
    }
  }

  function onReset() {
    setFullName(profile.fullName);
    setOrganization(profile.organization);
    setEmail(profile.email);
    setStatus("idle");
    setMessage("");
  }

  return (
    <div className="space-y-6">
      <section className="border border-black bg-white p-6 shadow-hard">
        <div className="flex flex-col items-center gap-3 border-b border-black pb-4 text-center sm:flex-row sm:text-left">
          <span className="flex h-12 w-12 items-center justify-center border border-black bg-offWhite text-deepOrange">
            <UserRound size={22} />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
              DeepTechly Profile
            </p>
            <h2 className="mt-1 break-words text-2xl font-black leading-tight">
              {profile.fullName || profile.email}
            </h2>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-px border border-black bg-black sm:grid-cols-2">
          <ProfileTile label="Full Name" value={profile.fullName || "Not provided"} />
          <ProfileTile label="Email" value={profile.email} />
          <ProfileTile
            label="Organization"
            value={profile.organization || "Not provided"}
          />
          <ProfileTile label="Access Level" value={profile.accessLevel} />
          <ProfileTile
            label="Institutional Verification"
            value={profile.verification}
          />
          <ProfileTile label="Account Created" value={profile.accountCreated} />
        </dl>
      </section>

      <section className="border border-black bg-white p-6 shadow-hard">
        <div className="border-b border-black pb-4 text-center sm:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-deepOrange">
            Profile Settings
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-ink">
            Edit account profile
          </h2>
        </div>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <ProfileField
            id="fullName"
            label="Full name"
            value={fullName}
            onChange={setFullName}
            autoComplete="name"
            required
          />
          <ProfileField
            id="organization"
            label="Organization"
            value={organization}
            onChange={setOrganization}
            autoComplete="organization"
          />
          <ProfileField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
            helper="Email changes update your DeepTechly account identity."
          />

          {message ? (
            <p
              className={`border border-black p-3 text-center text-[10px] font-black uppercase tracking-[0.16em] sm:text-left ${
                status === "success"
                  ? "bg-paleOrange text-ink"
                  : "bg-ink text-white"
              }`}
              role="status"
            >
              {message}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={status === "saving" || !isDirty}
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-black bg-deepOrange px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-darkOrange disabled:cursor-not-allowed disabled:bg-offWhite disabled:text-muted"
            >
              <Save size={14} />
              {status === "saving" ? "Saving" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={status === "saving" || !isDirty}
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] shadow-hard hover:bg-paleOrange disabled:cursor-not-allowed disabled:text-muted"
            >
              <RotateCcw size={14} />
              Cancel / Reset
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProfileField({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required,
  helper
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  helper?: string;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="mt-2 min-h-12 w-full border border-black bg-offWhite px-3 py-2 text-base font-black text-ink outline-none focus:bg-white focus:ring-2 focus:ring-deepOrange"
      />
      {helper ? (
        <span className="mt-2 block text-xs font-bold leading-5 text-muted">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function ProfileTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <dt className="text-[9px] font-black uppercase tracking-[0.16em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-base font-black text-ink">{value}</dd>
    </div>
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
