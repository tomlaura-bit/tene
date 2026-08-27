import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { auditLogs, benefitPasses, ledgerEntries, matchServers, notifications, roomPlayers, rooms, users, wallets } from "../../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const { roomId } = await params;
  const body = (await request.json()) as { reason?: string; sanctionedUserId?: string };
  if (!body.reason?.trim() || body.reason.trim().length < 5) return Response.json({ ok: false, error: "reason_required" }, { status: 400 });
  const db = getDb();
  const [actor] = await db.select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!actor || !["owner", "admin"].includes(actor.role)) return Response.json({ ok: false, error: "staff_required" }, { status: 403 });
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room || ["settled", "cancelled"].includes(room.status)) return Response.json({ ok: false, error: "room_not_cancellable" }, { status: 409 });
  const players = await db.select().from(roomPlayers).where(eq(roomPlayers.roomId, roomId));
  const passes = await db.select().from(benefitPasses).where(and(eq(benefitPasses.roomId, roomId), eq(benefitPasses.status, "used")));
  const passByUser = new Map(passes.map((pass) => [pass.userId, pass]));
  if (body.sanctionedUserId && !players.some((p) => p.userId === body.sanctionedUserId)) return Response.json({ ok: false, error: "sanctioned_user_not_in_room" }, { status: 400 });
  const now = new Date();
  const actions: any[] = [];
  for (const player of players) {
    const sanctioned = player.userId === body.sanctionedUserId;
    const usedPass = passByUser.get(player.userId);
    if (usedPass) {
      if (!sanctioned) actions.push(db.update(benefitPasses).set({ status: "available", roomId: null }).where(eq(benefitPasses.id, usedPass.id)));
    } else actions.push(db.update(wallets).set({ lockedCents: sql`${wallets.lockedCents} - ${room.entryCents}`, availableCents: sql`${wallets.availableCents} + ${sanctioned ? 0 : room.entryCents}` }).where(and(eq(wallets.userId, player.userId), gte(wallets.lockedCents, room.entryCents))));
    actions.push(db.insert(ledgerEntries).values({ id: `led_${crypto.randomUUID()}`, userId: player.userId, roomId, type: sanctioned ? "penalty" : "entry_release", amountCents: usedPass ? 0 : sanctioned ? -room.entryCents : room.entryCents, description: sanctioned ? `Entrada o pase retenido por sanción: ${body.reason.trim()}` : usedPass ? `Pase devuelto por cancelación de ${room.name}` : `Devolución por cancelación de ${room.name}`, createdAt: now }));
    actions.push(db.insert(notifications).values({ id: `not_${crypto.randomUUID()}`, userId: player.userId, type: sanctioned ? "sanction" : "wallet", title: sanctioned ? "Entrada retenida" : "Entrada devuelta", body: sanctioned ? body.reason.trim() : `Se devolvieron S/ ${(room.entryCents / 100).toFixed(2)} a tu saldo.`, actionUrl: `/rooms/${roomId}`, createdAt: now }));
  }
  actions.push(db.update(rooms).set({ status: "cancelled" }).where(eq(rooms.id, roomId)));
  actions.push(db.update(matchServers).set({ status: "failed", finishedAt: now }).where(eq(matchServers.roomId, roomId)));
  actions.push(db.insert(auditLogs).values({ id: `aud_${crypto.randomUUID()}`, actorId: actor.id, targetUserId: body.sanctionedUserId || null, action: "room_cancelled", entityType: "room", entityId: roomId, afterJson: JSON.stringify({ refunded: players.length - (body.sanctionedUserId ? 1 : 0), sanctionedUserId: body.sanctionedUserId || null }), reason: body.reason.trim(), createdAt: now }));
  await db.batch(actions as [any, ...any[]]);
  return Response.json({ ok: true });
}
