import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { matchEvents, matchServers, rooms } from "../../../../../db/schema";
import { matchzyConfig } from "../../../../../lib/matchzy";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = matchzyConfig().webhookSecret;
  if (!secret || request.headers.get("x-matchzy-secret") !== secret) return Response.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  const body = await request.json() as { roomId?: string; event?: "server_ready"|"match_started"|"score"|"match_finished"|"server_failed"; address?: string; teamAScore?: number; teamBScore?: number; payload?: unknown };
  if (!body.roomId || !body.event) return Response.json({ ok: false, error: "invalid_event" }, { status: 400 });
  const db = getDb();
  const [server] = await db.select().from(matchServers).where(eq(matchServers.roomId, body.roomId)).limit(1);
  if (!server) return Response.json({ ok: false, error: "server_not_found" }, { status: 404 });
  const now = new Date();
  const status = body.event === "server_ready" ? "ready" : body.event === "match_started" || body.event === "score" ? "live" : body.event === "match_finished" ? "finished" : "failed";
  await db.batch([
    db.update(matchServers).set({ status, addressEncrypted: body.address ?? server.addressEncrypted, teamAScore: Math.max(0, Number(body.teamAScore) || server.teamAScore), teamBScore: Math.max(0, Number(body.teamBScore) || server.teamBScore), startedAt: body.event === "match_started" ? now : server.startedAt, finishedAt: ["match_finished", "server_failed"].includes(body.event) ? now : server.finishedAt }).where(eq(matchServers.id, server.id)),
    db.insert(matchEvents).values({ id: `evt_${crypto.randomUUID()}`, serverId: server.id, eventType: `matchzy_${body.event}`, payloadJson: JSON.stringify(body.payload ?? body), createdAt: now }),
    ...(body.event === "match_finished" ? [db.update(rooms).set({ status: "review" }).where(eq(rooms.id, body.roomId))] : []),
  ] as [any, ...any[]]);
  return Response.json({ ok: true });
}
