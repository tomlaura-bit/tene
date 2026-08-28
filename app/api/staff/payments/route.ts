import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { ledgerEntries, paymentRequests, users } from "../../../../db/schema";
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
      { ok: false, error: "finance_permission_required" },
      { status: 403 },
    );
  const rows = await db
    .select({
      id: paymentRequests.id,
      type: paymentRequests.type,
      method: paymentRequests.method,
      amountCents: paymentRequests.amountCents,
      operationCode: paymentRequests.operationCode,
      destinationName: paymentRequests.destinationName,
      destinationPhone: paymentRequests.destinationPhone,
      proofUrl: paymentRequests.proofUrl,
      status: paymentRequests.status,
      requestedAt: paymentRequests.requestedAt,
      userId: users.id,
      nickname: users.nickname,
      fullName: users.fullName,
    })
    .from(paymentRequests)
    .innerJoin(users, eq(paymentRequests.userId, users.id))
    .orderBy(desc(paymentRequests.requestedAt))
    .limit(100);
  const ledger = await db.select({ id: ledgerEntries.id, userId: ledgerEntries.userId, nickname: users.nickname, roomId: ledgerEntries.roomId, type: ledgerEntries.type, amountCents: ledgerEntries.amountCents, description: ledgerEntries.description, createdAt: ledgerEntries.createdAt }).from(ledgerEntries).innerJoin(users, eq(ledgerEntries.userId, users.id)).orderBy(desc(ledgerEntries.createdAt)).limit(200);
  return Response.json({ ok: true, requests: rows, ledger });
}
