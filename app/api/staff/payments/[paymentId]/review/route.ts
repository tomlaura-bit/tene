import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import {
  auditLogs,
  ledgerEntries,
  outboxEvents,
  paymentRequests,
  users,
  wallets,
} from "../../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../../lib/auth";
import { hasFinancialPermission } from "../../../../../../lib/finance/permissions";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const db = getDb();
  const [actor] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!actor || !(await hasFinancialPermission(actor, "payment.review")))
    return Response.json(
      { ok: false, error: "finance_permission_required" },
      { status: 403 },
    );
  const { paymentId } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    decision?: "approve" | "reject";
    notes?: string;
  };
  if (!body.decision || !["approve", "reject"].includes(body.decision))
    return Response.json(
      { ok: false, error: "invalid_decision" },
      { status: 400 },
    );
  const [payment] = await db
    .select()
    .from(paymentRequests)
    .where(eq(paymentRequests.id, paymentId))
    .limit(1);
  if (!payment || payment.status !== "pending")
    return Response.json(
      { ok: false, error: "already_processed" },
      { status: 409 },
    );
  if (body.decision === "approve" && payment.type === "withdrawal" && !(await hasFinancialPermission(actor, "withdrawal.approve")))
    return Response.json({ ok: false, error: "withdrawal_approval_permission_required" }, { status: 403 });

  const approved = body.decision === "approve";
  const walletMutation =
    payment.type === "deposit"
      ? approved
        ? {
            availableCents: sql`${wallets.availableCents} + ${payment.amountCents}`,
          }
        : null
      : approved
        ? { lockedCents: sql`${wallets.lockedCents} - ${payment.amountCents}` }
        : {
            availableCents: sql`${wallets.availableCents} + ${payment.amountCents}`,
            lockedCents: sql`${wallets.lockedCents} - ${payment.amountCents}`,
          };
  const now = new Date();
  const batch = [
    db
      .update(paymentRequests)
      .set({
        status: approved
          ? payment.type === "withdrawal"
            ? "paid"
            : "approved"
          : "rejected",
        reviewedById: actor.id,
        reviewNotes: body.notes?.trim() || null,
        reviewedAt: now,
      })
      .where(
        and(
          eq(paymentRequests.id, paymentId),
          eq(paymentRequests.status, "pending"),
        ),
      ),
  ];
  if (walletMutation)
    batch.push(
      db
        .update(wallets)
        .set(walletMutation)
        .where(eq(wallets.userId, payment.userId)) as never,
    );
  batch.push(
    db.insert(ledgerEntries).values({
      id: `led_${crypto.randomUUID()}`,
      paymentRequestId: payment.id,
      userId: payment.userId,
      type: payment.type === "deposit" ? "deposit" : "withdrawal",
      amountCents: approved
        ? payment.type === "deposit"
          ? payment.amountCents
          : -payment.amountCents
        : 0,
      description: `${payment.type === "deposit" ? "Recarga" : "Retiro"} ${payment.method.toUpperCase()} ${approved ? "aprobado" : "rechazado"}`,
      createdAt: now,
    }) as never,
    db.insert(auditLogs).values({
      id: `audit_${crypto.randomUUID()}`,
      actorId: actor.id,
      targetUserId: payment.userId,
      action: `payment_${body.decision}`,
      entityType: "payment_request",
      entityId: payment.id,
      reason: body.notes?.trim() || null,
      createdAt: now,
    }) as never,
  );
  if (approved) {
    const debitWallet = payment.type === "withdrawal";
    batch.push(db.insert(outboxEvents).values({
      id: `out_${crypto.randomUUID()}`,
      deduplicationKey: `ledger:payment:${payment.id}`,
      topic: "ledger.post",
      aggregateType: "payment_request",
      aggregateId: payment.id,
      payloadJson: JSON.stringify({
        externalRef: `payment:${payment.id}`,
        type: payment.type,
        description: `Pago ${payment.id}`,
        userId: payment.userId,
        legacyType: payment.type,
        postings: [
          { accountCode: debitWallet ? `user:${payment.userId}:wallet` : "platform:cash", accountName: debitWallet ? "Wallet del jugador" : "Caja", accountKind: debitWallet ? "liability" : "asset", normalBalance: debitWallet ? "credit" : "debit", direction: "debit", amountCents: payment.amountCents },
          { accountCode: debitWallet ? "platform:cash" : `user:${payment.userId}:wallet`, accountName: debitWallet ? "Caja" : "Wallet del jugador", accountKind: debitWallet ? "asset" : "liability", normalBalance: debitWallet ? "debit" : "credit", direction: "credit", amountCents: payment.amountCents },
        ],
      }),
      status: "pending",
      availableAt: now,
      createdAt: now,
    }) as never);
  }
  try {
    await db.batch(batch as [never, ...never[]]);
  } catch {
    return Response.json(
      { ok: false, error: "review_conflict" },
      { status: 409 },
    );
  }
  return Response.json({ ok: true });
}
