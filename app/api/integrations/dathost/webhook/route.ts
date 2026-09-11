import { and, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { getDb } from "../../../../../db";
import { matchEvents, matchServers, rooms } from "../../../../../db/schema";
import { matchProviderConfig } from "../../../../../lib/match-provider";
import { secureEqual, webhookReceipt } from "../../../../../lib/webhook-security";

export const dynamic = "force-dynamic";

const allowedEvents = ["server_ready_for_players", "all_players_connected", "match_started", "round_end", "match_ended", "player_disconnected", "match_canceled"] as const;
type DathostEvent = (typeof allowedEvents)[number];

function integer(...values: unknown[]) {
  return values.find((value) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100) as number | undefined;
}

function eventName(body: Record<string, unknown>) {
  return (body.event ?? body.event_type ?? body.type) as string | undefined;
}

function scores(body: Record<string, unknown>) {
  const match = (body.match ?? body.data) as Record<string, unknown> | undefined;
  const team1 = (body.team1 ?? match?.team1) as Record<string, unknown> | undefined;
  const team2 = (body.team2 ?? match?.team2) as Record<string, unknown> | undefined;
  return {
    team1: integer(body.team1_score, body.team_1_score, team1?.score, match?.team1_score),
    team2: integer(body.team2_score, body.team_2_score, team2?.score, match?.team2_score),
  };
}

export async function POST(request: Request) {
  const token = matchProviderConfig().dathost.webhookToken;
  if (!token || !(await secureEqual(request.headers.get("authorization"), `Bearer ${token}`))) return Response.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  const roomId = new URL(request.url).searchParams.get("roomId");
  const rawBody = await request.text();
  const body = (() => { try { return JSON.parse(rawBody); } catch { return null; } })() as Record<string, unknown> | null;
  const event = body ? eventName(body) : undefined;
  if (!roomId || !body || !event || !allowedEvents.includes(event as DathostEvent)) return Response.json({ ok: false, error: "invalid_event" }, { status: 400 });
  const eventId = request.headers.get("x-dathost-event-id") ?? (typeof body.id === "string" ? body.id : null);
  const receipt = await webhookReceipt("dathost", roomId, rawBody, eventId);
  if (receipt.duplicate) return Response.json({ ok: true, duplicate: true });
  const db = getDb();
  const [server] = await db.select().from(matchServers).where(eq(matchServers.roomId, roomId)).limit(1);
  if (!server) { await receipt.release(); return Response.json({ ok: false, error: "server_not_found" }, { status: 404 }); }
  const now = new Date();
  const score = scores(body);
  const [createdEvent] = await db.select().from(matchEvents).where(and(eq(matchEvents.serverId, server.id), eq(matchEvents.eventType, "provider_match_created"))).limit(1);
  const providerData = createdEvent ? JSON.parse(createdEvent.payloadJson) as { team1Source?: "a" | "b" } : {};
  const team1IsA = providerData.team1Source !== "b";
  const status = event === "match_started" || event === "round_end" || event === "all_players_connected" ? "live" : event === "match_ended" ? "finished" : event === "match_canceled" ? "failed" : "ready";
  const operations: BatchItem<"sqlite">[] = [
    db.update(matchServers).set({ status, teamAScore: (team1IsA ? score.team1 : score.team2) ?? server.teamAScore, teamBScore: (team1IsA ? score.team2 : score.team1) ?? server.teamBScore, startedAt: event === "match_started" ? now : server.startedAt, finishedAt: event === "match_ended" || event === "match_canceled" ? now : server.finishedAt }).where(eq(matchServers.id, server.id)),
    db.insert(matchEvents).values({ id: `evt_${crypto.randomUUID()}`, serverId: server.id, eventType: `dathost_${event}`, payloadJson: JSON.stringify(body), createdAt: now }),
  ];
  if (event === "match_ended" || event === "match_canceled") operations.push(db.update(rooms).set({ status: "review" }).where(eq(rooms.id, roomId)));
  try { await db.batch(operations as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]); } catch (error) { await receipt.release(); throw error; }
  return Response.json({ ok: true });
}
