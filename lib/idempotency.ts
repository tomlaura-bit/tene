const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{16,128}$/;

export function readIdempotencyKey(request: Request) {
  const value = request.headers.get("idempotency-key")?.trim() ?? "";
  return IDEMPOTENCY_KEY.test(value) ? value : null;
}
