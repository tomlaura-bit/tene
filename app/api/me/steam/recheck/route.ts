import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { steamProfileChecks, users } from "../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../lib/auth";
import { inspectSteamProfile } from "../../../../../lib/steam";
import { enforceRateLimit } from "../../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!user?.steamId64)
    return Response.json(
      { ok: false, error: "steam_not_linked" },
      { status: 409 },
    );
  const [lastCheck] = await db
    .select()
    .from(steamProfileChecks)
    .where(eq(steamProfileChecks.userId, user.id))
    .orderBy(desc(steamProfileChecks.checkedAt))
    .limit(1);
  return Response.json({
    ok: true,
    steam: {
      steamId64: user.steamId64,
      personaName: user.steamPersonaName,
      avatarUrl: user.steamAvatarUrl,
      linkedAt: user.steamLinkedAt,
      status: user.status,
      cs2Minutes: user.cs2Minutes,
    },
    lastCheck: lastCheck ?? null,
  });
}

export async function POST(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const limited = await enforceRateLimit(request, "steam_recheck", 5, 600);
  if (limited) return limited;
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!user?.steamId64)
    return Response.json(
      { ok: false, error: "steam_not_linked" },
      { status: 409 },
    );
  const inspection = await inspectSteamProfile(
    user.steamId64,
    env.STEAM_WEB_API_KEY,
  );
  if (!inspection.ok)
    return Response.json(
      { ok: false, error: inspection.reason },
      { status: 502 },
    );
  const now = new Date();
  await db
    .update(users)
    .set({
      steamPersonaName: inspection.personaName,
      steamAvatarUrl: inspection.avatarUrl,
      cs2Minutes: inspection.cs2Minutes,
      status: user.status === "verified" ? "verified" : "pending",
    })
    .where(eq(users.id, user.id));
  await db.insert(steamProfileChecks).values({
    id: `spc_${crypto.randomUUID()}`,
    userId: user.id,
    steamId64: user.steamId64,
    profilePublic: inspection.profilePublic,
    gameDetailsPublic: inspection.gameDetailsPublic,
    ownsCs2: inspection.ownsCs2,
    cs2Minutes: inspection.cs2Minutes,
    eligible: inspection.eligible,
    rawSnapshotJson: JSON.stringify(inspection),
    checkedAt: now,
  });
  return Response.json({
    ok: true,
    result: inspection,
    status: user.status === "verified" ? "verified" : "pending",
  });
}
