import { env } from "cloudflare:workers";
import { matchProviderReadiness, type MatchProviderRuntime } from "../../../lib/match-provider-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let database = false;
  try { await env.DB.prepare("SELECT 1 AS ok").first(); database = true; } catch { database = false; }
  const runtime = env as unknown as MatchProviderRuntime & { STEAM_WEB_API_KEY?: string };
  const matchProvider = matchProviderReadiness(runtime);
  return Response.json({ ok: database, service: "tene-api", version: 4, checks: { database, uploads: Boolean(env.UPLOADS), steam: Boolean(runtime.STEAM_WEB_API_KEY), matchProvider }, responseMs: Date.now() - started, timestamp: new Date().toISOString() }, { status: database ? 200 : 503, headers: { "cache-control": "no-store", "x-tene-health-version": "4" } });
}
