import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { matchDisputes, matchEvents, matchServers, playerRatings, roomPlayers, rooms, users } from "../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const { roomId } = await params;
  const db = getDb();
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return Response.json({ ok: false, error: "room_not_found" }, { status: 404 });
  const players = await db.select({ userId: users.id, nickname: users.nickname, avatarUrl: users.steamAvatarUrl, level: playerRatings.level, elo: playerRatings.elo, team: roomPlayers.team, isCaptain: roomPlayers.isCaptain }).from(roomPlayers).innerJoin(users, eq(roomPlayers.userId, users.id)).leftJoin(playerRatings, eq(users.id, playerRatings.userId)).where(eq(roomPlayers.roomId, roomId));
  const events = await db.select().from(matchEvents).innerJoin(matchServers, eq(matchEvents.serverId, matchServers.id)).where(eq(matchServers.roomId, roomId)).orderBy(asc(matchEvents.createdAt));
  const [server] = await db.select().from(matchServers).where(eq(matchServers.roomId, roomId)).limit(1);
  const disputes = await db.select().from(matchDisputes).where(eq(matchDisputes.roomId, roomId)).orderBy(asc(matchDisputes.createdAt));
  const [viewerUser] = await db.select({ id: users.id }).from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  const viewer = players.find((player) => player.userId === viewerUser?.id) ?? null;
  return Response.json({ ok: true, room, players: players.map((player) => ({ ...player, level: player.level ?? 1, elo: player.elo ?? 1000 })), viewer, server: server ?? null, disputes, events: events.map(({ match_events }) => ({ id: match_events.id, type: match_events.eventType, payload: JSON.parse(match_events.payloadJson), createdAt: match_events.createdAt.toISOString() })) });
}
