import { and, desc, eq, gt, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { auditLogs, benefitPasses, birthdayRewards, ledgerEntries, subscriptions, users, wallets } from "../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../lib/auth";

export const dynamic = "force-dynamic";

async function currentUser(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return null;
  const [user] = await getDb().select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  return user ?? null;
}

async function grantDuePasses(user: typeof users.$inferSelect) {
  const db = getDb();
  const now = new Date();
  const limaDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const [year, month, day] = limaDate.split("-").map(Number);
  const [active] = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active"), gt(subscriptions.endsAt, now))).orderBy(desc(subscriptions.endsAt)).limit(1);
  if (active) {
    const [daily] = await db.select().from(benefitPasses).where(and(eq(benefitPasses.userId, user.id), eq(benefitPasses.source, "daily_sub"), eq(benefitPasses.validOn, limaDate))).limit(1);
    if (!daily) await db.insert(benefitPasses).values({ id: `ben_${crypto.randomUUID()}`, userId: user.id, source: "daily_sub", validOn: limaDate, expiresAt: new Date(`${limaDate}T23:59:59-05:00`), createdAt: now });
  }
  if (user.birthDate) {
    const [, birthMonth, birthDay] = user.birthDate.split("-").map(Number);
    const [reward] = await db.select().from(birthdayRewards).where(and(eq(birthdayRewards.userId, user.id), eq(birthdayRewards.year, year))).limit(1);
    if (birthMonth === month && birthDay === day && !reward) {
      const expires = new Date(now.getTime() + 7 * 86400000);
      await db.batch([
        db.insert(birthdayRewards).values({ id: `bday_${crypto.randomUUID()}`, userId: user.id, year, grantedAt: now }),
        db.insert(benefitPasses).values({ id: `ben_${crypto.randomUUID()}`, userId: user.id, source: "birthday", expiresAt: expires, createdAt: now }),
        db.insert(benefitPasses).values({ id: `ben_${crypto.randomUUID()}`, userId: user.id, source: "birthday", expiresAt: expires, createdAt: now }),
      ]);
    }
  }
}

export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  await grantDuePasses(user);
  const db = getDb();
  const now = new Date();
  await db.update(benefitPasses).set({ status: "expired" }).where(and(eq(benefitPasses.userId, user.id), eq(benefitPasses.status, "available"), sql`${benefitPasses.expiresAt} IS NOT NULL AND ${benefitPasses.expiresAt} < ${now}`));
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).orderBy(desc(subscriptions.createdAt)).limit(1);
  const passes = await db.select().from(benefitPasses).where(eq(benefitPasses.userId, user.id)).orderBy(desc(benefitPasses.createdAt)).limit(50);
  return Response.json({ ok: true, subscription: subscription ?? null, passes });
}

export async function POST(request: Request) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "subscribe") return Response.json({ ok: false, error: "invalid_action" }, { status: 400 });
  const db = getDb();
  const now = new Date();
  const [active] = await db.select().from(subscriptions).where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active"), gt(subscriptions.endsAt, now))).limit(1);
  if (active) return Response.json({ ok: true, subscription: active, alreadyActive: true });
  const charged = await db.update(wallets).set({ availableCents: sql`${wallets.availableCents} - 2000` }).where(and(eq(wallets.userId, user.id), sql`${wallets.availableCents} >= 2000`)).returning();
  if (!charged.length) return Response.json({ ok: false, error: "insufficient_balance" }, { status: 402 });
  const endsAt = new Date(now.getTime() + 30 * 86400000);
  try {
    await db.batch([
      db.insert(subscriptions).values({ id: `sub_${crypto.randomUUID()}`, userId: user.id, status: "active", startsAt: now, endsAt, createdAt: now }),
      db.insert(ledgerEntries).values({ id: `led_${crypto.randomUUID()}`, userId: user.id, type: "adjustment", amountCents: -2000, description: "Suscripción TENE Sub · 30 días", createdAt: now }),
      db.update(users).set({ role: user.role === "player" ? "sub" : user.role }).where(eq(users.id, user.id)),
      db.insert(auditLogs).values({ id: `aud_${crypto.randomUUID()}`, actorId: user.id, targetUserId: user.id, action: "subscription_activated", entityType: "subscription", reason: "Compra de TENE Sub", afterJson: JSON.stringify({ endsAt: endsAt.toISOString(), priceCents: 2000 }), createdAt: now }),
    ]);
  } catch {
    await db.update(wallets).set({ availableCents: sql`${wallets.availableCents} + 2000` }).where(eq(wallets.userId, user.id));
    return Response.json({ ok: false, error: "subscription_failed" }, { status: 409 });
  }
  await grantDuePasses(user);
  return Response.json({ ok: true, endsAt: endsAt.toISOString() });
}
