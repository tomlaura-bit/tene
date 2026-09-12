import { describe, expect, it } from "vitest";
import { matchProviderReadiness } from "../../lib/match-provider-config";

describe("match provider readiness", () => {
  it("reports pending when no provider is selected", () => {
    expect(matchProviderReadiness({})).toEqual({ provider: null, status: "pending", missing: [] });
  });

  it("requires every DatHost credential used by provisioning", () => {
    expect(matchProviderReadiness({ MATCH_PROVIDER: "dathost", DATHOST_GAME_SERVER_ID: "server" })).toEqual({
      provider: "dathost",
      status: "misconfigured",
      missing: ["DATHOST_EMAIL", "DATHOST_PASSWORD", "DATHOST_WEBHOOK_TOKEN"],
    });
  });

  it("recognizes a complete MatchZy configuration", () => {
    expect(matchProviderReadiness({ MATCH_PROVIDER: "matchzy", MATCHZY_API_URL: "https://match.example", MATCHZY_API_TOKEN: "token", MATCHZY_WEBHOOK_SECRET: "secret" })).toEqual({
      provider: "matchzy",
      status: "configured",
      missing: [],
    });
  });

  it("infers MatchZy from its API URL and rejects blank secrets", () => {
    expect(matchProviderReadiness({ MATCHZY_API_URL: "https://match.example/", MATCHZY_API_TOKEN: "token", MATCHZY_WEBHOOK_SECRET: " " })).toEqual({
      provider: "matchzy",
      status: "misconfigured",
      missing: ["MATCHZY_WEBHOOK_SECRET"],
    });
  });
});
