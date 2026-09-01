import { DatabaseSync } from "node:sqlite";

export function createReservationDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE room_players (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      team TEXT NOT NULL DEFAULT 'pool',
      is_captain INTEGER NOT NULL DEFAULT 0,
      slot_number INTEGER,
      joined_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX idx_room_players_room_user ON room_players(room_id, user_id);
    CREATE UNIQUE INDEX idx_room_players_room_slot ON room_players(room_id, slot_number);
  `);
  return database;
}

export function asD1(database: DatabaseSync) {
  return {
    prepare(sql: string) {
      let bindings: unknown[] = [];
      return {
        bind(...values: unknown[]) {
          bindings = values;
          return this;
        },
        async first<T>() {
          return (database.prepare(sql).get(...bindings) as T | undefined) ?? null;
        },
        async run() {
          const result = database.prepare(sql).run(...bindings);
          return { success: true, meta: { changes: Number(result.changes) } };
        },
      };
    },
  } as unknown as D1Database;
}
