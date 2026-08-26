import { eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { auditLogs, matchDisputes, notifications, rooms, users } from "../../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ disputeId: string }> }) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const { disputeId } = await params;
  const body = (await request.json()) as { decision?: "upheld" | "dismissed"; resolution?: string };
  if (!["upheld", "dismissed"].includes(body.decision ?? "") || !body.resolution?.trim()) return Response.json({ ok: false, error: "invalid_review" }, { status: 400 });
  const db = getDb();
  const [actor] = await db.select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!actor || !["owner", "admin", "mod"].includes(actor.role)) return Response.json({ ok: false, error: "staff_required" }, { status: 403 });
  const [dispute] = await db.select().from(matchDisputes).where(eq(matchDisputes.id, disputeId)).limit(1);
  if (!dispute || dispute.status !== "pending") return Response.json({ ok: false, error: "dispute_not_pending" }, { status: 409 });
  const now = new Date();
  await db.batch([
    db.update(matchDisputes).set({ status: body.decision!, resolution: body.resolution.trim(), reviewedById: actor.id, reviewedAt: now }).where(eq(matchDisputes.id, disputeId)),
    ...(body.decision === "dismissed" ? [db.update(rooms).set({ status: "live" }).where(eq(rooms.id, dispute.roomId))] : []),
    db.insert(notifications).values({ id: `not_${crypto.randomUUID()}`, userId: dispute.reporterId, type: "staff", title: body.decision === "upheld" ? "Impugnación confirmada" : "Impugnación descartada", body: body.resolution.trim(), actionUrl: `/rooms/${dispute.roomId}`, createdAt: now }),
    db.insert(auditLogs).values({ id: `aud_${crypto.randomUUID()}`, actorId: actor.id, targetUserId: dispute.accusedUserId, action: `dispute_${body.decision}`, entityType: "match_dispute", entityId: disputeId, afterJson: JSON.stringify({ decision: body.decision }), reason: body.resolution.trim(), createdAt: now }),
  ]);
  return Response.json({ ok: true });
}
