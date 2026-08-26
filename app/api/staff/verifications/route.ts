import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import { steamProfileChecks, users } from "../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const db = getDb();
  const [actor] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!actor || !["owner", "admin", "mod"].includes(actor.role))
    return Response.json(
      { ok: false, error: "staff_required" },
      { status: 403 },
    );
  const candidates = await db
    .select()
    .from(users)
    .where(inArray(users.status, ["pending", "rejected"]))
    .orderBy(desc(users.createdAt))
    .limit(50);
  const result = await Promise.all(
    candidates.map(async (candidate) => {
      const [check] = candidate.steamId64
        ? await db
            .select()
            .from(steamProfileChecks)
            .where(eq(steamProfileChecks.userId, candidate.id))
            .orderBy(desc(steamProfileChecks.checkedAt))
            .limit(1)
        : [];
      return { user: candidate, check: check ?? null };
    }),
  );
  return Response.json({ ok: true, candidates: result });
}
