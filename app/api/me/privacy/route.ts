import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { publicPlayerProfiles, users } from "../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../lib/auth";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const limited = await enforceRateLimit(request, "privacy_write", 10, 60);
  if (limited) return limited;
  const body = await request.json().catch(() => null) as { matchHistoryVisible?: boolean } | null;
  if (typeof body?.matchHistoryVisible !== "boolean") return Response.json({ ok: false, error: "invalid_privacy_settings" }, { status: 400 });
  const db = getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!user) return Response.json({ ok: false, error: "profile_required" }, { status: 409 });
  await db.insert(publicPlayerProfiles).values({ userId: user.id, matchHistoryVisible: body.matchHistoryVisible, updatedAt: new Date() }).onConflictDoUpdate({ target: publicPlayerProfiles.userId, set: { matchHistoryVisible: body.matchHistoryVisible, updatedAt: new Date() } });
  return Response.json({ ok: true, matchHistoryVisible: body.matchHistoryVisible });
}
