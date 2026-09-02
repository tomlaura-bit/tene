import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { privacyRequests, users } from "../../../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../../../lib/auth";
import { enforceRateLimit } from "../../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const db = getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!user) return Response.json({ ok: false, error: "profile_required" }, { status: 404 });
  const requests = await db.select().from(privacyRequests).where(eq(privacyRequests.userId, user.id)).orderBy(desc(privacyRequests.requestedAt)).limit(20);
  return Response.json({ ok: true, requests });
}

export async function POST(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const limited = await enforceRateLimit(request, "privacy_request", 2, 86400);
  if (limited) return limited;
  const body = await request.json().catch(() => null) as { type?: "export" | "deletion" } | null;
  if (!body || !["export", "deletion"].includes(body.type ?? ""))
    return Response.json({ ok: false, error: "invalid_privacy_request" }, { status: 400 });
  const db = getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.authSubjectId, identity.id)).limit(1);
  if (!user) return Response.json({ ok: false, error: "profile_required" }, { status: 404 });
  const id = `privacy_${crypto.randomUUID()}`;
  await db.insert(privacyRequests).values({ id, userId: user.id, type: body.type!, requestedAt: new Date() });
  return Response.json({ ok: true, id, status: "pending" }, { status: 201 });
}
