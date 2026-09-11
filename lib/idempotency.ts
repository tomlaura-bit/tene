const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{16,128}$/;

export function readIdempotencyKey(request: Request) {
  const value = request.headers.get("idempotency-key")?.trim() ?? "";
  return IDEMPOTENCY_KEY.test(value) ? value : null;
}

export async function hashIdempotentRequest(value: unknown) {
  const normalized = stableJson(value);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
