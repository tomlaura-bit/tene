import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { chatMessages, chatReports, users } from "../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const { messageId } = await params;
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!user) return Response.json({ ok: false, error: "account_required" }, { status: 403 });
  const [message] = await db
    .select({ id: chatMessages.id, userId: chatMessages.userId })
    .from(chatMessages)
    .where(eq(chatMessages.id, messageId))
    .limit(1);
  if (!message) return Response.json({ ok: false, error: "message_not_found" }, { status: 404 });
  if (message.userId === user.id)
    return Response.json({ ok: false, error: "own_message" }, { status: 400 });
  const [existing] = await db
    .select({ id: chatReports.id })
    .from(chatReports)
    .where(and(eq(chatReports.messageId, messageId), eq(chatReports.reporterId, user.id)))
    .limit(1);
  if (existing) return Response.json({ ok: true, duplicate: true });

  await db.insert(chatReports).values({
    id: `chat_report_${crypto.randomUUID()}`,
    messageId,
    reporterId: user.id,
    reason: "Contenido inapropiado o incumplimiento de las reglas",
    createdAt: new Date(),
  });
  return Response.json({ ok: true }, { status: 201 });
}
