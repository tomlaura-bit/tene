import { desc, eq, sql } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../../db";
import { auditLogs, paymentDestinations, users } from "../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../lib/auth";
import { hasFinancialPermission } from "../../../../lib/finance/permissions";
import { enforceRateLimit } from "../../../../lib/rate-limit";
import { matchesImageSignature } from "../../../../lib/payment-proof";

export const dynamic = "force-dynamic";

async function actorFor(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return null;
  const [actor] = await getDb().select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  return actor ?? null;
}

export async function GET(request: Request) {
  const actor = await actorFor(request);
  if (!actor) return unauthorized();
  if (!(await hasFinancialPermission(actor, "payment.destination.manage")))
    return Response.json({ ok: false, error: "payment_destination_permission_required" }, { status: 403 });
  const destinations = await getDb().select().from(paymentDestinations).orderBy(desc(paymentDestinations.updatedAt));
  return Response.json({ ok: true, destinations: destinations.map(({ qrObjectKey, ...item }) => ({ ...item, hasQr: Boolean(qrObjectKey) })) });
}

export async function POST(request: Request) {
  const actor = await actorFor(request);
  if (!actor) return unauthorized();
  if (!(await hasFinancialPermission(actor, "payment.destination.manage")))
    return Response.json({ ok: false, error: "payment_destination_permission_required" }, { status: 403 });
  const limited = await enforceRateLimit(request, "payment_destination_manage", 5, 600);
  if (limited) return limited;
  const form = await request.formData();
  const method = String(form.get("method") ?? "").toLowerCase();
  const displayName = String(form.get("displayName") ?? "").trim().slice(0, 100);
  const phone = String(form.get("phone") ?? "").replace(/\D/g, "");
  const status = form.get("status") === "active" ? "active" : "inactive";
  const qr = form.get("qr");
  if (!['yape', 'plin'].includes(method) || displayName.length < 3 || !/^9\d{8}$/.test(phone))
    return Response.json({ ok: false, error: "invalid_payment_destination" }, { status: 400 });
  if (qr instanceof File && (!['image/png', 'image/jpeg', 'image/webp'].includes(qr.type) || qr.size < 1 || qr.size > 2 * 1024 * 1024))
    return Response.json({ ok: false, error: "invalid_qr" }, { status: 400 });

  const db = getDb();
  const typedMethod = method as "yape" | "plin";
  const [previous] = await db.select().from(paymentDestinations).where(eq(paymentDestinations.method, typedMethod)).limit(1);
  const now = new Date();
  let newKey = previous?.qrObjectKey ?? null;
  let uploadedKey: string | null = null;
  if (qr instanceof File) {
    const qrBytes = await qr.arrayBuffer();
    if (!matchesImageSignature(qrBytes, qr.type))
      return Response.json({ ok: false, error: "invalid_qr" }, { status: 400 });
    const extension = qr.type === "image/png" ? "png" : qr.type === "image/webp" ? "webp" : "jpg";
    uploadedKey = `payment-destinations/${method}/${crypto.randomUUID()}.${extension}`;
    await env.UPLOADS.put(uploadedKey, qrBytes, { httpMetadata: { contentType: qr.type }, customMetadata: { method, updatedBy: actor.id } });
    newKey = uploadedKey;
  }
  try {
    await db.batch([
      db.insert(paymentDestinations).values({ id: previous?.id ?? `pdst_${crypto.randomUUID()}`, method: typedMethod, displayName, phone, qrObjectKey: newKey, status, version: 1, updatedById: actor.id, updatedAt: now })
        .onConflictDoUpdate({ target: paymentDestinations.method, set: { displayName, phone, qrObjectKey: newKey, status, version: sql`${paymentDestinations.version} + 1`, updatedById: actor.id, updatedAt: now } }),
      db.insert(auditLogs).values({ id: `aud_${crypto.randomUUID()}`, actorId: actor.id, action: "payment_destination_update", entityType: "payment_destination", entityId: method, beforeJson: previous ? JSON.stringify({ method: previous.method, displayName: previous.displayName, phone: previous.phone.slice(-4), status: previous.status, hasQr: Boolean(previous.qrObjectKey) }) : null, afterJson: JSON.stringify({ method, displayName, phone: phone.slice(-4), status, hasQr: Boolean(newKey) }), createdAt: now }),
    ]);
  } catch (error) {
    if (uploadedKey) await env.UPLOADS.delete(uploadedKey);
    throw error;
  }
  if (uploadedKey && previous?.qrObjectKey && previous.qrObjectKey !== uploadedKey) await env.UPLOADS.delete(previous.qrObjectKey);
  return Response.json({ ok: true, destination: { method, displayName, phone, status, hasQr: Boolean(newKey) } });
}
