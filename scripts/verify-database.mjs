import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";

const database = new DatabaseSync(":memory:");
const migrationsDirectory = join(process.cwd(), "drizzle");
const migrations = readdirSync(migrationsDirectory)
  .filter((file) => /^\d{4}_.+\.sql$/.test(file))
  .sort();

if (!migrations.length) throw new Error("No database migrations were found");

try {
  for (const file of migrations) {
    const source = readFileSync(join(migrationsDirectory, file), "utf8");
    for (const statement of source.split("--> statement-breakpoint")) {
      if (statement.trim()) database.exec(statement);
    }
  }

  database.exec("PRAGMA foreign_keys = ON");
  const integrity = database.prepare("PRAGMA integrity_check").get();
  if (integrity.integrity_check !== "ok") {
    throw new Error(`SQLite integrity check failed: ${integrity.integrity_check}`);
  }

  const foreignKeyErrors = database.prepare("PRAGMA foreign_key_check").all();
  if (foreignKeyErrors.length) {
    throw new Error(`Foreign-key check found ${foreignKeyErrors.length} error(s)`);
  }

  const requiredTables = [
    "users",
    "wallets",
    "rooms",
    "room_players",
    "ledger_entries",
    "payment_requests",
    "idempotency_keys",
    "privacy_requests",
    "audit_logs",
  ];
  const tables = new Set(
    database
      .prepare("SELECT name FROM sqlite_schema WHERE type = 'table'")
      .all()
      .map((row) => row.name),
  );
  const missing = requiredTables.filter((table) => !tables.has(table));
  if (missing.length) throw new Error(`Missing required tables: ${missing.join(", ")}`);

  const triggerCount = Number(
    database
      .prepare("SELECT COUNT(*) AS count FROM sqlite_schema WHERE type = 'trigger'")
      .get().count,
  );
  if (triggerCount < 10) {
    throw new Error(`Expected at least 10 integrity triggers, found ${triggerCount}`);
  }

  const now = Math.floor(Date.now() / 1000);
  database
    .prepare(
      "INSERT INTO users (id, nickname, cs2_minutes, level, status, role, created_at) VALUES (?, ?, 0, 1, 'verified', 'player', ?)",
    )
    .run("docker_user", "Docker Tester", now);
  database
    .prepare(
      "INSERT INTO wallets (user_id, available_cents, locked_cents, debt_cents) VALUES (?, 1000, 0, 0)",
    )
    .run("docker_user");

  let rejectedNegativeBalance = false;
  try {
    database
      .prepare("UPDATE wallets SET available_cents = -1 WHERE user_id = ?")
      .run("docker_user");
  } catch (error) {
    rejectedNegativeBalance = String(error).includes("wallet_balance_out_of_range");
  }
  if (!rejectedNegativeBalance) {
    throw new Error("The database accepted a negative wallet balance");
  }

  const indexes = Number(
    database
      .prepare("SELECT COUNT(*) AS count FROM sqlite_schema WHERE type = 'index' AND sql IS NOT NULL")
      .get().count,
  );
  database.exec("PRAGMA optimize");
  console.log(
    JSON.stringify(
      {
        ok: true,
        engine: "SQLite",
        migrationsApplied: migrations.length,
        tables: tables.size,
        indexes,
        triggers: triggerCount,
        integrity: "ok",
        foreignKeys: "ok",
        negativeWalletGuard: "ok",
      },
      null,
      2,
    ),
  );
} finally {
  database.close();
}
