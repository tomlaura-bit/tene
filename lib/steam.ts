const STEAM_OPENID = "https://steamcommunity.com/openid/login";
export const TENE_ORIGIN = "https://tene-cs2-peru.tom-laura.chatgpt.site";

export function steamLoginUrl() {
  const callback = `${TENE_ORIGIN}/api/auth/steam/callback`;
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": callback,
    "openid.realm": TENE_ORIGIN,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID}?${params}`;
}

export async function verifySteamOpenId(url: URL) {
  if (url.searchParams.get("openid.op_endpoint") !== STEAM_OPENID) return null;
  const claimedId = url.searchParams.get("openid.claimed_id") ?? "";
  const match = claimedId.match(
    /^https:\/\/steamcommunity\.com\/openid\/id\/(7656119\d{10})$/,
  );
  if (!match) return null;
  const payload = new URLSearchParams();
  for (const [key, value] of url.searchParams)
    if (key.startsWith("openid.")) payload.set(key, value);
  payload.set("openid.mode", "check_authentication");
  const response = await fetch(STEAM_OPENID, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  });
  if (!response.ok || !(await response.text()).includes("is_valid:true"))
    return null;
  return match[1];
}

export async function inspectSteamProfile(steamId64: string, apiKey?: string) {
  if (!apiKey)
    return { ok: false as const, reason: "api_key_missing" as const };
  const summaryUrl = new URL(
    "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
  );
  summaryUrl.searchParams.set("steamids", steamId64);
  const gamesUrl = new URL(
    "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/",
  );
  gamesUrl.searchParams.set(
    "input_json",
    JSON.stringify({
      steamid: steamId64,
      include_played_free_games: true,
      appids_filter: [730],
    }),
  );
  const requestInit = { headers: { "x-webapi-key": apiKey } };
  const [summaryResponse, gamesResponse] = await Promise.all([
    fetch(summaryUrl, requestInit),
    fetch(gamesUrl, requestInit),
  ]);
  if (!summaryResponse.ok || !gamesResponse.ok)
    return { ok: false as const, reason: "steam_api_unavailable" as const };
  const summary = (await summaryResponse.json()) as {
    response?: {
      players?: Array<{
        communityvisibilitystate?: number;
        personaname?: string;
        avatarfull?: string;
      }>;
    };
  };
  const games = (await gamesResponse.json()) as {
    response?: {
      game_count?: number;
      games?: Array<{ appid: number; playtime_forever?: number }>;
    };
  };
  const player = summary.response?.players?.[0];
  if (!player)
    return { ok: false as const, reason: "profile_not_found" as const };
  const cs2 = games.response?.games?.find((game) => game.appid === 730);
  const profilePublic = player?.communityvisibilitystate === 3;
  const gameDetailsPublic = typeof games.response?.game_count === "number";
  const cs2Minutes = cs2?.playtime_forever ?? 0;
  return {
    ok: true as const,
    profilePublic,
    gameDetailsPublic,
    ownsCs2: Boolean(cs2),
    cs2Minutes,
    eligible:
      profilePublic && gameDetailsPublic && Boolean(cs2) && cs2Minutes >= 30000,
    personaName: player?.personaname ?? null,
    avatarUrl: player?.avatarfull ?? null,
    reason: !profilePublic
      ? "profile_private"
      : !gameDetailsPublic
        ? "game_details_private"
        : !cs2
          ? "cs2_not_visible"
          : cs2Minutes < 30000
            ? "hours_below_minimum"
            : "eligible",
  };
}
