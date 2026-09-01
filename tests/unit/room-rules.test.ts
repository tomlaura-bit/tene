import { describe, expect, it } from "vitest";
import { ROOM_CAPACITY, roomProgress } from "../../lib/room-reservation";

describe("reglas de capacidad de sala", () => {
  it.each([
    [-2, 0],
    [0, 0],
    [1, 10],
    [5, 50],
    [10, 100],
    [11, 100],
  ])("limita el progreso de %i jugadores a %i%%", (players, expected) => {
    // Arrange + Act
    const progress = roomProgress(players);

    // Assert
    expect(progress).toBe(expected);
    expect(ROOM_CAPACITY).toBe(10);
  });
});
