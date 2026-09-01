import { describe, expect, it } from "vitest";
import { getAuthenticatedUser, unauthorized } from "../../lib/auth";

describe("getAuthenticatedUser", () => {
  it("extrae y decodifica una identidad autenticada (AAA)", async () => {
    // Arrange
    const request = new Request("https://tene.test", {
      headers: {
        "oai-authenticated-user-id": "user-1",
        "oai-authenticated-user-email": "tom@example.com",
        "oai-authenticated-user-full-name": "Tom%20Laura",
        "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
      },
    });

    // Act
    const identity = getAuthenticatedUser(request);

    // Assert
    expect(identity).toEqual({ id: "user-1", email: "tom@example.com", fullName: "Tom Laura" });
  });

  it("rechaza una solicitud sin identidad completa", async () => {
    // Arrange
    const request = new Request("https://tene.test", { headers: { "oai-authenticated-user-id": "user-1" } });

    // Act
    const identity = getAuthenticatedUser(request);
    const response = unauthorized();

    // Assert
    expect(identity).toBeNull();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false, error: "authentication_required" });
  });
});
