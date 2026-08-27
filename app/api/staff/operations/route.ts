import { desc, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { getDb } from "../../../../db";
import { auditLogs, disputeEvidence, ledgerEntries, matchDisputes, notifications, rooms, sanctionAppeals, sanctions, users, wallets } from "../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

async function actorFor(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return null;
  const [actor] = await getDb().select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  return actor && ["owner", "admin", "mod"].includes(actor.role) ? actor : null;
}

export async function GET(request: Request) {
  const actor = await actorFor(request);
  if (!actor) return unauthorized();
  const db = getDb();
  const disputes = await db.select({ id: matchDisputes.id, roomId: matchDisputes.roomId, roomName: rooms.name, reporterId: matchDisputes.reporterId, accusedUserId: matchDisputes.accusedUserId, reason: matchDisputes.reason, description: matchDisputes.description, status: matchDisputes.status, resolution: matchDisputes.resolution, createdAt: matchDisputes.createdAt }).from(matchDisputes).leftJoin(rooms, eq(matchDisputes.roomId, rooms.id)).orderBy(desc(matchDisputes.createdAt)).limit(100);
  const evidence = await db.select({ id: disputeEvidence.id, disputeId: disputeEvidence.disputeId, type: disputeEvidence.type, description: disputeEvidence.description, createdAt: disputeEvidence.createdAt }).from(disputeEvidence).orderBy(desc(disputeEvidence.createdAt)).limit(200);
  const sanctionRows = await db.select({ id: sanctions.id, userId: sanctions.userId, nickname: users.nickname, type: sanctions.type, reason: sanctions.reason, penaltyCents: sanctions.penaltyCents, expiresAt: sanctions.expiresAt, revokedAt: sanctions.revokedAt, createdAt: sanctions.createdAt }).from(sanctions).innerJoin(users, eq(sanctions.userId, users.id)).orderBy(desc(sanctions.createdAt)).limit(100);
  const appeals = await db.select({ id: sanctionAppeals.id, sanctionId: sanctionAppeals.sanctionId, userId: sanctionAppeals.userId, nickname: users.nickname, reason: sanctionAppeals.reason, status: sanctionAppeals.status, resolution: sanctionAppeals.resolution, createdAt: sanctionAppeals.createdAt }).from(sanctionAppeals).innerJoin(users, eq(sanctionAppeals.userId, users.id)).orderBy(desc(sanctionAppeals.createdAt)).limit(100);
  const audits = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
  const userRows = await db.select({ id: users.id, nickname: users.nickname, role: users.role, status: users.status, level: users.level }).from(users).orderBy(desc(users.createdAt)).limit(200);
  return Response.json({ ok: true, disputes: disputes.map((item) => ({ ...item, evidence: evidence.filter((file) => file.disputeId === item.id) })), sanctions: sanctionRows, appeals, audits, users: userRows });
}

export async function POST(request: Request) {
  const actor = await actorFor(request);
  if (!actor) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as { action?: string; userId?: string; type?: "warning"|"mute"|"suspension"|"ban"|"no_show"|"abandonment"; reason?: string; penaltyCents?: number; expiresHours?: number; appealId?: string; decision?: "accepted"|"rejected"; resolution?: string };
  const db = getDb();
  const now = new Date();
  if (body.action === "sanction") {
    if (!body.userId || !body.type || !body.reason?.trim()) return Response.json({ ok: false, error: "invalid_sanction" }, { status: 400 });
    const [target] = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
    if (!target || (target.role === "owner" && actor.role !== "owner")) return Response.json({ ok: false, error: "target_not_allowed" }, { status: 403 });
    const penalty = Math.max(0, Math.min(1200, Math.round(Number(body.penaltyCents) || 0)));
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, target.id)).limit(1);
    const fromAvailable = Math.min(wallet?.availableCents ?? 0, penalty);
    const debt = penalty - fromAvailable;
    const expiresAt = body.type === "ban" ? null : new Date(now.getTime() + Math.max(1, Number(body.expiresHours) || 24) * 3600000);
    const id = `san_${crypto.randomUUID()}`;
    await db.batch([
      db.insert(sanctions).values({ id, userId: target.id, issuedById: actor.id, type: body.type, reason: body.reason.trim(), penaltyCents: penalty, expiresAt, createdAt: now }),
      ...(penalty ? [db.update(wallets).set({ availableCents: sql`${wallets.availableCents} - ${fromAvailable}`, debtCents: sql`${wallets.debtCents} + ${debt}` }).where(eq(wallets.userId, target.id)), db.insert(ledgerEntries).values({ id: `led_${crypto.randomUUID()}`, userId: target.id, type: "penalty", amountCents: -penalty, description: body.reason.trim(), createdAt: now })] : []),
      ...(["suspension", "ban"].includes(body.type) ? [db.update(users).set({ status: body.type === "ban" ? "banned" : "suspended" }).where(eq(users.id, target.id))] : []),
      db.insert(notifications).values({ id: `not_${crypto.randomUUID()}`, userId: target.id, type: "sanction", title: "Sanción aplicada", body: `${body.reason.trim()}${penalty ? ` · Multa S/ ${(penalty / 100).toFixed(2)}` : ""}`, actionUrl: "/conduct", createdAt: now }),
      db.insert(auditLogs).values({ id: `aud_${crypto.randomUUID()}`, actorId: actor.id, targetUserId: target.id, action: "sanction_created", entityType: "sanction", entityId: id, afterJson: JSON.stringify({ type: body.type, penaltyCents: penalty, expiresAt }), reason: body.reason.trim(), createdAt: now }),
    ] as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
    return Response.json({ ok: true, sanctionId: id });
  }
  if (body.action === "review_appeal") {
    if (!body.appealId || !["accepted", "rejected"].includes(body.decision ?? "") || !body.resolution?.trim()) return Response.json({ ok: false, error: "invalid_appeal_review" }, { status: 400 });
    const [appeal] = await db.select().from(sanctionAppeals).where(eq(sanctionAppeals.id, body.appealId)).limit(1);
    if (!appeal || appeal.status !== "pending") return Response.json({ ok: false, error: "appeal_not_pending" }, { status: 409 });
    const [sanction] = await db.select().from(sanctions).where(eq(sanctions.id, appeal.sanctionId)).limit(1);
    if (!sanction) return Response.json({ ok: false, error: "sanction_not_found" }, { status: 404 });
    const actions: BatchItem<"sqlite">[] = [db.update(sanctionAppeals).set({ status: body.decision!, resolution: body.resolution.trim(), reviewedById: actor.id, reviewedAt: now }).where(eq(sanctionAppeals.id, appeal.id)), db.insert(notifications).values({ id: `not_${crypto.randomUUID()}`, userId: appeal.userId, type: "staff", title: body.decision === "accepted" ? "Apelación aceptada" : "Apelación rechazada", body: body.resolution.trim(), actionUrl: "/conduct", createdAt: now }), db.insert(auditLogs).values({ id: `aud_${crypto.randomUUID()}`, actorId: actor.id, targetUserId: appeal.userId, action: `appeal_${body.decision}`, entityType: "sanction_appeal", entityId: appeal.id, reason: body.resolution.trim(), createdAt: now })];
    if (body.decision === "accepted") {
      const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, appeal.userId)).limit(1);
      const debtReduction = Math.min(wallet?.debtCents ?? 0, sanction.penaltyCents);
      const refund = sanction.penaltyCents - debtReduction;
      actions.push(db.update(sanctions).set({ revokedAt: now }).where(eq(sanctions.id, sanction.id)), db.update(wallets).set({ debtCents: sql`${wallets.debtCents} - ${debtReduction}`, availableCents: sql`${wallets.availableCents} + ${refund}` }).where(eq(wallets.userId, appeal.userId)), db.insert(ledgerEntries).values({ id: `led_${crypto.randomUUID()}`, userId: appeal.userId, type: "adjustment", amountCents: sanction.penaltyCents, description: `Sanción revocada: ${body.resolution.trim()}`, createdAt: now }), db.update(users).set({ status: "verified" }).where(eq(users.id, appeal.userId)));
    }
    await db.batch(actions as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false, error: "invalid_action" }, { status: 400 });
}
