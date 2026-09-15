import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { ledgerEntries, matchmakingQueue, playerRatings, roomPlayers, rooms, users, wallets } from "../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../lib/auth";
import { enforceRateLimit } from "../../../lib/rate-limit";

export const dynamic = "force-dynamic";
const ENTRY_CENTS = 600;

async function currentUser(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return null;
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  return user ?? null;
}

export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const db = getDb();
  const [entry] = await db.select().from(matchmakingQueue).where(eq(matchmakingQueue.userId, user.id)).limit(1);
  const [count] = await db.select({ value: sql<number>`count(*)` }).from(matchmakingQueue).where(eq(matchmakingQueue.region, "lima"));
  const [activeRoom] = await db.select({ roomId: roomPlayers.roomId }).from(roomPlayers).innerJoin(rooms, eq(roomPlayers.roomId, rooms.id)).where(and(eq(roomPlayers.userId, user.id), inArray(rooms.status, ["draft", "veto", "live"]))).limit(1);
  return Response.json({ ok: true, queued: Boolean(entry), joinedAt: entry?.joinedAt ?? null, playersInQueue: count?.value ?? 0, matchedRoomId: activeRoom?.roomId ?? null, region: "Lima" });
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "matchmaking_join", 8, 60);
  if (limited) return limited;
  const user = await currentUser(request);
  if (!user) return unauthorized();
  if (!user.termsAcceptedAt || !user.privacyAcceptedAt || user.legalVersion !== "2026-08-27") return Response.json({ ok: false, error: "legal_acceptance_required" }, { status: 403 });
  if (user.status !== "verified") return Response.json({ ok: false, error: "staff_verification_required" }, { status: 403 });
  const db = getDb();
  const [wallet] = await db.select().from(wallets).where(and(eq(wallets.userId, user.id), gte(wallets.availableCents, ENTRY_CENTS))).limit(1);
  if (!wallet) return Response.json({ ok: false, error: "insufficient_balance" }, { status: 402 });
  const [active] = await db.select({ id: roomPlayers.id }).from(roomPlayers).innerJoin(rooms, eq(roomPlayers.roomId, rooms.id)).where(and(eq(roomPlayers.userId, user.id), inArray(rooms.status, ["open", "draft", "veto", "live", "review"]))).limit(1);
  if (active) return Response.json({ ok: false, error: "active_room_exists" }, { status: 409 });
  const [rating] = await db.select().from(playerRatings).where(eq(playerRatings.userId, user.id)).limit(1);
  const inserted = await db.insert(matchmakingQueue).values({ userId: user.id, region: "lima", eloAtJoin: rating?.elo ?? 1000, joinedAt: new Date() }).onConflictDoNothing().returning();
  if (inserted.length) {
    const charged = await db.update(wallets).set({ availableCents: sql`${wallets.availableCents} - ${ENTRY_CENTS}`, lockedCents: sql`${wallets.lockedCents} + ${ENTRY_CENTS}` }).where(and(eq(wallets.userId, user.id), gte(wallets.availableCents, ENTRY_CENTS))).returning();
    if (!charged.length) {
      await db.delete(matchmakingQueue).where(eq(matchmakingQueue.userId, user.id));
      return Response.json({ ok: false, error: "insufficient_balance" }, { status: 402 });
    }
    await db.insert(ledgerEntries).values({ id: `led_${crypto.randomUUID()}`, userId: user.id, type: "entry_lock", amountCents: -ENTRY_CENTS, description: "Saldo bloqueado para matchmaking", createdAt: new Date() });
  }

  const candidates = await db.select().from(matchmakingQueue).where(eq(matchmakingQueue.region, "lima")).orderBy(asc(matchmakingQueue.joinedAt)).limit(30);
  if (candidates.length < 10) return Response.json({ ok: true, queued: true, playersInQueue: candidates.length });
  const anchor = candidates[0];
  const matched = [...candidates].sort((a, b) => Math.abs(a.eloAtJoin - anchor.eloAtJoin) - Math.abs(b.eloAtJoin - anchor.eloAtJoin) || a.joinedAt.getTime() - b.joinedAt.getTime()).slice(0, 10);
  const captainIds = [...matched].sort((a, b) => b.eloAtJoin - a.eloAtJoin).slice(0, 2).map((entry) => entry.userId);
  const roomId = `room_mm_${crypto.randomUUID()}`;
  const now = new Date();
  await db.batch([
    db.insert(rooms).values({ id: roomId, name: `Matchmaking · ${new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" }).format(now)}`, status: "draft", entryCents: ENTRY_CENTS, prizePerWinnerCents: 1000, createdAt: now }),
    ...matched.map((entry, index) => db.insert(roomPlayers).values({ id: `rp_${crypto.randomUUID()}`, roomId, userId: entry.userId, slotNumber: index + 1, joinedAt: now, isCaptain: captainIds.includes(entry.userId), team: entry.userId === captainIds[0] ? "a" : entry.userId === captainIds[1] ? "b" : "pool" })),
    db.delete(matchmakingQueue).where(inArray(matchmakingQueue.userId, matched.map((entry) => entry.userId))),
  ]);
  return Response.json({ ok: true, queued: false, matchedRoomId: roomId, playersInQueue: 0 });
}

export async function DELETE(request: Request) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const db = getDb();
  const removed = await db.delete(matchmakingQueue).where(eq(matchmakingQueue.userId, user.id)).returning();
  if (removed.length) {
    await db.batch([
      db.update(wallets).set({ availableCents: sql`${wallets.availableCents} + ${ENTRY_CENTS}`, lockedCents: sql`${wallets.lockedCents} - ${ENTRY_CENTS}` }).where(eq(wallets.userId, user.id)),
      db.insert(ledgerEntries).values({ id: `led_${crypto.randomUUID()}`, userId: user.id, type: "entry_release", amountCents: ENTRY_CENTS, description: "Saldo liberado al salir de matchmaking", createdAt: new Date() }),
    ]);
  }
  return Response.json({ ok: true, queued: false });
}
