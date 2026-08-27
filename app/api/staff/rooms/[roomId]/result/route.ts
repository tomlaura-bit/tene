import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { auditLogs, benefitPasses, ledgerEntries, matchDisputes, matchEvents, matchServers, notifications, playerRatings, ratingChanges, roomPlayers, rooms, users, wallets } from "../../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../../lib/auth";

export const dynamic = "force-dynamic";
const levelForElo = (elo: number) => Math.max(1, Math.min(10, Math.floor((elo - 900) / 100) + 1));

export async function POST(request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const { roomId } = await params;
  const body = (await request.json()) as { teamAScore?: number; teamBScore?: number };
  const scoreA = Number(body.teamAScore), scoreB = Number(body.teamBScore);
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0 || scoreA === scoreB || Math.max(scoreA, scoreB) < 13)
    return Response.json({ ok: false, error: "invalid_score" }, { status: 400 });
  const db = getDb();
  const [actor] = await db.select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!actor || !["owner", "admin"].includes(actor.role)) return Response.json({ ok: false, error: "staff_required" }, { status: 403 });
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  const [server] = await db.select().from(matchServers).where(eq(matchServers.roomId, roomId)).limit(1);
  if (!room || room.status !== "live" || !server) return Response.json({ ok: false, error: "room_not_live" }, { status: 409 });
  const [pending] = await db.select().from(matchDisputes).where(and(eq(matchDisputes.roomId, roomId), eq(matchDisputes.status, "pending"))).limit(1);
  if (pending) return Response.json({ ok: false, error: "settlement_frozen" }, { status: 409 });
  const players = await db.select({ userId: roomPlayers.userId, team: roomPlayers.team, elo: playerRatings.elo }).from(roomPlayers).leftJoin(playerRatings, eq(roomPlayers.userId, playerRatings.userId)).where(eq(roomPlayers.roomId, roomId));
  const passes = await db.select().from(benefitPasses).where(and(eq(benefitPasses.roomId, roomId), eq(benefitPasses.status, "used")));
  const passUsers = new Set(passes.map((pass) => pass.userId));
  if (players.length !== 10 || players.filter((p) => p.team === "a").length !== 5 || players.filter((p) => p.team === "b").length !== 5)
    return Response.json({ ok: false, error: "invalid_teams" }, { status: 409 });
  const paidUserIds = players.filter((player) => !passUsers.has(player.userId)).map((player) => player.userId);
  if (paidUserIds.length) {
    const lockedWallets = await db.select({ userId: wallets.userId, lockedCents: wallets.lockedCents }).from(wallets).where(inArray(wallets.userId, paidUserIds));
    if (lockedWallets.length !== paidUserIds.length || lockedWallets.some((wallet) => wallet.lockedCents < room.entryCents))
      return Response.json({ ok: false, error: "wallet_lock_mismatch" }, { status: 409 });
  }
  const winner = scoreA > scoreB ? "a" : "b";
  const averageA = players.filter((p) => p.team === "a").reduce((sum, p) => sum + (p.elo ?? 1000), 0) / 5;
  const averageB = players.filter((p) => p.team === "b").reduce((sum, p) => sum + (p.elo ?? 1000), 0) / 5;
  const expectedA = 1 / (1 + Math.pow(10, (averageB - averageA) / 400));
  const deltaA = Math.round(32 * ((winner === "a" ? 1 : 0) - expectedA));
  const now = new Date();
  const actions: any[] = [];
  for (const player of players) {
    const won = player.team === winner;
    const before = player.elo ?? 1000;
    const delta = player.team === "a" ? deltaA : -deltaA;
    const after = Math.max(0, before + delta);
    const usedPass = passUsers.has(player.userId);
    actions.push(usedPass ? db.update(wallets).set({ availableCents: sql`${wallets.availableCents} + ${won ? room.prizePerWinnerCents : 0}` }).where(eq(wallets.userId, player.userId)) : db.update(wallets).set({ lockedCents: sql`${wallets.lockedCents} - ${room.entryCents}`, availableCents: sql`${wallets.availableCents} + ${won ? room.prizePerWinnerCents : 0}` }).where(and(eq(wallets.userId, player.userId), gte(wallets.lockedCents, room.entryCents))));
    actions.push(db.insert(ledgerEntries).values({ id: `led_${crypto.randomUUID()}`, userId: player.userId, roomId, type: "fee", amountCents: 0, description: usedPass ? `Servicio cubierto por pase en ${room.name}` : `S/ 1 de servicio incluido en la entrada de ${room.name}`, createdAt: now }));
    if (won) actions.push(db.insert(ledgerEntries).values({ id: `led_${crypto.randomUUID()}`, userId: player.userId, roomId, type: "prize", amountCents: room.prizePerWinnerCents, description: `Premio de ${room.name}`, createdAt: now }));
    actions.push(db.update(playerRatings).set({ elo: after, level: levelForElo(after), matches: sql`${playerRatings.matches} + 1`, wins: sql`${playerRatings.wins} + ${won ? 1 : 0}`, losses: sql`${playerRatings.losses} + ${won ? 0 : 1}`, calibrationStatus: "established", updatedAt: now }).where(eq(playerRatings.userId, player.userId)));
    actions.push(db.insert(ratingChanges).values({ id: `rat_${crypto.randomUUID()}`, userId: player.userId, roomId, beforeElo: before, delta, afterElo: after, reason: "match", createdAt: now }));
    actions.push(db.insert(notifications).values({ id: `not_${crypto.randomUUID()}`, userId: player.userId, type: "match", title: won ? "Victoria confirmada" : "Resultado confirmado", body: won ? `Ganaste S/ ${(room.prizePerWinnerCents / 100).toFixed(2)} y ${delta} ELO.` : `${delta} ELO. La entrada fue liquidada.`, actionUrl: `/rooms/${roomId}`, createdAt: now }));
  }
  actions.push(db.update(matchServers).set({ teamAScore: scoreA, teamBScore: scoreB, status: "finished", finishedAt: now }).where(eq(matchServers.id, server.id)));
  actions.push(db.update(rooms).set({ status: "settled" }).where(eq(rooms.id, roomId)));
  actions.push(db.insert(matchEvents).values({ id: `evt_${crypto.randomUUID()}`, serverId: server.id, eventType: "result_settled", payloadJson: JSON.stringify({ scoreA, scoreB, winner, prizePerWinnerCents: room.prizePerWinnerCents, serviceFeePerPlayerCents: 100 }), createdAt: now }));
  actions.push(db.insert(auditLogs).values({ id: `aud_${crypto.randomUUID()}`, actorId: actor.id, action: "room_result_settled", entityType: "room", entityId: roomId, afterJson: JSON.stringify({ scoreA, scoreB, winner }), reason: "Resultado confirmado por staff", createdAt: now }));
  await db.batch(actions as [any, ...any[]]);
  return Response.json({ ok: true, winner, scoreA, scoreB });
}
