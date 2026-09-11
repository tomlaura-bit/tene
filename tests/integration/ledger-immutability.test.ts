import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("double-entry ledger database guarantees", () => {
  let database: DatabaseSync;
  beforeEach(() => {
    database = new DatabaseSync(":memory:");
    for (const file of readdirSync("drizzle").filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort()) {
      const migration = readFileSync(`drizzle/${file}`, "utf8");
      for (const statement of migration.split("--> statement-breakpoint")) if (statement.trim()) database.exec(statement);
    }
    database.exec("PRAGMA foreign_keys = ON");
    const now = Math.floor(Date.now() / 1000);
    database.prepare("INSERT INTO users (id,nickname,cs2_minutes,level,status,role,created_at) VALUES ('u','User',0,1,'verified','player',?)").run(now);
    database.prepare("INSERT INTO ledger_accounts (id,code,name,kind,normal_balance,currency,status,created_at) VALUES (?,?,?,?,?,'PEN','active',?)").run("cash", "cash", "Cash", "asset", "debit", now);
    database.prepare("INSERT INTO ledger_accounts (id,user_id,code,name,kind,normal_balance,currency,status,created_at) VALUES (?,?,?,?,?,?,'PEN','active',?)").run("wallet", "u", "user:u:wallet", "Wallet", "liability", "credit", now);
    database.prepare("INSERT INTO ledger_transactions (id,type,status,currency,description,created_at) VALUES ('tx','deposit','draft','PEN','test',?)").run(now);
  });
  afterEach(() => database.close());

  it("refuses to post an unbalanced transaction", () => {
    database.prepare("INSERT INTO ledger_entries (id,transaction_id,account_id,direction,user_id,type,amount_cents,description,created_at) VALUES ('e1','tx','cash','debit','u','deposit',600,'test',1)").run();
    expect(() => database.prepare("UPDATE ledger_transactions SET status='posted' WHERE id='tx'").run()).toThrow(/requires_two_entries/);
  });

  it("posts balanced entries and makes them immutable", () => {
    database.prepare("INSERT INTO ledger_entries (id,transaction_id,account_id,direction,user_id,type,amount_cents,description,created_at) VALUES ('e1','tx','cash','debit','u','deposit',600,'test',1)").run();
    database.prepare("INSERT INTO ledger_entries (id,transaction_id,account_id,direction,user_id,type,amount_cents,description,created_at) VALUES ('e2','tx','wallet','credit','u','deposit',600,'test',1)").run();
    database.prepare("UPDATE ledger_transactions SET status='posted',posted_at=1 WHERE id='tx'").run();
    expect(() => database.prepare("UPDATE ledger_entries SET amount_cents=601 WHERE id='e1'").run()).toThrow(/immutable/);
    expect(() => database.prepare("DELETE FROM ledger_transactions WHERE id='tx'").run()).toThrow(/immutable/);
  });
});
