import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import { chatMessages, chatReports, users } from "../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const db = getDb();
  const [staff] = await db.select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!staff || !["owner", "admin", "mod"].includes(staff.role))
    return Response.json({ ok: false, error: "staff_required" }, { status: 403 });

  const reports = await db.select().from(chatReports).orderBy(desc(chatReports.createdAt)).limit(100);
  const messageIds = reports.map((report) => report.messageId);
  const messages = messageIds.length
    ? await db.select().from(chatMessages).where(inArray(chatMessages.id, messageIds))
    : [];
  const userIds = [...new Set([...reports.map((r) => r.reporterId), ...messages.map((m) => m.userId)])];
  const people = userIds.length
    ? await db.select({ id: users.id, nickname: users.nickname }).from(users).where(inArray(users.id, userIds))
    : [];
  return Response.json({
    ok: true,
    reports: reports.map((report) => {
      const message = messages.find((item) => item.id === report.messageId);
      return {
        id: report.id,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt.toISOString(),
        message: message?.body ?? "Mensaje no disponible",
        author: people.find((person) => person.id === message?.userId)?.nickname ?? "Desconocido",
        reporter: people.find((person) => person.id === report.reporterId)?.nickname ?? "Desconocido",
      };
    }),
  });
}
