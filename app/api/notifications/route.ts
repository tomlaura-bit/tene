import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { notificationPreferences, notifications, users } from "../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../lib/auth";

export const dynamic = "force-dynamic";

async function currentUser(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return null;
  const [user] = await getDb().select().from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  return user ?? null;
}

export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const db = getDb();
  const items = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(100);
  const [prefs] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, user.id)).limit(1);
  return Response.json({ ok: true, items: items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), readAt: item.readAt?.toISOString() ?? null })), preferences: prefs ?? { matches: true, wallet: true, staff: true, community: false, emailEnabled: false } });
}

export async function PATCH(request: Request) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as { notificationId?: string; readAll?: boolean; preferences?: { matches?: boolean; wallet?: boolean; staff?: boolean; community?: boolean } };
  const db = getDb();
  if (body.readAll) await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.userId, user.id));
  else if (body.notificationId) await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, body.notificationId));
  if (body.preferences) {
    const values = { userId: user.id, matches: body.preferences.matches ?? true, wallet: body.preferences.wallet ?? true, staff: body.preferences.staff ?? true, community: body.preferences.community ?? false, updatedAt: new Date() };
    await db.insert(notificationPreferences).values(values).onConflictDoUpdate({ target: notificationPreferences.userId, set: { matches: values.matches, wallet: values.wallet, staff: values.staff, community: values.community, updatedAt: sql`CURRENT_TIMESTAMP` } });
  }
  return Response.json({ ok: true });
}
