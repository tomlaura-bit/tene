export type MatchProviderRuntime = {
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

export function matchProviderReadiness(runtime: MatchProviderRuntime) {
  const provider = runtime.MATCH_PROVIDER ?? (runtime.DATHOST_GAME_SERVER_ID ? "dathost" : runtime.MATCHZY_API_URL ? "matchzy" : undefined);
  if (!provider) return { provider: null, status: "pending" as const, missing: [] as string[] };
  const required = provider === "dathost"
    ? ["DATHOST_EMAIL", "DATHOST_PASSWORD", "DATHOST_GAME_SERVER_ID", "DATHOST_WEBHOOK_TOKEN"] as const
    : ["MATCHZY_API_URL", "MATCHZY_API_TOKEN", "MATCHZY_WEBHOOK_SECRET"] as const;
  const missing = required.filter((key) => !runtime[key]?.trim());
  return { provider, status: missing.length ? "misconfigured" as const : "configured" as const, missing };
}
