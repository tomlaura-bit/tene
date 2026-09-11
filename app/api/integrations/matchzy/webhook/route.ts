import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { matchEvents, matchServers, rooms } from "../../../../../db/schema";
import { matchzyConfig } from "../../../../../lib/matchzy";
import { secureEqual, verifyHmacWebhook, webhookReceipt } from "../../../../../lib/webhook-security";

export const dynamic = "force-dynamic";

const allowedEvents = ["server_ready", "match_started", "score", "match_finished", "server_failed"] as const;
type MatchEvent = (typeof allowedEvents)[number];

function score(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) return fallback;
  return value;
}

export async function POST(request: Request) {
  const secret = matchzyConfig().webhookSecret;
  const rawBody = await request.text();
  const hmacPresent = Boolean(request.headers.get("x-matchzy-signature"));
  const authenticated = secret && (hmacPresent
    ? await verifyHmacWebhook({ rawBody, secret, signature: request.headers.get("x-matchzy-signature"), timestamp: request.headers.get("x-matchzy-timestamp") })
    : await secureEqual(request.headers.get("x-matchzy-secret"), secret));
  if (!authenticated) return Response.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  const body = (() => { try { return JSON.parse(rawBody); } catch { return null; } })() as { roomId?: string; event?: MatchEvent; eventId?: string; occurredAt?: string; address?: string; teamAScore?: number; teamBScore?: number; payload?: unknown } | null;
  if (!body?.roomId || !body.event || !allowedEvents.includes(body.event)) return Response.json({ ok: false, error: "invalid_event" }, { status: 400 });
  const eventId = request.headers.get("x-matchzy-event-id") ?? body.eventId ?? null;
  const occurredAt = body.occurredAt && !Number.isNaN(Date.parse(body.occurredAt)) ? new Date(body.occurredAt) : null;
  const receipt = await webhookReceipt("matchzy", body.roomId, rawBody, eventId, occurredAt);
  if (receipt.duplicate) return Response.json({ ok: true, duplicate: true });
  const db = getDb();
  const [server] = await db.select().from(matchServers).where(eq(matchServers.roomId, body.roomId)).limit(1);
  if (!server) { await receipt.release(); return Response.json({ ok: false, error: "server_not_found" }, { status: 404 }); }
  const now = new Date();
  const status = body.event === "server_ready" ? "ready" : body.event === "match_started" || body.event === "score" ? "live" : body.event === "match_finished" ? "finished" : "failed";
  const operations = [
    db.update(matchServers).set({ status, addressEncrypted: body.address ?? server.addressEncrypted, teamAScore: score(body.teamAScore, server.teamAScore), teamBScore: score(body.teamBScore, server.teamBScore), startedAt: body.event === "match_started" ? now : server.startedAt, finishedAt: ["match_finished", "server_failed"].includes(body.event) ? now : server.finishedAt }).where(eq(matchServers.id, server.id)),
    db.insert(matchEvents).values({ id: `evt_${crypto.randomUUID()}`, serverId: server.id, eventType: `matchzy_${body.event}`, payloadJson: JSON.stringify(body.payload ?? body), createdAt: now }),
    ...(body.event === "match_finished" ? [db.update(rooms).set({ status: "review" }).where(eq(rooms.id, body.roomId))] : []),
  ] as const;
  try { await db.batch(operations); } catch (error) { await receipt.release(); throw error; }
  return Response.json({ ok: true });
}
