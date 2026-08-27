import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { playerRatings, roomPlayers, rooms, users } from "../../../db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const roomRows = await db.select().from(rooms).orderBy(desc(rooms.createdAt)).limit(10);
  const memberships = roomRows.length ? await db.select({ roomId: roomPlayers.roomId, nickname: users.nickname, avatarUrl: users.steamAvatarUrl, level: playerRatings.level, isCaptain: roomPlayers.isCaptain }).from(roomPlayers).innerJoin(users, eq(roomPlayers.userId, users.id)).leftJoin(playerRatings, eq(users.id, playerRatings.userId)).where(inArray(roomPlayers.roomId, roomRows.map((r) => r.id))) : [];
  const ranking = await db.select({ userId: users.id, name: users.nickname, elo: playerRatings.elo, level: playerRatings.level }).from(playerRatings).innerJoin(users, eq(playerRatings.userId, users.id)).orderBy(desc(playerRatings.elo)).limit(10);
  const activePlayers = new Set(memberships.filter((m) => roomRows.find((r) => r.id === m.roomId && !["settled", "cancelled"].includes(r.status))).map((m) => m.nickname)).size;
  return Response.json({ ok: true, activePlayers, rooms: roomRows.map((room) => ({ ...room, players: memberships.filter((m) => m.roomId === room.id) })), ranking: ranking.map((row, index) => ({ ...row, position: index + 1 })) });
}
