import { NextResponse, type NextRequest } from "next/server";
import { createRouteIdentityProvider } from "@/lib/auth/providers";
import { requestPocketBaseEmailChange } from "@/lib/auth/providers/pocketbase";
import { updateEditableUserProfile } from "@/lib/auth/profiles";

type ProfilePayload = { fullName?: unknown; organization?: unknown; email?: unknown };

export async function POST(request: NextRequest) {
  const authClient = createRouteIdentityProvider(request);
  const identity = await authClient?.getCurrentIdentity();
  if (!authClient || !identity?.providerUserId || !identity.email) {
    return NextResponse.json(
      { error: "You must be signed in to update your profile." },
      { status: 401 }
    );
  }

  let payload: ProfilePayload;
  try {
    payload = (await request.json()) as ProfilePayload;
  } catch {
    return NextResponse.json({ error: "We could not update your profile. Please try again." }, { status: 400 });
  }

  const fullName = cleanText(payload.fullName);
  const organization = cleanOptionalText(payload.organization);
  const email = cleanText(payload.email).toLowerCase();
  if (!fullName || fullName.length > 120) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }
  if (organization && organization.length > 160) {
    return NextResponse.json({ error: "Organization must be 160 characters or fewer." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const profileResult = await updateEditableUserProfile(identity.providerUserId, {
    full_name: fullName,
    organization
  });
  if (!profileResult.ok) {
    return NextResponse.json({ error: "We could not update your profile. Please try again." }, { status: 500 });
  }

  if (email !== identity.email.toLowerCase()) {
    const emailResult = await requestPocketBaseEmailChange(request, email);
    if (!emailResult.ok) {
      return NextResponse.json(
        { error: "The account email could not be updated." },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({
    message: "PROFILE UPDATED",
    profile: {
      fullName: profileResult.profile.full_name,
      organization: profileResult.profile.organization,
      email: identity.email
    },
    emailChangeRequested: email !== identity.email.toLowerCase()
  });
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function cleanOptionalText(value: unknown) {
  return cleanText(value) || null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
