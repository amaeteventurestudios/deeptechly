import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";

export function encryptServerSecret(value: string) {
  const key = settingsKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(":");
}

export function decryptServerSecret(value: string) {
  const [version, iv, tag, encrypted] = value.split(":");
  if (version !== VERSION || !iv || !tag || !encrypted) throw new Error("Unsupported encrypted secret");
  const decipher = createDecipheriv("aes-256-gcm", settingsKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

function settingsKey() {
  const encoded = process.env.DEEPTECHLY_SETTINGS_ENCRYPTION_KEY?.trim();
  if (!encoded) throw new Error("Settings encryption is not configured");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error("DEEPTECHLY_SETTINGS_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  return key;
}
