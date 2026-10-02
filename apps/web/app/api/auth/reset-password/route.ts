import { NextResponse, type NextRequest } from "next/server";
import { completeAppwritePasswordRecovery } from "@/lib/auth/providers/appwrite";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as {
    userId?: unknown;
    secret?: unknown;
    password?: unknown;
  } | null;
  const userId = clean(payload?.userId);
  const secret = clean(payload?.secret);
  const password = clean(payload?.password);
  if (!userId || !secret || password.length < 8) {
    return NextResponse.json({ error: "This reset request is invalid." }, { status: 400 });
  }
  const result = await completeAppwritePasswordRecovery({ userId, secret, password });
  return result.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
