import { describe, expect, it } from "vitest";
import { claimRoomSlot } from "../../lib/room-reservation";
import { asD1, createReservationDatabase } from "../helpers/sqlite-d1";

describe("concurrencia de salas", () => {
  it("acepta exactamente diez de veinticinco intentos competidores", async () => {
    // Arrange
    const database = createReservationDatabase();
    const d1 = asD1(database);

    // Act
    const results = await Promise.all(Array.from({ length: 25 }, (_, index) => claimRoomSlot(d1, {
      id: `rp-${index}`,
      roomId: "room-final",
      userId: `user-${index}`,
      joinedAt: index,
    })));

    // Assert
    expect(results.filter((slot) => slot !== null)).toHaveLength(10);
    expect(new Set(results.filter((slot) => slot !== null)).size).toBe(10);
    expect(database.prepare("SELECT COUNT(*) AS total FROM room_players").get()).toEqual({ total: 10 });
    database.close();
  });

  it("un usuario solo puede obtener un slot y por tanto un único cobro", async () => {
    // Arrange
    const database = createReservationDatabase();
    const d1 = asD1(database);
    let availableCents = 1200;
    let lockedCents = 0;

    // Act
    const attempts = await Promise.all(Array.from({ length: 12 }, (_, index) => claimRoomSlot(d1, {
      id: `duplicate-${index}`,
      roomId: "room-final",
      userId: "same-user",
      joinedAt: index,
    })));
    for (const slot of attempts) if (slot !== null) {
      availableCents -= 600;
      lockedCents += 600;
    }

    // Assert
    expect(attempts.filter((slot) => slot !== null)).toHaveLength(1);
    expect({ availableCents, lockedCents }).toEqual({ availableCents: 600, lockedCents: 600 });
    database.close();
  });
});
