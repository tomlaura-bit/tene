import { eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import {
  auditLogs,
  playerRatings,
  users,
  verificationReviews,
} from "../../../../../../db/schema";
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
  if (!actor || !["owner", "admin", "mod"].includes(actor.role))
    return Response.json(
      { ok: false, error: "staff_required" },
      { status: 403 },
    );
  const { userId } = await params;
  const body = (await request.json()) as {
    decision?: "approve" | "reject";
    level?: number;
    notes?: string;
  };
  const level = Math.round(Number(body.level));
  if (
    !body.decision ||
    (body.decision === "approve" && (level < 1 || level > 10))
  )
    return Response.json(
      { ok: false, error: "invalid_review" },
      { status: 400 },
    );
  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target?.steamId64)
    return Response.json(
      { ok: false, error: "steam_required" },
      { status: 409 },
    );
  const now = new Date();
  await db.batch([
    db
      .update(users)
      .set({
        status: body.decision === "approve" ? "verified" : "rejected",
        level: body.decision === "approve" ? level : target.level,
      })
      .where(eq(users.id, userId)),
    db
      .update(playerRatings)
      .set({
        level,
        calibrationStatus: "staff_assigned",
        calibratedById: actor.id,
        updatedAt: now,
      })
      .where(eq(playerRatings.userId, userId)),
    db
      .insert(verificationReviews)
      .values({
        id: `vr_${crypto.randomUUID()}`,
        userId,
        reviewerId: actor.id,
        status: body.decision === "approve" ? "approved" : "rejected",
        assignedLevel: body.decision === "approve" ? level : null,
        profilePublic: true,
        gameDetailsPublic: true,
        notes: body.notes?.trim() || null,
        reviewedAt: now,
        createdAt: now,
      }),
    db
      .insert(auditLogs)
      .values({
        id: `audit_${crypto.randomUUID()}`,
        actorId: actor.id,
        targetUserId: userId,
        action: `verification_${body.decision}`,
        entityType: "user",
        entityId: userId,
        reason: body.notes?.trim() || null,
        createdAt: now,
      }),
  ]);
  return Response.json({ ok: true });
}
