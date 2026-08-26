import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { matchEvents, matchServers, roomPlayers, rooms, users } from "../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";
const mapPool = ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Dust II", "Train"];

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const { roomId } = await params;
  const body = (await request.json().catch(() => ({}))) as { map?: string; side?: "ct" | "t" };
  const db = getDb();
  const [actor] = await db.select({ id: users.id }).from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  const [captain] = actor ? await db.select().from(roomPlayers).where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, actor.id), eq(roomPlayers.isCaptain, true))).limit(1) : [];
  const [server] = await db.select().from(matchServers).where(eq(matchServers.roomId, roomId)).limit(1);
  if (!actor || !room || room.status !== "veto" || !captain || !server) return Response.json({ ok: false, error: "veto_unavailable" }, { status: 409 });
  const events = await db.select().from(matchEvents).where(eq(matchEvents.serverId, server.id)).orderBy(asc(matchEvents.createdAt));
  const start = events.find((event) => event.eventType === "veto_start");
  const firstTeam = (start ? JSON.parse(start.payloadJson).team : "a") as "a" | "b";
  const bans = events.filter((event) => event.eventType === "map_ban");
  const banned = bans.map((event) => JSON.parse(event.payloadJson).map as string);
  if (bans.length < 6) {
    if (!body.map || !mapPool.includes(body.map) || banned.includes(body.map)) return Response.json({ ok: false, error: "invalid_map" }, { status: 400 });
    const expected = bans.length % 2 === 0 ? firstTeam : firstTeam === "a" ? "b" : "a";
    if (captain.team !== expected) return Response.json({ ok: false, error: "not_your_turn" }, { status: 403 });
    await db.insert(matchEvents).values({ id: `event_${crypto.randomUUID()}`, serverId: server.id, eventType: "map_ban", payloadJson: JSON.stringify({ map: body.map, team: captain.team, order: bans.length + 1 }), createdAt: new Date() });
    return Response.json({ ok: true, remaining: mapPool.filter((map) => ![...banned, body.map!].includes(map)) });
  }
  const selectedMap = mapPool.find((map) => !banned.includes(map));
  const lastBanTeam = JSON.parse(bans[bans.length - 1].payloadJson).team as "a" | "b";
  const chooserTeam = lastBanTeam === "a" ? "b" : "a";
  if (!body.side || captain.team !== chooserTeam) return Response.json({ ok: false, error: "side_choice_required" }, { status: 403 });
  const now = new Date();
  await db.batch([
    db.insert(matchEvents).values({ id: `event_${crypto.randomUUID()}`, serverId: server.id, eventType: "side_choice", payloadJson: JSON.stringify({ team: chooserTeam, side: body.side }), createdAt: now }),
    db.update(matchServers).set({ map: selectedMap, status: "ready" }).where(eq(matchServers.id, server.id)),
    db.update(rooms).set({ status: "live" }).where(eq(rooms.id, roomId)),
  ]);
  return Response.json({ ok: true, map: selectedMap, side: body.side, status: "live" });
}
