import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("operational database guards", () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = new DatabaseSync(":memory:");
    database.exec(`
      CREATE TABLE users (id TEXT PRIMARY KEY);
      CREATE TABLE wallets (user_id TEXT PRIMARY KEY, available_cents INTEGER NOT NULL, locked_cents INTEGER NOT NULL, debt_cents INTEGER NOT NULL);
      CREATE TABLE rooms (id TEXT PRIMARY KEY, entry_cents INTEGER NOT NULL, prize_per_winner_cents INTEGER NOT NULL);
      CREATE TABLE room_players (id TEXT PRIMARY KEY, slot_number INTEGER);
      CREATE TABLE player_ratings (user_id TEXT PRIMARY KEY, level INTEGER NOT NULL, elo INTEGER NOT NULL, matches INTEGER NOT NULL, wins INTEGER NOT NULL, losses INTEGER NOT NULL);
      CREATE TABLE payment_requests (id TEXT PRIMARY KEY, amount_cents INTEGER NOT NULL, status TEXT NOT NULL);
    `);
    const migration = readFileSync("drizzle/0025_chubby_sleepwalker.sql", "utf8");
    for (const statement of migration.split("--> statement-breakpoint")) {
      if (statement.trim()) database.exec(statement);
    }
  });

  afterEach(() => database.close());

  it("rejects negative wallet balances", () => {
    expect(() =>
      database
        .prepare("INSERT INTO wallets VALUES (?, ?, ?, ?)")
        .run("usr_1", -1, 0, 0),
    ).toThrow(/wallet_balance_out_of_range/);
  });

  it("rejects room slots outside 1 through 10", () => {
    expect(() =>
      database.prepare("INSERT INTO room_players VALUES (?, ?)").run("rp_1", 11),
    ).toThrow(/room_slot_out_of_range/);
  });

  it("prevents a terminal payment from being processed twice", () => {
    database.prepare("INSERT INTO payment_requests VALUES (?, ?, ?)").run("pay_1", 600, "pending");
    database.prepare("UPDATE payment_requests SET status = 'approved' WHERE id = ?").run("pay_1");
    expect(() =>
      database.prepare("UPDATE payment_requests SET status = 'rejected' WHERE id = ?").run("pay_1"),
    ).toThrow(/payment_already_terminal/);
  });
});
