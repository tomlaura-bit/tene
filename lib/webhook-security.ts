import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { webhookReceipts } from "../db/schema";

export async function secureEqual(actual: string | null, expected: string) {
  if (!actual) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", encoder.encode(actual)), crypto.subtle.digest("SHA-256", encoder.encode(expected))]);
  const left = new Uint8Array(a); const right = new Uint8Array(b);
  let mismatch = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) mismatch |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return mismatch === 0;
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyHmacWebhook(input: { rawBody: string; secret: string; signature: string | null; timestamp: string | null; toleranceSeconds?: number }) {
  if (!input.signature || !input.timestamp || !/^\d{10}$/.test(input.timestamp)) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(input.timestamp));
  if (age > (input.toleranceSeconds ?? 300)) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(input.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${input.timestamp}.${input.rawBody}`));
  const expected = Array.from(new Uint8Array(signed), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return secureEqual(input.signature.replace(/^sha256=/, "").toLowerCase(), expected);
}

export async function webhookReceipt(provider: string, roomId: string, rawBody: string, externalEventId?: string | null, occurredAt?: Date | null) {
  const payloadHash = await sha256Hex(rawBody);
  const id = await sha256Hex(`${provider}:${externalEventId ?? roomId}:${payloadHash}`);
  const db = getDb();
  const result = await db.insert(webhookReceipts).values({ id, provider, roomId, externalEventId: externalEventId ?? null, payloadHash, occurredAt: occurredAt ?? null, receivedAt: new Date() }).onConflictDoNothing();
  return { duplicate: Number((result as { meta?: { changes?: number } }).meta?.changes ?? 0) === 0, release: () => db.delete(webhookReceipts).where(eq(webhookReceipts.id, id)) };
}
