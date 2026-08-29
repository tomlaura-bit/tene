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

export async function webhookReceipt(provider: string, roomId: string, rawBody: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${provider}:${roomId}:${rawBody}`));
  const id = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const db = getDb();
  const result = await db.insert(webhookReceipts).values({ id, provider, roomId, receivedAt: new Date() }).onConflictDoNothing();
  return { duplicate: Number((result as { meta?: { changes?: number } }).meta?.changes ?? 0) === 0, release: () => db.delete(webhookReceipts).where(eq(webhookReceipts.id, id)) };
}
