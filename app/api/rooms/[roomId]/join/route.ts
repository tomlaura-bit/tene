import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../../../../../db";
import {
  ledgerEntries,
  playerRatings,
  roomPlayers,
  rooms,
  users,
  wallets,
} from "../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const { roomId } = await params;
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!user)
    return Response.json(
      { ok: false, error: "onboarding_required" },
      { status: 409 },
    );
  if (user.status !== "verified")
    return Response.json(
      { ok: false, error: "staff_verification_required" },
      { status: 403 },
    );

  const [room] = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);
  if (!room || room.status !== "open")
    return Response.json(
      { ok: false, error: "room_unavailable" },
      { status: 409 },
    );
  const [existing] = await db
    .select({ id: roomPlayers.id })
    .from(roomPlayers)
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, user.id)))
    .limit(1);
  if (existing) return Response.json({ ok: true, alreadyJoined: true });
  const members = await db
    .select({ id: roomPlayers.id })
    .from(roomPlayers)
    .where(eq(roomPlayers.roomId, roomId));
  if (members.length >= 10)
    return Response.json({ ok: false, error: "room_full" }, { status: 409 });

  const charged = await db
    .update(wallets)
    .set({
      availableCents: sql`${wallets.availableCents} - ${room.entryCents}`,
      lockedCents: sql`${wallets.lockedCents} + ${room.entryCents}`,
    })
    .where(
      and(
        eq(wallets.userId, user.id),
        gte(wallets.availableCents, room.entryCents),
      ),
    )
    .returning({
      availableCents: wallets.availableCents,
      lockedCents: wallets.lockedCents,
    });
  if (!charged.length)
    return Response.json(
      { ok: false, error: "insufficient_balance" },
      { status: 402 },
    );

  try {
    await db.batch([
      db.insert(roomPlayers).values({
        id: `rp_${crypto.randomUUID()}`,
        roomId,
        userId: user.id,
        joinedAt: new Date(),
      }),
      db.insert(ledgerEntries).values({
        id: `led_${crypto.randomUUID()}`,
        userId: user.id,
        roomId,
        type: "entry_lock",
        amountCents: -room.entryCents,
        description: `Reserva en ${room.name}`,
        createdAt: new Date(),
      }),
    ]);
  } catch {
    await db
      .update(wallets)
      .set({
        availableCents: sql`${wallets.availableCents} + ${room.entryCents}`,
        lockedCents: sql`${wallets.lockedCents} - ${room.entryCents}`,
      })
      .where(eq(wallets.userId, user.id));
    return Response.json(
      { ok: false, error: "reservation_conflict" },
      { status: 409 },
    );
  }

  const fullRoom = await db
    .select({ id: roomPlayers.id, userId: roomPlayers.userId, level: playerRatings.level, elo: playerRatings.elo })
    .from(roomPlayers)
    .leftJoin(playerRatings, eq(roomPlayers.userId, playerRatings.userId))
    .where(eq(roomPlayers.roomId, roomId));
  if (fullRoom.length === 10) {
    const captains = [...fullRoom].sort((a, b) => (b.level ?? 1) - (a.level ?? 1) || (b.elo ?? 1000) - (a.elo ?? 1000)).slice(0, 2);
    await db.batch([
      db.update(roomPlayers).set({ isCaptain: true, team: "a" }).where(eq(roomPlayers.id, captains[0].id)),
      db.update(roomPlayers).set({ isCaptain: true, team: "b" }).where(eq(roomPlayers.id, captains[1].id)),
      db.update(rooms).set({ status: "draft" }).where(eq(rooms.id, roomId)),
    ]);
  }

  return Response.json({ ok: true, wallet: charged[0] });
}
