import { eq } from "drizzle-orm";
import { getDb } from "../../../../../../db";
import { chatMessages, chatReports, users } from "../../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const { reportId } = await params;
  const body = (await request.json().catch(() => ({}))) as { decision?: string };
  if (!['remove', 'dismiss'].includes(body.decision ?? ''))
    return Response.json({ ok: false, error: "invalid_decision" }, { status: 400 });
  const db = getDb();
  const [staff] = await db.select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!staff || !["owner", "admin", "mod"].includes(staff.role))
    return Response.json({ ok: false, error: "staff_required" }, { status: 403 });
  const [report] = await db.select().from(chatReports).where(eq(chatReports.id, reportId)).limit(1);
  if (!report || report.status !== "pending")
    return Response.json({ ok: false, error: "report_unavailable" }, { status: 404 });
  const now = new Date();
  if (body.decision === "remove") {
    await db.update(chatMessages).set({ deletedAt: now, deletedById: staff.id }).where(eq(chatMessages.id, report.messageId));
  }
  await db.update(chatReports).set({
    status: body.decision === "remove" ? "resolved" : "dismissed",
    reviewedById: staff.id,
    reviewedAt: now,
  }).where(eq(chatReports.id, report.id));
  return Response.json({ ok: true });
}
