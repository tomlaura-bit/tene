import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { playerRatings, users, wallets } from "../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const db = getDb();
  const [record] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!record)
    return Response.json({
      ok: true,
      onboardingRequired: true,
      identity: { email: identity.email, fullName: identity.fullName },
    });
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, record.id))
    .limit(1);
  const [rating] = await db
    .select()
    .from(playerRatings)
    .where(eq(playerRatings.userId, record.id))
    .limit(1);
  return Response.json({
    ok: true,
    onboardingRequired: false,
    user: record,
    wallet: wallet ?? null,
    rating: rating ?? null,
  });
}

export async function POST(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const body = (await request.json()) as {
    fullName?: string;
    nickname?: string;
    email?: string;
    birthDate?: string;
  };
  const fullName = body.fullName?.trim();
  const nickname = body.nickname?.trim();
  const email =
    body.email?.trim().toLowerCase() || identity.email.toLowerCase();
  const birthDate = body.birthDate?.trim();
  if (!fullName || !nickname || !birthDate || !/^\S+@\S+\.\S+$/.test(email))
    return Response.json(
      { ok: false, error: "invalid_profile" },
      { status: 400 },
    );
  const age =
    new Date().getUTCFullYear() -
    new Date(`${birthDate}T00:00:00Z`).getUTCFullYear();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || age < 18)
    return Response.json(
      { ok: false, error: "adult_required" },
      { status: 400 },
    );
  const db = getDb();
  const now = new Date();
  const id = `usr_${crypto.randomUUID()}`;
  await db
    .insert(users)
    .values({
      id,
      authSubjectId: identity.id,
      email,
      fullName,
      birthDate,
      nickname,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: users.authSubjectId,
      set: { email, fullName, birthDate, nickname },
    });
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  await db
    .insert(wallets)
    .values({
      userId: user.id,
      availableCents: 0,
      heldCents: 0,
      updatedAt: now,
    })
    .onConflictDoNothing();
  await db
    .insert(playerRatings)
    .values({ userId: user.id, seasonKey: "2026-s01", updatedAt: now })
    .onConflictDoNothing();
  return Response.json({
    ok: true,
    user: { id: user.id, nickname: user.nickname, status: user.status },
  });
}
