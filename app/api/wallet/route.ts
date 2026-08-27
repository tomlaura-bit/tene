import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import {
  ledgerEntries,
  paymentRequests,
  roomPlayers,
  rooms,
  users,
  wallets,
} from "../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../lib/auth";

export const dynamic = "force-dynamic";

async function getUser(request: Request) {
  const identity = getAuthenticatedUser(request);
  if (!identity) return null;
  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  return user ?? null;
}

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return unauthorized();
  const db = getDb();
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, user.id))
    .limit(1);
  const entries = await db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, user.id))
    .orderBy(desc(ledgerEntries.createdAt))
    .limit(30);
  const requests = await db
    .select()
    .from(paymentRequests)
    .where(eq(paymentRequests.userId, user.id))
    .orderBy(desc(paymentRequests.requestedAt))
    .limit(20);
  return Response.json({ ok: true, wallet: wallet ?? null, entries, requests });
}

export async function POST(request: Request) {
  const user = await getUser(request);
  if (!user) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as {
    type?: "deposit" | "withdrawal";
    method?: "yape" | "plin";
    amountCents?: number;
    operationCode?: string;
  };
  const amountCents = Math.round(Number(body.amountCents));
  if (
    !["deposit", "withdrawal"].includes(body.type ?? "") ||
    !["yape", "plin"].includes(body.method ?? "") ||
    !Number.isInteger(amountCents) ||
    amountCents < 600 ||
    amountCents > 100000
  )
    return Response.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  if (body.type === "withdrawal" && amountCents < 1000)
    return Response.json(
      { ok: false, error: "withdrawal_minimum" },
      { status: 400 },
    );
  const operationCode = body.operationCode?.trim() || null;
  if (body.type === "deposit" && (!operationCode || operationCode.length < 4))
    return Response.json(
      { ok: false, error: "operation_code_required" },
      { status: 400 },
    );

  const db = getDb();
  if (body.type === "withdrawal") {
    const played = await db
      .select({ id: roomPlayers.id })
      .from(roomPlayers)
      .innerJoin(rooms, eq(roomPlayers.roomId, rooms.id))
      .where(and(eq(roomPlayers.userId, user.id), eq(rooms.status, "settled")))
      .limit(1);
    if (!played.length)
      return Response.json(
        { ok: false, error: "one_room_required" },
        { status: 403 },
      );
    const locked = await db
      .update(wallets)
      .set({
        availableCents: sql`${wallets.availableCents} - ${amountCents}`,
        lockedCents: sql`${wallets.lockedCents} + ${amountCents}`,
      })
      .where(
        and(
          eq(wallets.userId, user.id),
          gte(wallets.availableCents, amountCents),
        ),
      )
      .returning({
        availableCents: wallets.availableCents,
        lockedCents: wallets.lockedCents,
      });
    if (!locked.length)
      return Response.json(
        { ok: false, error: "insufficient_balance" },
        { status: 402 },
      );
  }

  try {
    await db.insert(paymentRequests).values({
      id: `pay_${crypto.randomUUID()}`,
      userId: user.id,
      type: body.type!,
      method: body.method!,
      amountCents,
      operationCode,
      status: "pending",
      requestedAt: new Date(),
    });
  } catch {
    if (body.type === "withdrawal") {
      await db
        .update(wallets)
        .set({
          availableCents: sql`${wallets.availableCents} + ${amountCents}`,
          lockedCents: sql`${wallets.lockedCents} - ${amountCents}`,
        })
        .where(eq(wallets.userId, user.id));
    }
    return Response.json(
      { ok: false, error: "duplicate_operation" },
      { status: 409 },
    );
  }

  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, user.id))
    .limit(1);
  return Response.json({ ok: true, wallet });
}
