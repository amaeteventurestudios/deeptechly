import { timingSafeEqual } from "node:crypto";

export function isAuthorizedWorkerCallback(
  authorization: string | null,
  expectedSecret = process.env.DEEPTECHLY_WORKER_CALLBACK_SECRET
) {
  if (!expectedSecret || expectedSecret.length < 24) return false;
  const prefix = "Bearer ";
  if (!authorization?.startsWith(prefix)) return false;
  const supplied = authorization.slice(prefix.length);
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expectedSecret);
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}
