import { and, desc, eq, inArray } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { getDb } from "../../../db";
import { auditLogs, competitiveSeasons, notifications, playerRatings, publicPlayerProfiles, rooms, seasonPlacements, users } from "../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../lib/auth";

export const dynamic = "force-dynamic";
const levelForElo = (elo: number) => Math.max(1, Math.min(10, Math.floor((elo - 900) / 100) + 1));

export async function GET(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const db = getDb();
  const seasons = await db.select().from(competitiveSeasons).orderBy(desc(competitiveSeasons.startsAt)).limit(20);
  const placements = await db.select({ seasonId: seasonPlacements.seasonId, position: seasonPlacements.finalPosition, elo: seasonPlacements.finalElo, level: seasonPlacements.finalLevel, badgeKey: seasonPlacements.badgeKey, userId: users.id, nickname: users.nickname }).from(seasonPlacements).innerJoin(users, eq(seasonPlacements.userId, users.id)).orderBy(seasonPlacements.finalPosition).limit(200);
  return Response.json({ ok: true, active: seasons.find((season) => season.status === "active") ?? null, closed: seasons.filter((season) => season.status === "closed").map((season) => ({ ...season, podium: placements.filter((item) => item.seasonId === season.id).slice(0, 3) })) });
}

export async function POST(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const db = getDb();
  const [actor] = await db.select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!actor || !["owner", "admin"].includes(actor.role)) return Response.json({ ok: false, error: "admin_required" }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { action?: "initialize" | "close_and_start"; name?: string; endsAt?: string; nextName?: string; nextEndsAt?: string };
  const now = new Date();
  const [active] = await db.select().from(competitiveSeasons).where(eq(competitiveSeasons.status, "active")).limit(1);
  if (body.action === "initialize") {
    if (active) return Response.json({ ok: false, error: "active_season_exists" }, { status: 409 });
    const endsAt = new Date(body.endsAt ?? "");
    if (!body.name?.trim() || Number.isNaN(endsAt.getTime()) || endsAt <= now) return Response.json({ ok: false, error: "invalid_season" }, { status: 400 });
    const key = `season-${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${crypto.randomUUID().slice(0, 6)}`;
    const id = `sea_${crypto.randomUUID()}`;
    await db.batch([
      db.insert(competitiveSeasons).values({ id, key, name: body.name.trim(), status: "active", startsAt: now, endsAt, createdAt: now }),
      db.update(playerRatings).set({ seasonKey: key, updatedAt: now }),
      db.insert(auditLogs).values({ id: `aud_${crypto.randomUUID()}`, actorId: actor.id, action: "season_initialized", entityType: "competitive_season", entityId: id, afterJson: JSON.stringify({ key, name: body.name.trim(), endsAt }), createdAt: now }),
    ]);
    return Response.json({ ok: true, seasonId: id });
  }
  if (body.action !== "close_and_start" || !active) return Response.json({ ok: false, error: "active_season_required" }, { status: 409 });
  const [activeRoom] = await db.select({ id: rooms.id }).from(rooms).where(inArray(rooms.status, ["draft", "veto", "live", "review"])).limit(1);
  if (activeRoom) return Response.json({ ok: false, error: "active_rooms_exist" }, { status: 409 });
  const nextEndsAt = new Date(body.nextEndsAt ?? "");
  if (!body.nextName?.trim() || Number.isNaN(nextEndsAt.getTime()) || nextEndsAt <= now) return Response.json({ ok: false, error: "invalid_next_season" }, { status: 400 });
  const leaderboard = await db.select({ userId: playerRatings.userId, elo: playerRatings.elo, level: playerRatings.level }).from(playerRatings).where(eq(playerRatings.seasonKey, active.key)).orderBy(desc(playerRatings.elo));
  const nextKey = `season-${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${crypto.randomUUID().slice(0, 6)}`;
  const nextId = `sea_${crypto.randomUUID()}`;
  const actions: BatchItem<"sqlite">[] = [
    db.update(competitiveSeasons).set({ status: "closed", endsAt: now }).where(and(eq(competitiveSeasons.id, active.id), eq(competitiveSeasons.status, "active"))),
    db.insert(competitiveSeasons).values({ id: nextId, key: nextKey, name: body.nextName.trim(), status: "active", startsAt: now, endsAt: nextEndsAt, resetFactorBasisPoints: active.resetFactorBasisPoints, createdAt: now }),
  ];
  for (const [index, player] of leaderboard.entries()) {
    const position = index + 1;
    const badgeKey = position === 1 ? "tene_champion" : position <= 3 ? "season_podium" : position <= 10 ? "violet_top10" : null;
    actions.push(db.insert(seasonPlacements).values({ id: `plc_${crypto.randomUUID()}`, seasonId: active.id, userId: player.userId, finalPosition: position, finalElo: player.elo, finalLevel: player.level, badgeKey, createdAt: now }));
    const resetElo = 1000 + Math.round((player.elo - 1000) * (1 - active.resetFactorBasisPoints / 10000));
    actions.push(db.update(playerRatings).set({ seasonKey: nextKey, elo: resetElo, level: levelForElo(resetElo), matches: 0, wins: 0, losses: 0, calibrationStatus: "established", updatedAt: now }).where(eq(playerRatings.userId, player.userId)));
    if (badgeKey) {
      const [profile] = await db.select({ badgesJson: publicPlayerProfiles.badgesJson }).from(publicPlayerProfiles).where(eq(publicPlayerProfiles.userId, player.userId)).limit(1);
      const badges = Array.from(new Set([...(JSON.parse(profile?.badgesJson ?? "[]") as string[]), badgeKey]));
      actions.push(db.insert(publicPlayerProfiles).values({ userId: player.userId, badgesJson: JSON.stringify(badges), updatedAt: now }).onConflictDoUpdate({ target: publicPlayerProfiles.userId, set: { badgesJson: JSON.stringify(badges), updatedAt: now } }));
    }
    actions.push(db.insert(notifications).values({ id: `not_${crypto.randomUUID()}`, userId: player.userId, type: "match", title: `Temporada finalizada · Puesto #${position}`, body: badgeKey ? `Obtuviste la insignia ${badgeKey.replaceAll("_", " ")}. Tu Elo fue ajustado para la nueva temporada.` : "Tu resultado histórico fue guardado y tu Elo fue ajustado para la nueva temporada.", actionUrl: "/ranking", createdAt: now }));
  }
  actions.push(db.insert(auditLogs).values({ id: `aud_${crypto.randomUUID()}`, actorId: actor.id, action: "season_closed", entityType: "competitive_season", entityId: active.id, afterJson: JSON.stringify({ placements: leaderboard.length, nextSeasonId: nextId, nextKey }), reason: "Cierre administrativo de temporada", createdAt: now }));
  await db.batch(actions as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  return Response.json({ ok: true, closedSeasonId: active.id, nextSeasonId: nextId, placements: leaderboard.length });
}
