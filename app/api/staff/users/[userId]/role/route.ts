import { eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { auditLogs, roleAssignments, users } from "../../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../../lib/auth";

export const dynamic = "force-dynamic";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
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
  const { userId } = await params;
  const body = (await request.json()) as {
    role?: "player" | "sub" | "streamer" | "mod" | "admin" | "owner";
    reason?: string;
  };
  if (!body.role)
    return Response.json({ ok: false, error: "invalid_role" }, { status: 400 });
  if (actor.id === userId)
    return Response.json(
      { ok: false, error: "self_change_forbidden" },
      { status: 403 },
    );
  if (actor.role !== "owner" && ["owner", "admin"].includes(body.role))
    return Response.json(
      { ok: false, error: "owner_required" },
      { status: 403 },
    );
  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target || (target.role === "owner" && actor.role !== "owner"))
    return Response.json(
      { ok: false, error: "protected_role" },
      { status: 403 },
    );
  const now = new Date();
  await db.batch([
    db.update(users).set({ role: body.role }).where(eq(users.id, userId)),
    db
      .insert(roleAssignments)
      .values({
        id: `ra_${crypto.randomUUID()}`,
        userId,
        assignedById: actor.id,
        role: body.role,
        previousRole: target.role,
        reason: body.reason?.trim() || "Cambio desde panel de staff",
        createdAt: now,
      }),
    db
      .insert(auditLogs)
      .values({
        id: `audit_${crypto.randomUUID()}`,
        actorId: actor.id,
        targetUserId: userId,
        action: "role_change",
        entityType: "user",
        entityId: userId,
        beforeJson: JSON.stringify({ role: target.role }),
        afterJson: JSON.stringify({ role: body.role }),
        reason: body.reason?.trim() || null,
        createdAt: now,
      }),
  ]);
  return Response.json({ ok: true });
}
