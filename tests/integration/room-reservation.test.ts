import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { claimRoomSlot, releaseRoomSlot } from "../../lib/room-reservation";
import { asD1, createReservationDatabase } from "../helpers/sqlite-d1";

describe("integración de reservas con SQLite/D1", () => {
  it("reserva y libera un slot usando el SQL de producción", async () => {
    // Arrange
    const database = createReservationDatabase();
    const d1 = asD1(database);

    // Act
    const slot = await claimRoomSlot(d1, { id: "rp-1", roomId: "room-1", userId: "user-1", joinedAt: 1 });
    await releaseRoomSlot(d1, "rp-1");

    // Assert
    expect(slot).toBe(1);
    expect(database.prepare("SELECT COUNT(*) AS total FROM room_players").get()).toEqual({ total: 0 });
    database.close();
  });

  it("la migración asigna slots a jugadores existentes antes de crear el índice", () => {
    // Arrange
    const database = new DatabaseSync(":memory:");
    database.exec(`CREATE TABLE room_players (id TEXT PRIMARY KEY, room_id TEXT NOT NULL, user_id TEXT NOT NULL, team TEXT NOT NULL, is_captain INTEGER NOT NULL, joined_at INTEGER NOT NULL);`);
    database.exec(`INSERT INTO room_players VALUES ('b','room-1','u2','pool',0,2),('a','room-1','u1','pool',0,1),('c','room-2','u3','pool',0,1);`);
    const migration = readFileSync(new URL("../../drizzle/0024_sticky_umar.sql", import.meta.url), "utf8");

    // Act
    for (const statement of migration.split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean)) database.exec(statement);

    // Assert
    expect(database.prepare("SELECT id, slot_number FROM room_players ORDER BY room_id, slot_number").all()).toEqual([
      { id: "a", slot_number: 1 },
      { id: "b", slot_number: 2 },
      { id: "c", slot_number: 1 },
    ]);
    database.close();
  });
});
