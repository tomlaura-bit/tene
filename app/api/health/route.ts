import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let database = false;
  try { await env.DB.prepare("SELECT 1 AS ok").first(); database = true; } catch { database = false; }
  const runtime = env as unknown as { STEAM_WEB_API_KEY?: string; MATCH_PROVIDER?: string; DATHOST_GAME_SERVER_ID?: string };
  return Response.json({ ok: database, service: "tene-api", version: 3, checks: { database, uploads: Boolean(env.UPLOADS), steam: Boolean(runtime.STEAM_WEB_API_KEY), matchProvider: runtime.MATCH_PROVIDER === "dathost" && Boolean(runtime.DATHOST_GAME_SERVER_ID) ? "configured" : "pending" }, responseMs: Date.now() - started, timestamp: new Date().toISOString() }, { status: database ? 200 : 503, headers: { "cache-control": "no-store", "x-tene-health-version": "3" } });
}
