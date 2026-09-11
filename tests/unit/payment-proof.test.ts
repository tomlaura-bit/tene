import { describe, expect, it } from "vitest";
import { matchesImageSignature } from "../../lib/payment-proof";

function bytes(...values: number[]) {
  return new Uint8Array(values).buffer;
}

describe("payment proof file signatures", () => {
  it("accepts real PNG, JPEG and WebP headers", () => {
    expect(matchesImageSignature(bytes(137,80,78,71,13,10,26,10), "image/png")).toBe(true);
    expect(matchesImageSignature(bytes(255,216,255,224), "image/jpeg")).toBe(true);
    expect(matchesImageSignature(bytes(82,73,70,70,0,0,0,0,87,69,66,80), "image/webp")).toBe(true);
  });

  it("rejects executable or mismatched content despite an image MIME", () => {
    expect(matchesImageSignature(bytes(77,90,144,0), "image/png")).toBe(false);
    expect(matchesImageSignature(bytes(137,80,78,71,13,10,26,10), "image/jpeg")).toBe(false);
  });
});
