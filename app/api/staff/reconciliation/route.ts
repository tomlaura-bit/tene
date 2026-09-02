import { eq } from "drizzle-orm";
import { getD1, getDb } from "../../../../db";
import { auditLogs, reconciliations, users } from "../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../lib/auth";
import { enforceRateLimit } from "../../../../lib/rate-limit";

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
  if (!actor || !["owner", "admin"].includes(actor.role))
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

  await db.batch([
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
    db.insert(auditLogs).values({
      id: `aud_${crypto.randomUUID()}`,
      actorId: actor.id,
      action: "financial_reconciliation_run",
      entityType: "reconciliation",
      entityId: id,
      afterJson: JSON.stringify({ expectedCents, actualCents, differenceCents, invalidRecords, status }),
      createdAt: now,
    }),
  ]);

  return Response.json({
    ok: true,
    reconciliation: { dateKey, expectedCents, actualCents, differenceCents, invalidRecords, status },
  });
}
