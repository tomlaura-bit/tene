import { desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { sanctionAppeals, sanctions, users, wallets } from "../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../lib/auth";

export const dynamic = "force-dynamic";

async function getUser(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return null;
  const [user] = await getDb().select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  return user ?? null;
}

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return unauthorized();
  const db = getDb();
  const rows = await db.select().from(sanctions).where(eq(sanctions.userId, user.id)).orderBy(desc(sanctions.createdAt)).limit(50);
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1);
  const now = Date.now();
  const active = rows.filter((item) => !item.revokedAt && (!item.expiresAt || item.expiresAt.getTime() > now));
  const score = Math.max(0, 100 - rows.reduce((total, item) => total + ({ warning: 3, mute: 6, no_show: 8, abandonment: 18, suspension: 25, ban: 100 }[item.type] ?? 0), 0));
  return Response.json({ ok: true, score, debtCents: wallet?.debtCents ?? 0, activeSuspension: active.some((item) => ["suspension", "ban"].includes(item.type)), activeMutes: active.filter((item) => item.type === "mute").length, sanctions: rows.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), expiresAt: item.expiresAt?.toISOString() ?? null, revokedAt: item.revokedAt?.toISOString() ?? null })) });
}

export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as { sanctionId?: string; reason?: string };
  const reason = body.reason?.trim() ?? "";
  if (!body.sanctionId || reason.length < 10 || reason.length > 1000)
    return Response.json({ ok: false, error: "invalid_appeal" }, { status: 400 });
  const db = getDb();
  const [sanction] = await db.select().from(sanctions).where(eq(sanctions.id, body.sanctionId)).limit(1);
  if (!sanction || sanction.userId !== user.id) return Response.json({ ok: false, error: "sanction_not_found" }, { status: 404 });
  const existing = await db.select().from(sanctionAppeals).where(eq(sanctionAppeals.sanctionId, sanction.id)).limit(1);
  if (existing.length) return Response.json({ ok: true, duplicate: true });
  await db.insert(sanctionAppeals).values({ id: `appeal_${crypto.randomUUID()}`, sanctionId: sanction.id, userId: user.id, reason, createdAt: new Date() });
  return Response.json({ ok: true }, { status: 201 });
}
