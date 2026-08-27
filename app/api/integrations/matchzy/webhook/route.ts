import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { matchEvents, matchServers, rooms } from "../../../../../db/schema";
import { matchzyConfig } from "../../../../../lib/matchzy";

export const dynamic = "force-dynamic";

const allowedEvents = ["server_ready", "match_started", "score", "match_finished", "server_failed"] as const;
type MatchEvent = (typeof allowedEvents)[number];

function score(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) return fallback;
  return value;
}

export async function POST(request: Request) {
  const secret = matchzyConfig().webhookSecret;
  if (!secret || request.headers.get("x-matchzy-secret") !== secret) return Response.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  const body = await request.json().catch(() => null) as { roomId?: string; event?: MatchEvent; address?: string; teamAScore?: number; teamBScore?: number; payload?: unknown } | null;
  if (!body?.roomId || !body.event || !allowedEvents.includes(body.event)) return Response.json({ ok: false, error: "invalid_event" }, { status: 400 });
  const db = getDb();
  const [server] = await db.select().from(matchServers).where(eq(matchServers.roomId, body.roomId)).limit(1);
  if (!server) return Response.json({ ok: false, error: "server_not_found" }, { status: 404 });
  const now = new Date();
  const status = body.event === "server_ready" ? "ready" : body.event === "match_started" || body.event === "score" ? "live" : body.event === "match_finished" ? "finished" : "failed";
  const operations = [
    db.update(matchServers).set({ status, addressEncrypted: body.address ?? server.addressEncrypted, teamAScore: score(body.teamAScore, server.teamAScore), teamBScore: score(body.teamBScore, server.teamBScore), startedAt: body.event === "match_started" ? now : server.startedAt, finishedAt: ["match_finished", "server_failed"].includes(body.event) ? now : server.finishedAt }).where(eq(matchServers.id, server.id)),
    db.insert(matchEvents).values({ id: `evt_${crypto.randomUUID()}`, serverId: server.id, eventType: `matchzy_${body.event}`, payloadJson: JSON.stringify(body.payload ?? body), createdAt: now }),
    ...(body.event === "match_finished" ? [db.update(rooms).set({ status: "review" }).where(eq(rooms.id, body.roomId))] : []),
  ] as const;
  await db.batch(operations);
  return Response.json({ ok: true });
}
