import { NextResponse, type NextRequest } from "next/server";
import { completePocketBasePasswordRecovery } from "@/lib/auth/providers/pocketbase";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as {
    token?: unknown;
    password?: unknown;
  } | null;
  const token = clean(payload?.token);
  const password = clean(payload?.password);
  if (!token || password.length < 8) {
    return NextResponse.json({ error: "This reset request is invalid." }, { status: 400 });
  }
  const result = await completePocketBasePasswordRecovery({ token, password });
  return result.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
