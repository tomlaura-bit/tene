import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { matchServers, playerRatings, ratingChanges, rooms, users } from "../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const db = getDb();
  const [me] = await db.select({ id: users.id }).from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!me) return Response.json({ ok: false, error: "account_required" }, { status: 403 });

  const leaderboard = await db
    .select({ userId: users.id, name: users.nickname, avatarUrl: users.steamAvatarUrl, elo: playerRatings.elo, level: playerRatings.level, matches: playerRatings.matches, wins: playerRatings.wins, losses: playerRatings.losses })
    .from(playerRatings)
    .innerJoin(users, eq(playerRatings.userId, users.id))
    .orderBy(desc(playerRatings.elo))
    .limit(50);
  const history = await db
    .select({ id: ratingChanges.id, roomId: ratingChanges.roomId, roomName: rooms.name, beforeElo: ratingChanges.beforeElo, delta: ratingChanges.delta, afterElo: ratingChanges.afterElo, createdAt: ratingChanges.createdAt, map: matchServers.map, teamAScore: matchServers.teamAScore, teamBScore: matchServers.teamBScore })
    .from(ratingChanges)
    .leftJoin(rooms, eq(ratingChanges.roomId, rooms.id))
    .leftJoin(matchServers, eq(ratingChanges.roomId, matchServers.roomId))
    .where(eq(ratingChanges.userId, me.id))
    .orderBy(desc(ratingChanges.createdAt))
    .limit(30);
  const myIndex = leaderboard.findIndex((row) => row.userId === me.id);
  return Response.json({ ok: true, ranking: leaderboard.map((row, index) => ({ ...row, position: index + 1 })), me: myIndex >= 0 ? { ...leaderboard[myIndex], position: myIndex + 1 } : null, history: history.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })) });
}
