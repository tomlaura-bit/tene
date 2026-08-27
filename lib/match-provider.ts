import { env } from "cloudflare:workers";

type RuntimeEnv = {
  MATCH_PROVIDER?: "dathost" | "matchzy";
  DATHOST_EMAIL?: string;
  DATHOST_PASSWORD?: string;
  DATHOST_GAME_SERVER_ID?: string;
  DATHOST_WEBHOOK_TOKEN?: string;
  DATHOST_SERVER_PASSWORD?: string;
  MATCHZY_API_URL?: string;
  MATCHZY_API_TOKEN?: string;
  MATCHZY_WEBHOOK_SECRET?: string;
};

export type MatchPlayer = { steamId64: string | null; team: string; nickname?: string | null };
export type ProvisionInput = {
  roomId: string;
  map: string;
  side: "ct" | "t";
  sideChooserTeam: "a" | "b";
  players: MatchPlayer[];
  publicOrigin: string;
};

const mapNames: Record<string, string> = {
  Mirage: "de_mirage",
  Inferno: "de_inferno",
  Nuke: "de_nuke",
  Ancient: "de_ancient",
  Anubis: "de_anubis",
  "Dust II": "de_dust2",
  Train: "de_train",
};

export function matchProviderConfig() {
  const runtime = env as unknown as RuntimeEnv;
  const provider = runtime.MATCH_PROVIDER ?? (runtime.DATHOST_GAME_SERVER_ID ? "dathost" : runtime.MATCHZY_API_URL ? "matchzy" : undefined);
  return {
    provider,
    dathost: {
      email: runtime.DATHOST_EMAIL,
      password: runtime.DATHOST_PASSWORD,
      gameServerId: runtime.DATHOST_GAME_SERVER_ID,
      webhookToken: runtime.DATHOST_WEBHOOK_TOKEN,
      serverPassword: runtime.DATHOST_SERVER_PASSWORD,
    },
    matchzy: {
      apiUrl: runtime.MATCHZY_API_URL?.replace(/\/$/, ""),
      token: runtime.MATCHZY_API_TOKEN,
      webhookSecret: runtime.MATCHZY_WEBHOOK_SECRET,
    },
  };
}

function dathostTeam1Source(input: ProvisionInput) {
  const chooserStartsCt = input.side === "ct";
  return chooserStartsCt ? input.sideChooserTeam : input.sideChooserTeam === "a" ? "b" : "a";
}

function dathostTeam(input: ProvisionInput, playerTeam: string) {
  return playerTeam === dathostTeam1Source(input) ? "team1" : "team2";
}

function addressFromResponse(body: Record<string, unknown>) {
  const server = (body.game_server ?? body.server) as Record<string, unknown> | undefined;
  const ports = server?.ports as Record<string, unknown> | undefined;
  const ip = server?.ip ?? server?.raw_ip ?? server?.address;
  const port = server?.game_port ?? server?.port ?? ports?.game;
  return typeof ip === "string" ? `${ip}${typeof port === "number" || typeof port === "string" ? `:${port}` : ""}` : null;
}

async function provisionDathost(input: ProvisionInput) {
  const config = matchProviderConfig().dathost;
  if (!config.email || !config.password || !config.gameServerId || !config.webhookToken) return { configured: false as const, provider: "dathost" as const };
  const players = input.players.filter((player): player is MatchPlayer & { steamId64: string } => Boolean(player.steamId64));
  if (players.length !== 10) throw new Error("dathost_requires_ten_steam_players");
  const eventUrl = new URL("/api/integrations/dathost/webhook", input.publicOrigin);
  eventUrl.searchParams.set("roomId", input.roomId);
  const response = await fetch("https://dathost.com/api/0.1/cs2-matches", {
    method: "POST",
    headers: { authorization: `Basic ${btoa(`${config.email}:${config.password}`)}`, "content-type": "application/json" },
    body: JSON.stringify({
      game_server_id: config.gameServerId,
      team1: { name: "TENE Team 1", flag: "PE" },
      team2: { name: "TENE Team 2", flag: "PE" },
      players: players.map((player) => ({ steam_id_64: player.steamId64, team: dathostTeam(input, player.team), nickname_override: player.nickname ?? undefined })),
      settings: { map: mapNames[input.map] ?? input.map, password: config.serverPassword, connect_time: 300, match_begin_countdown: 30, team_size: 5, wait_for_gotv: true, enable_plugin: true, enable_tech_pause: true },
      webhooks: { event_url: eventUrl.toString(), enabled_events: ["server_ready_for_players", "all_players_connected", "match_started", "round_end", "match_ended", "player_disconnected", "match_canceled"], authorization_header: `Bearer ${config.webhookToken}` },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`dathost_provision_${response.status}`);
  const body = await response.json() as Record<string, unknown>;
  const matchId = body._id ?? body.id;
  let address = addressFromResponse(body);
  if (!address) {
    const serverResponse = await fetch(`https://dathost.com/api/0.1/game-servers/${encodeURIComponent(config.gameServerId)}`, { headers: { authorization: `Basic ${btoa(`${config.email}:${config.password}`)}` }, signal: AbortSignal.timeout(10_000) });
    if (serverResponse.ok) address = addressFromResponse({ game_server: await serverResponse.json() as Record<string, unknown> });
  }
  return { configured: true as const, provider: "dathost" as const, address, password: config.serverPassword ?? null, matchId: typeof matchId === "string" ? matchId : null, team1Source: dathostTeam1Source(input) };
}

async function provisionMatchzy(input: ProvisionInput) {
  const config = matchProviderConfig().matchzy;
  if (!config.apiUrl || !config.token) return { configured: false as const, provider: "matchzy" as const };
  const response = await fetch(`${config.apiUrl}/matches`, {
    method: "POST",
    headers: { authorization: `Bearer ${config.token}`, "content-type": "application/json" },
    body: JSON.stringify({ externalId: input.roomId, map: input.map, side: input.side, players: input.players, webhookPath: "/api/integrations/matchzy/webhook" }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`matchzy_provision_${response.status}`);
  const body = await response.json() as { address?: string; matchId?: string };
  return { configured: true as const, provider: "matchzy" as const, address: body.address ?? null, password: null, matchId: body.matchId ?? null, team1Source: "a" as const };
}

export async function provisionMatch(input: ProvisionInput) {
  const provider = matchProviderConfig().provider;
  if (provider === "dathost") return provisionDathost(input);
  if (provider === "matchzy") return provisionMatchzy(input);
  return { configured: false as const, provider: "manual" as const };
}
