import { and, eq, isNotNull, lt } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../../../../db";
import {
  auditLogs,
  idempotencyKeys,
  paymentRequests,
  rateLimits,
  users,
  webhookReceipts,
} from "../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../lib/auth";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const limited = await enforceRateLimit(request, "operations_maintenance", 2, 600);
  if (limited) return limited;
  const db = getDb();
  const [actor] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!actor || actor.role !== "owner")
    return Response.json(
      { ok: false, error: "owner_permission_required" },
      { status: 403 },
    );

  const now = new Date();
  const proofCutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const webhookCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const expiredProofs = await db
    .select({ id: paymentRequests.id, key: paymentRequests.proofUrl })
    .from(paymentRequests)
    .where(
      and(
        isNotNull(paymentRequests.proofUrl),
        lt(paymentRequests.reviewedAt, proofCutoff),
      ),
    )
    .limit(100);

  let deletedProofs = 0;
  for (const proof of expiredProofs) {
    if (!proof.key) continue;
    await env.UPLOADS.delete(proof.key);
    await db
      .update(paymentRequests)
      .set({ proofUrl: null })
      .where(eq(paymentRequests.id, proof.id));
    deletedProofs += 1;
  }

  const [idempotency, limits, webhooks] = await db.batch([
    db.delete(idempotencyKeys).where(lt(idempotencyKeys.expiresAt, now)),
    db.delete(rateLimits).where(lt(rateLimits.expiresAt, Math.floor(now.getTime() / 1000))),
    db.delete(webhookReceipts).where(lt(webhookReceipts.receivedAt, webhookCutoff)),
  ]);
  const changes = (value: unknown) =>
    Number((value as { meta?: { changes?: number } })?.meta?.changes ?? 0);

  const summary = {
    deletedProofs,
    deletedIdempotencyKeys: changes(idempotency),
    deletedRateLimits: changes(limits),
    deletedWebhookReceipts: changes(webhooks),
  };
  await db.insert(auditLogs).values({
    id: `aud_${crypto.randomUUID()}`,
    actorId: actor.id,
    action: "operations_maintenance_run",
    entityType: "system",
    afterJson: JSON.stringify(summary),
    createdAt: now,
  });
  return Response.json({ ok: true, summary });
}
