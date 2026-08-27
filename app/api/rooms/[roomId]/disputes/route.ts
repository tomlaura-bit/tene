import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../../../db";
import { disputeEvidence, matchDisputes, notifications, roomPlayers, rooms, users } from "../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const { roomId } = await params;
  const contentType = request.headers.get("content-type") ?? "";
  const form = contentType.includes("multipart/form-data") ? await request.formData() : null;
  const json = form ? null : await request.json().catch(() => ({}));
  const body = (form ? { reason: form.get("reason"), description: form.get("description"), accusedUserId: form.get("accusedUserId") } : json) as { reason?: string; description?: string; accusedUserId?: string };
  const reasons = ["hacking", "collusion", "wrong_result", "impersonation", "other"] as const;
  if (!reasons.includes(body.reason as (typeof reasons)[number]) || !body.description?.trim() || body.description.trim().length < 10)
    return Response.json({ ok: false, error: "invalid_dispute" }, { status: 400 });
  const db = getDb();
  const [reporter] = await db.select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!reporter) return Response.json({ ok: false, error: "onboarding_required" }, { status: 409 });
  const [membership] = await db.select().from(roomPlayers).where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, reporter.id))).limit(1);
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!membership || !room || !["live", "review"].includes(room.status))
    return Response.json({ ok: false, error: "dispute_not_allowed" }, { status: 409 });
  const [existing] = await db.select().from(matchDisputes).where(and(eq(matchDisputes.roomId, roomId), eq(matchDisputes.reporterId, reporter.id), eq(matchDisputes.status, "pending"))).limit(1);
  if (existing) return Response.json({ ok: true, disputeId: existing.id, alreadyOpen: true });
  if (body.accusedUserId) {
    const [accused] = await db.select().from(roomPlayers).where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, body.accusedUserId))).limit(1);
    if (!accused) return Response.json({ ok: false, error: "accused_not_in_room" }, { status: 400 });
  }
  const id = `dsp_${crypto.randomUUID()}`;
  const now = new Date();
  const evidence = form?.get("evidence");
  let evidenceRow: typeof disputeEvidence.$inferInsert | null = null;
  if (evidence instanceof File && evidence.size > 0) {
    const imageTypes = ["image/jpeg", "image/png", "image/webp"];
    const clipTypes = ["video/mp4", "video/webm"];
    const maxSize = imageTypes.includes(evidence.type) ? 5 * 1024 * 1024 : 25 * 1024 * 1024;
    if (![...imageTypes, ...clipTypes, "application/zip", "application/x-bzip2", "application/octet-stream", ""].includes(evidence.type) || evidence.size > maxSize)
      return Response.json({ ok: false, error: "invalid_evidence" }, { status: 400 });
    const evidenceId = `evd_${crypto.randomUUID()}`;
    const safeExtension = evidence.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
    const storageKey = `dispute-evidence/${roomId}/${id}/${evidenceId}.${safeExtension}`;
    await env.UPLOADS.put(storageKey, await evidence.arrayBuffer(), { httpMetadata: { contentType: evidence.type || "application/octet-stream", contentDisposition: `attachment; filename="${evidence.name.replace(/["\r\n]/g, "_")}"` }, customMetadata: { disputeId: id, reporterId: reporter.id } });
    evidenceRow = { id: evidenceId, disputeId: id, type: imageTypes.includes(evidence.type) ? "image" : clipTypes.includes(evidence.type) ? "clip" : "demo", storageKey, description: evidence.name, createdAt: now };
  }
  try {
    await db.batch([
    db.insert(matchDisputes).values({ id, roomId, reporterId: reporter.id, accusedUserId: body.accusedUserId || null, reason: body.reason as (typeof reasons)[number], description: body.description.trim(), createdAt: now }),
    ...(evidenceRow ? [db.insert(disputeEvidence).values(evidenceRow)] : []),
    db.update(rooms).set({ status: "review" }).where(eq(rooms.id, roomId)),
    db.insert(notifications).values({ id: `not_${crypto.randomUUID()}`, userId: reporter.id, type: "match", title: "Partida en revisión", body: "La liquidación quedó congelada hasta que el staff resuelva tu reporte.", actionUrl: `/rooms/${roomId}`, createdAt: now }),
    ] as [any, ...any[]]);
  } catch {
    if (evidenceRow?.storageKey) await env.UPLOADS.delete(evidenceRow.storageKey);
    return Response.json({ ok: false, error: "dispute_create_failed" }, { status: 409 });
  }
  return Response.json({ ok: true, disputeId: id });
}
