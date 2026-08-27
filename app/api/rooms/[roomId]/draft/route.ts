import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { matchEvents, matchServers, roomPlayers, rooms, users } from "../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";
const sequence = ["a", "b", "b", "a", "a", "b", "b", "a"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const { roomId } = await params;
  const body = (await request.json().catch(() => ({}))) as { playerId?: string };
  if (!body.playerId) return Response.json({ ok: false, error: "player_required" }, { status: 400 });
  const db = getDb();
  const [actor] = await db.select({ id: users.id }).from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!actor || !room || room.status !== "draft") return Response.json({ ok: false, error: "draft_unavailable" }, { status: 409 });
  const [captain] = await db.select().from(roomPlayers).where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, actor.id), eq(roomPlayers.isCaptain, true))).limit(1);
  const [target] = await db.select().from(roomPlayers).where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, body.playerId), eq(roomPlayers.team, "pool"))).limit(1);
  if (!captain || !target) return Response.json({ ok: false, error: "invalid_pick" }, { status: 403 });
  let [server] = await db.select().from(matchServers).where(eq(matchServers.roomId, roomId)).limit(1);
  if (!server) {
    const id = `server_${crypto.randomUUID()}`;
    await db.insert(matchServers).values({ id, roomId, status: "provisioning", createdAt: new Date() });
    [server] = await db.select().from(matchServers).where(eq(matchServers.id, id)).limit(1);
  }
  const picks = await db.select().from(matchEvents).where(and(eq(matchEvents.serverId, server.id), eq(matchEvents.eventType, "draft_pick"))).orderBy(asc(matchEvents.createdAt));
  const expectedTeam = sequence[picks.length];
  if (!expectedTeam || captain.team !== expectedTeam) return Response.json({ ok: false, error: "not_your_turn" }, { status: 403 });
  const now = new Date();
  const actions = [
    db.update(roomPlayers).set({ team: expectedTeam }).where(eq(roomPlayers.id, target.id)),
    db.insert(matchEvents).values({ id: `event_${crypto.randomUUID()}`, serverId: server.id, eventType: "draft_pick", payloadJson: JSON.stringify({ captainId: actor.id, playerId: target.userId, team: expectedTeam, order: picks.length + 1 }), createdAt: now }),
  ] as const;
  if (picks.length === 7) {
    const firstTeam = crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0 ? "a" : "b";
    await db.batch([
      ...actions,
      db.insert(matchEvents).values({ id: `event_${crypto.randomUUID()}`, serverId: server.id, eventType: "veto_start", payloadJson: JSON.stringify({ team: firstTeam }), createdAt: new Date(now.getTime() + 1) }),
      db.update(rooms).set({ status: "veto" }).where(eq(rooms.id, roomId)),
    ] as const);
  } else {
    await db.batch(actions);
  }
  return Response.json({ ok: true, pick: { playerId: target.userId, team: expectedTeam } });
}
