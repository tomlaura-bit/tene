import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import {
  chatMessages,
  ledgerEntries,
  notifications,
  paymentRequests,
  playerRatings,
  publicPlayerProfiles,
  sanctions,
  users,
  wallets,
} from "../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../lib/auth";
import { enforceRateLimit } from "../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const limited = await enforceRateLimit(request, "personal_data_export", 2, 3600);
  if (limited) return limited;
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!user)
    return Response.json({ ok: false, error: "profile_required" }, { status: 404 });

  const [wallet, rating, profile, ledger, payments, userSanctions, userNotifications, messages] =
    await Promise.all([
      db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1),
      db.select().from(playerRatings).where(eq(playerRatings.userId, user.id)).limit(1),
      db.select().from(publicPlayerProfiles).where(eq(publicPlayerProfiles.userId, user.id)).limit(1),
      db.select().from(ledgerEntries).where(eq(ledgerEntries.userId, user.id)).orderBy(desc(ledgerEntries.createdAt)),
      db.select().from(paymentRequests).where(eq(paymentRequests.userId, user.id)).orderBy(desc(paymentRequests.requestedAt)),
      db.select().from(sanctions).where(eq(sanctions.userId, user.id)).orderBy(desc(sanctions.createdAt)),
      db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)),
      db.select().from(chatMessages).where(eq(chatMessages.userId, user.id)).orderBy(desc(chatMessages.createdAt)),
    ]);
  const generatedAt = new Date().toISOString();
  const payload = {
    generatedAt,
    user,
    wallet: wallet[0] ?? null,
    rating: rating[0] ?? null,
    publicProfile: profile[0] ?? null,
    ledger,
    payments: payments.map((payment) =>
      Object.fromEntries(
        Object.entries(payment).filter(([key]) => key !== "proofUrl"),
      ),
    ),
    sanctions: userSanctions,
    notifications: userNotifications,
    chatMessages: messages,
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="tene-data-${generatedAt.slice(0, 10)}.json"`,
      "cache-control": "private, no-store",
    },
  });
}
