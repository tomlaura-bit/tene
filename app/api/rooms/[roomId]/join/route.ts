import { and, asc, eq, gt, gte, isNull, or, sql } from "drizzle-orm";
import { getD1, getDb } from "../../../../../db";
import {
  benefitPasses,
  ledgerEntries,
  playerRatings,
  roomPlayers,
  rooms,
  users,
  wallets,
} from "../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../lib/auth";
import { enforceRateLimit } from "../../../../../lib/rate-limit";
import { claimRoomSlot, releaseRoomSlot } from "../../../../../lib/room-reservation";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const limited = await enforceRateLimit(request, "room_join", 10, 60);
  if (limited) return limited;
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
  if (!user.termsAcceptedAt || !user.privacyAcceptedAt || user.legalVersion !== "2026-08-27")
    return Response.json({ ok: false, error: "legal_acceptance_required" }, { status: 403 });
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
  const reservationId = `rp_${crypto.randomUUID()}`;
  const slotNumber = await claimRoomSlot(getD1(), {
    id: reservationId,
    roomId,
    userId: user.id,
  });
  if (!slotNumber)
    return Response.json({ ok: false, error: "room_full" }, { status: 409 });

  const now = new Date();
  const [passCandidate] = await db.select().from(benefitPasses).where(and(eq(benefitPasses.userId, user.id), eq(benefitPasses.status, "available"), or(isNull(benefitPasses.expiresAt), gt(benefitPasses.expiresAt, now)))).orderBy(asc(benefitPasses.createdAt)).limit(1);
  const claimedPass = passCandidate ? await db.update(benefitPasses).set({ status: "reserved", roomId }).where(and(eq(benefitPasses.id, passCandidate.id), eq(benefitPasses.status, "available"))).returning() : [];
  const pass = claimedPass[0] ?? null;
  const charged = pass ? [{ availableCents: 0, lockedCents: 0 }] : await db
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
  if (!charged.length) {
    await releaseRoomSlot(getD1(), reservationId);
    return Response.json(
      { ok: false, error: "insufficient_balance" },
      { status: 402 },
    );
  }

  try {
    await db.batch([
      ...(pass ? [db.update(benefitPasses).set({ status: "used" }).where(and(eq(benefitPasses.id, pass.id), eq(benefitPasses.status, "reserved")))] : []),
      db.insert(ledgerEntries).values({
        id: `led_${crypto.randomUUID()}`,
        userId: user.id,
        roomId,
        type: pass ? "adjustment" : "entry_lock",
        amountCents: pass ? 0 : -room.entryCents,
        description: pass ? `Pase ${pass.source === "birthday" ? "de cumpleaños" : "TENE Sub"} usado en ${room.name}` : `Reserva en ${room.name}`,
        createdAt: new Date(),
      }),
    ]);
  } catch {
    await releaseRoomSlot(getD1(), reservationId);
    if (pass) await db.update(benefitPasses).set({ status: "available", roomId: null }).where(eq(benefitPasses.id, pass.id));
    else await db
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

  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1);
  return Response.json({ ok: true, wallet: wallet ?? charged[0], usedPass: Boolean(pass) });
}
