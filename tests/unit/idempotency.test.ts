import { describe, expect, it } from "vitest";
import { readIdempotencyKey } from "../../lib/idempotency";

describe("idempotency keys", () => {
  it("accepts a strong client-generated key", () => {
    const request = new Request("https://tene.example/api/wallet", {
      headers: { "idempotency-key": "550e8400-e29b-41d4-a716-446655440000" },
    });
    expect(readIdempotencyKey(request)).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("rejects short or unsafe keys", () => {
    const request = new Request("https://tene.example/api/wallet", {
      headers: { "idempotency-key": "same" },
    });
    expect(readIdempotencyKey(request)).toBeNull();
  });
});
