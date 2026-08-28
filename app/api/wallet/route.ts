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
import { env } from "cloudflare:workers";
import { enforceRateLimit } from "../../../lib/rate-limit";

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
  const limited = await enforceRateLimit(request, "wallet_request", 5, 600);
  if (limited) return limited;
  const contentType = request.headers.get("content-type") ?? "";
  const form = contentType.includes("multipart/form-data") ? await request.formData() : null;
  const json = form ? null : await request.json().catch(() => ({}));
  const body = (form ? {
    type: form.get("type"), method: form.get("method"), amountCents: form.get("amountCents"), operationCode: form.get("operationCode"), destinationName: form.get("destinationName"), destinationPhone: form.get("destinationPhone"), paymentDate: form.get("paymentDate"), paymentTime: form.get("paymentTime"), payerName: form.get("payerName"),
  } : json) as {
    type?: "deposit" | "withdrawal";
    method?: "yape" | "plin";
    amountCents?: number | string;
    operationCode?: string | FormDataEntryValue | null;
    destinationName?: string | FormDataEntryValue | null;
    destinationPhone?: string | FormDataEntryValue | null;
    paymentDate?: string | FormDataEntryValue | null;
    paymentTime?: string | FormDataEntryValue | null;
    payerName?: string | FormDataEntryValue | null;
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
  const operationCode = typeof body.operationCode === "string" ? body.operationCode.trim() || null : null;
  const destinationName = typeof body.destinationName === "string" ? body.destinationName.trim() : "";
  const destinationPhone = typeof body.destinationPhone === "string" ? body.destinationPhone.replace(/\D/g, "") : "";
  const paymentDate = typeof body.paymentDate === "string" ? body.paymentDate.trim() : "";
  const paymentTime = typeof body.paymentTime === "string" ? body.paymentTime.trim() : "";
  const payerName = typeof body.payerName === "string" ? body.payerName.trim().slice(0, 100) : "";
  if (body.type === "deposit" && (!operationCode || operationCode.length < 4))
    return Response.json(
      { ok: false, error: "operation_code_required" },
      { status: 400 },
    );
  if (body.type === "deposit" && (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) || !/^\d{2}:\d{2}$/.test(paymentTime)))
    return Response.json({ ok: false, error: "payment_datetime_required" }, { status: 400 });
  if (body.type === "withdrawal" && (destinationName.length < 3 || !/^9\d{8}$/.test(destinationPhone)))
    return Response.json({ ok: false, error: "withdrawal_destination_required" }, { status: 400 });

  const proof = form?.get("proof");
  if (body.type === "deposit") {
    if (!(proof instanceof File)) return Response.json({ ok: false, error: "proof_required" }, { status: 400 });
    if (!["image/jpeg", "image/png", "image/webp"].includes(proof.type) || proof.size < 1 || proof.size > 5 * 1024 * 1024)
      return Response.json({ ok: false, error: "invalid_proof" }, { status: 400 });
  }

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

  const paymentId = `pay_${crypto.randomUUID()}`;
  let proofKey: string | null = null;
  if (proof instanceof File) {
    const extension = proof.type === "image/png" ? "png" : proof.type === "image/webp" ? "webp" : "jpg";
    proofKey = `payment-proofs/${user.id}/${paymentId}.${extension}`;
    await env.UPLOADS.put(proofKey, await proof.arrayBuffer(), { httpMetadata: { contentType: proof.type }, customMetadata: { paymentId, userId: user.id } });
  }
  try {
    await db.insert(paymentRequests).values({
      id: paymentId,
      userId: user.id,
      type: body.type!,
      method: body.method!,
      amountCents,
      operationCode,
      destinationName: body.type === "withdrawal" ? destinationName : null,
      destinationPhone: body.type === "withdrawal" ? destinationPhone : null,
      paymentDate: body.type === "deposit" ? paymentDate : null,
      paymentTime: body.type === "deposit" ? paymentTime : null,
      payerName: body.type === "deposit" ? payerName || null : null,
      proofUrl: proofKey,
      status: "pending",
      requestedAt: new Date(),
    });
  } catch {
    if (proofKey) await env.UPLOADS.delete(proofKey);
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
