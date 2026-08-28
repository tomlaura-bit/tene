import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { chatMessages, playerRatings, users } from "../../../db/schema";
import { getAuthenticatedUser, unauthorized } from "../../../lib/auth";
import { enforceRateLimit } from "../../../lib/rate-limit";

export const dynamic = "force-dynamic";

const channels = [
  "general",
  "looking_for_room",
  "support",
  "announcements",
] as const;
type Channel = (typeof channels)[number];

function validChannel(value: string | null): value is Channel {
  return channels.includes(value as Channel);
}

export async function GET(request: Request) {
  if (!getAuthenticatedUser(request)) return unauthorized();
  const channel = new URL(request.url).searchParams.get("channel");
  if (!validChannel(channel))
    return Response.json({ ok: false, error: "invalid_channel" }, { status: 400 });

  const db = getDb();
  const rows = await db
    .select({
      id: chatMessages.id,
      body: chatMessages.body,
      createdAt: chatMessages.createdAt,
      name: users.nickname,
      role: users.role,
      avatarUrl: users.steamAvatarUrl,
      level: playerRatings.level,
      elo: playerRatings.elo,
      hours: users.cs2Minutes,
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.userId, users.id))
    .leftJoin(playerRatings, eq(users.id, playerRatings.userId))
    .where(and(eq(chatMessages.channel, channel), isNull(chatMessages.deletedAt)))
    .orderBy(asc(chatMessages.createdAt))
    .limit(100);

  return Response.json({
    ok: true,
    messages: rows.map((row) => ({
      ...row,
      level: row.level ?? 1,
      elo: row.elo ?? 1000,
      hours: Math.floor(row.hours / 60),
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "chat_message", 12, 60);
  if (limited) return limited;
  const identity = getAuthenticatedUser(request);
  if (!identity) return unauthorized();
  const body = (await request.json().catch(() => ({}))) as {
    channel?: string;
    message?: string;
  };
  if (!validChannel(body.channel ?? null))
    return Response.json({ ok: false, error: "invalid_channel" }, { status: 400 });
  const channel = body.channel as Channel;
  const message = body.message?.trim() ?? "";
  if (!message || message.length > 240)
    return Response.json({ ok: false, error: "invalid_message" }, { status: 400 });

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.authSubjectId, identity.id))
    .limit(1);
  if (!user)
    return Response.json({ ok: false, error: "account_required" }, { status: 403 });
  if (channel === "announcements" && !["owner", "admin", "mod"].includes(user.role))
    return Response.json({ ok: false, error: "staff_required" }, { status: 403 });

  const id = `chat_${crypto.randomUUID()}`;
  const createdAt = new Date();
  await db.insert(chatMessages).values({
    id,
    userId: user.id,
    channel,
    body: message,
    createdAt,
  });
  return Response.json({ ok: true, id, createdAt: createdAt.toISOString() }, { status: 201 });
}
