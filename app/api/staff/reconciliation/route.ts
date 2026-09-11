import { eq } from "drizzle-orm";
import { getD1, getDb } from "../../../../db";
import { auditLogs, reconciliationItems, reconciliations, users } from "../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../lib/auth";
import { enforceRateLimit } from "../../../../lib/rate-limit";
import { hasFinancialPermission } from "../../../../lib/finance/permissions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const limited = await enforceRateLimit(request, "finance_reconciliation", 3, 300);
  if (limited) return limited;
  const db = getDb();
  const [actor] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!actor || !(await hasFinancialPermission(actor, "reconciliation.run")))
    return Response.json(
      { ok: false, error: "finance_permission_required" },
      { status: 403 },
    );

  const d1 = getD1();
  const [wallets, withdrawals, rooms, invalid] = await Promise.all([
    d1.prepare("SELECT COALESCE(SUM(locked_cents), 0) AS cents FROM wallets").first<{ cents: number }>(),
    d1.prepare("SELECT COALESCE(SUM(amount_cents), 0) AS cents FROM payment_requests WHERE type = 'withdrawal' AND status = 'pending'").first<{ cents: number }>(),
    d1.prepare(`
      SELECT COALESCE(SUM(r.entry_cents), 0) AS cents
      FROM room_players rp
      JOIN rooms r ON r.id = rp.room_id
      LEFT JOIN benefit_passes bp
        ON bp.room_id = r.id AND bp.user_id = rp.user_id AND bp.status = 'used'
      WHERE r.status NOT IN ('settled', 'cancelled') AND bp.id IS NULL
    `).first<{ cents: number }>(),
    d1.prepare(`
      SELECT
        (SELECT COUNT(*) FROM wallets WHERE available_cents < 0 OR locked_cents < 0 OR debt_cents < 0) +
        (SELECT COUNT(*) FROM room_players WHERE slot_number IS NULL OR slot_number < 1 OR slot_number > 10) +
        (SELECT COUNT(*) FROM payment_requests p LEFT JOIN ledger_entries l ON l.payment_request_id = p.id WHERE p.status IN ('approved', 'paid', 'rejected') AND l.id IS NULL)
        AS count
    `).first<{ count: number }>(),
  ]);

  const expectedCents = Number(withdrawals?.cents ?? 0) + Number(rooms?.cents ?? 0);
  const actualCents = Number(wallets?.cents ?? 0);
  const differenceCents = actualCents - expectedCents;
  const invalidRecords = Number(invalid?.count ?? 0);
  const status = differenceCents === 0 && invalidRecords === 0 ? "matched" : "review";
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const id = `rec_${dateKey}`;

  const operations = await d1.prepare(`
    SELECT p.id, p.amount_cents, p.status, p.operation_code,
      COUNT(l.id) AS internal_count,
      COUNT(e.id) AS external_count,
      MAX(e.amount_cents) AS external_cents
    FROM payment_requests p
    LEFT JOIN ledger_entries l ON l.payment_request_id = p.id
    LEFT JOIN external_financial_movements e ON e.operation_ref = COALESCE(p.operation_code, p.id)
    GROUP BY p.id, p.amount_cents, p.status, p.operation_code
    ORDER BY p.requested_at DESC LIMIT 500
  `).all<{ id: string; amount_cents: number; status: string; operation_code: string | null; internal_count: number; external_count: number; external_cents: number | null }>();
  const items = operations.results.map((operation) => {
    const internalCount = Number(operation.internal_count);
    const externalCount = Number(operation.external_count);
    const terminal = ["approved", "paid", "rejected"].includes(operation.status);
    const itemStatus = !terminal ? "PENDING" : internalCount === 0 ? "MISSING_INTERNAL" : externalCount === 0 ? "MISSING_EXTERNAL" : externalCount > 1 ? "DUPLICATE" : Number(operation.external_cents) !== operation.amount_cents ? "AMOUNT_MISMATCH" : "MATCHED";
    return { id: `rci_${crypto.randomUUID()}`, reconciliationId: id, operationRef: operation.operation_code ?? operation.id, source: "provider" as const, internalCents: operation.amount_cents, externalCents: operation.external_cents, status: itemStatus as "MATCHED" | "MISSING_INTERNAL" | "MISSING_EXTERNAL" | "AMOUNT_MISMATCH" | "DUPLICATE" | "PENDING" | "MANUAL_REVIEW", detailsJson: JSON.stringify({ paymentId: operation.id, paymentStatus: operation.status, internalCount, externalCount }), createdAt: now };
  });

  const writes = [
    db
      .insert(reconciliations)
      .values({
        id,
        dateKey,
        expectedCents,
        actualCents,
        differenceCents,
        status,
        closedById: status === "matched" ? actor.id : null,
        closedAt: status === "matched" ? now : null,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: reconciliations.dateKey,
        set: {
          expectedCents,
          actualCents,
          differenceCents,
          status,
          closedById: status === "matched" ? actor.id : null,
          closedAt: status === "matched" ? now : null,
        },
      }),
    db.delete(reconciliationItems).where(eq(reconciliationItems.reconciliationId, id)),
    ...items.map((item) => db.insert(reconciliationItems).values(item)),
    db.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID()}`,
      actorId: actor.id,
      action: "financial_reconciliation_run",
      entityType: "reconciliation",
      entityId: id,
      afterJson: JSON.stringify({ expectedCents, actualCents, differenceCents, invalidRecords, status }),
      createdAt: now,
    }),
  ];
  await db.batch(writes as [never, ...never[]]);

  return Response.json({
    ok: true,
    reconciliation: { dateKey, expectedCents, actualCents, differenceCents, invalidRecords, status, items: items.length, discrepancies: items.filter((item) => !["MATCHED", "PENDING"].includes(item.status)).length },
  });
}
