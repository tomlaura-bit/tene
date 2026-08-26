import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { matchDisputes, notifications, roomPlayers, rooms, users } from "../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const { roomId } = await params;
  const body = (await request.json()) as { reason?: string; description?: string; accusedUserId?: string };
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
  await db.batch([
    db.insert(matchDisputes).values({ id, roomId, reporterId: reporter.id, accusedUserId: body.accusedUserId || null, reason: body.reason as (typeof reasons)[number], description: body.description.trim(), createdAt: now }),
    db.update(rooms).set({ status: "review" }).where(eq(rooms.id, roomId)),
    db.insert(notifications).values({ id: `not_${crypto.randomUUID()}`, userId: reporter.id, type: "match", title: "Partida en revisión", body: "La liquidación quedó congelada hasta que el staff resuelva tu reporte.", actionUrl: `/rooms/${roomId}`, createdAt: now }),
  ]);
  return Response.json({ ok: true, disputeId: id });
}
