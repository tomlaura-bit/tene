import { env } from "cloudflare:workers";

type RuntimeEnv = { MATCHZY_API_URL?: string; MATCHZY_API_TOKEN?: string; MATCHZY_WEBHOOK_SECRET?: string };

export function matchzyConfig() {
  const runtime = env as unknown as RuntimeEnv;
  return { apiUrl: runtime.MATCHZY_API_URL?.replace(/\/$/, ""), token: runtime.MATCHZY_API_TOKEN, webhookSecret: runtime.MATCHZY_WEBHOOK_SECRET };
}

export async function provisionMatch(input: { roomId: string; map: string; side: "ct" | "t"; players: Array<{ steamId64: string | null; team: string }> }) {
  const config = matchzyConfig();
  if (!config.apiUrl || !config.token) return { configured: false as const };
  const response = await fetch(`${config.apiUrl}/matches`, {
    method: "POST",
    headers: { authorization: `Bearer ${config.token}`, "content-type": "application/json" },
    body: JSON.stringify({ externalId: input.roomId, map: input.map, side: input.side, players: input.players, webhookPath: "/api/integrations/matchzy/webhook" }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`matchzy_provision_${response.status}`);
  const body = await response.json() as { address?: string; matchId?: string };
  return { configured: true as const, address: body.address ?? null, matchId: body.matchId ?? null };
}
