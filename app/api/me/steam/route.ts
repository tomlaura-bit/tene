import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { steamProfileChecks, users } from "../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const { steamId64 } = (await request.json()) as { steamId64?: string };
  if (!steamId64 || !/^7656119\d{10}$/.test(steamId64))
    return Response.json(
      { ok: false, error: "invalid_steam_id" },
      { status: 400 },
    );
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!user)
    return Response.json(
      { ok: false, error: "onboarding_required" },
      { status: 409 },
    );
  const now = new Date();
  await db
    .update(users)
    .set({ steamId64, status: "pending" })
    .where(eq(users.id, user.id));
  await db.insert(steamProfileChecks).values({
    id: `spc_${crypto.randomUUID()}`,
    userId: user.id,
    steamId64,
    checkedAt: now,
  });
  return Response.json({
    ok: true,
    verificationStatus: "pending",
    message: "Steam registrado para verificación",
  });
}
