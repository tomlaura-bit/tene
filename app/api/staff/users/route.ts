import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { users } from "../../../../db/schema";
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
  if (!actor || !["owner", "admin"].includes(actor.role))
    return Response.json(
      { ok: false, error: "role_permission_required" },
      { status: 403 },
    );
  const rows = await db
    .select({
      id: users.id,
      nickname: users.nickname,
      role: users.role,
      status: users.status,
      avatarUrl: users.steamAvatarUrl,
    })
    .from(users)
    .orderBy(asc(users.nickname));
  return Response.json({ ok: true, actorRole: actor.role, users: rows });
}
