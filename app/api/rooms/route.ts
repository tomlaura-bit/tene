import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { playerRatings, roomPlayers, rooms, users } from "../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const roomRows = await db
    .select()
    .from(rooms)
    .orderBy(desc(rooms.createdAt))
    .limit(30);
  if (!roomRows.length) return Response.json({ ok: true, rooms: [] });

  const ids = roomRows.map((room) => room.id);
  const memberships = await db
    .select({
      roomId: roomPlayers.roomId,
      userId: users.id,
      nickname: users.nickname,
      avatarUrl: users.steamAvatarUrl,
      steamId64: users.steamId64,
      hours: users.cs2Minutes,
      level: playerRatings.level,
      elo: playerRatings.elo,
    })
    .from(roomPlayers)
    .innerJoin(users, eq(roomPlayers.userId, users.id))
    .leftJoin(playerRatings, eq(users.id, playerRatings.userId))
    .where(inArray(roomPlayers.roomId, ids));

  const creatorIds = roomRows.flatMap((room) =>
    room.createdById ? [room.createdById] : [],
  );
  const creators = creatorIds.length
    ? await db
        .select({
          id: users.id,
          nickname: users.nickname,
          avatarUrl: users.steamAvatarUrl,
        })
        .from(users)
        .where(inArray(users.id, creatorIds))
    : [];

  return Response.json({
    ok: true,
    rooms: roomRows.map((room) => ({
      ...room,
      creator:
        creators.find((creator) => creator.id === room.createdById) ?? null,
      players: memberships
        .filter((membership) => membership.roomId === room.id)
        .map((membership) => ({
          ...membership,
          hours: Math.floor(membership.hours / 60),
          level: membership.level ?? 1,
          elo: membership.elo ?? 1000,
          conduct: "Sin sanciones activas",
        })),
    })),
  });
}

export async function POST(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!user || !["owner", "admin", "mod"].includes(user.role))
    return Response.json(
      { ok: false, error: "staff_required" },
      { status: 403 },
    );

  const body = (await request.json().catch(() => ({}))) as { name?: string };
  const name = body.name?.trim();
  if (!name || name.length < 3 || name.length > 60)
    return Response.json({ ok: false, error: "invalid_name" }, { status: 400 });

  const id = `room_${crypto.randomUUID()}`;
  await db
    .insert(rooms)
    .values({ id, createdById: user.id, name, createdAt: new Date() });
  return Response.json({ ok: true, room: { id, name } }, { status: 201 });
}
