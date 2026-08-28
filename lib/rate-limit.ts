import { env } from "cloudflare:workers";

type RuntimeEnv = { DB: D1Database };

function clientKey(request: Request) {
  const identity = request.headers.get("oai-authenticated-user-id")?.trim();
  const ip = request.headers.get("cf-connecting-ip")?.trim();
  return identity ? `user:${identity}` : `ip:${ip ?? "unknown"}`;
}

export async function enforceRateLimit(request: Request, bucket: string, limit: number, windowSeconds: number) {
  const runtime = env as unknown as RuntimeEnv;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const key = `${bucket}:${clientKey(request)}:${windowStart}`;
  await runtime.DB.prepare(
    "INSERT INTO rate_limits (key, count, window_started_at, expires_at) VALUES (?1, 1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET count = count + 1",
  ).bind(key, windowStart, windowStart + windowSeconds * 2).run();
  const row = await runtime.DB.prepare("SELECT count FROM rate_limits WHERE key = ?1").bind(key).first<{ count: number }>();
  if ((row?.count ?? 0) > limit) {
    const retryAfter = windowStart + windowSeconds - now;
    return Response.json({ ok: false, error: "rate_limit_exceeded", retryAfter }, { status: 429, headers: { "retry-after": String(retryAfter) } });
  }
  return null;
}
