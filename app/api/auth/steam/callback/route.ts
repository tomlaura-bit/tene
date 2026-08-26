import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { steamProfileChecks, users } from "../../../../../db/schema";
import { getAuthenticatedUser } from "../../../../../lib/auth";
import {
  inspectSteamProfile,
  TENE_ORIGIN,
  verifySteamOpenId,
} from "../../../../../lib/steam";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity)
    return Response.redirect(
      `${TENE_ORIGIN}/signin-with-chatgpt?return_to=/api/auth/steam`,
      302,
    );
  const steamId64 = await verifySteamOpenId(new URL(request.url));
  if (!steamId64)
    return Response.redirect(`${TENE_ORIGIN}/?steam=invalid`, 302);
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!user) return Response.redirect(`${TENE_ORIGIN}/?steam=onboarding`, 302);
  const check = await inspectSteamProfile(steamId64, env.STEAM_WEB_API_KEY);
  const successful = check.ok;
  const now = new Date();
  await db
    .update(users)
    .set({
      steamId64,
      steamPersonaName: successful ? check.personaName : null,
      steamAvatarUrl: successful ? check.avatarUrl : null,
      steamLinkedAt: now,
      cs2Minutes: successful ? check.cs2Minutes : 0,
      status: successful && check.eligible ? "verified" : "pending",
    })
    .where(eq(users.id, user.id));
  await db.insert(steamProfileChecks).values({
    id: `spc_${crypto.randomUUID()}`,
    userId: user.id,
    steamId64,
    profilePublic: successful ? check.profilePublic : false,
    gameDetailsPublic: successful ? check.gameDetailsPublic : false,
    ownsCs2: successful ? check.ownsCs2 : false,
    cs2Minutes: successful ? check.cs2Minutes : 0,
    eligible: successful ? check.eligible : false,
    rawSnapshotJson: JSON.stringify(check),
    checkedAt: now,
  });
  return Response.redirect(
    `${TENE_ORIGIN}/?steam=${successful && check.eligible ? "verified" : "linked"}`,
    302,
  );
}
