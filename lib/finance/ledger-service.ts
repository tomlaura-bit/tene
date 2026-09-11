import { getD1 } from "../../db";
import { assertBalanced, reversePostings, type LedgerPosting } from "./domain";

export type PostLedgerTransaction = {
  id?: string;
  externalRef?: string | null;
  reversalOfId?: string | null;
  type: string;
  description: string;
  userId: string;
  roomId?: string | null;
  legacyType: "deposit" | "entry_lock" | "entry_release" | "fee" | "prize" | "withdrawal" | "penalty" | "adjustment";
  postings: LedgerPosting[];
};

export class LedgerService {
  async post(command: PostLedgerTransaction) {
    assertBalanced(command.postings);
    const d1 = getD1();
    const transactionId = command.id ?? `ltx_${crypto.randomUUID()}`;
    const now = Math.floor(Date.now() / 1000);
    const statements: D1PreparedStatement[] = [];
    for (const posting of command.postings) {
      const accountId = `lac_${await sha256(posting.accountCode)}`;
      statements.push(d1.prepare(`INSERT OR IGNORE INTO ledger_accounts
        (id, user_id, code, name, kind, normal_balance, currency, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'PEN', 'active', ?)`)
        .bind(accountId, posting.accountCode.startsWith("user:") ? command.userId : null, posting.accountCode, posting.accountName, posting.accountKind, posting.normalBalance, now));
    }
    statements.push(d1.prepare(`INSERT INTO ledger_transactions
      (id, external_ref, type, status, currency, description, reversal_of_id, created_at)
      VALUES (?, ?, ?, 'draft', 'PEN', ?, ?, ?)`)
      .bind(transactionId, command.externalRef ?? null, command.type, command.description, command.reversalOfId ?? null, now));
    for (const posting of command.postings) {
      statements.push(d1.prepare(`INSERT INTO ledger_entries
        (id, transaction_id, account_id, direction, user_id, room_id, type, amount_cents, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(`len_${crypto.randomUUID()}`, transactionId, `lac_${await sha256(posting.accountCode)}`, posting.direction, command.userId, command.roomId ?? null, command.legacyType, posting.amountCents, command.description, now));
    }
    statements.push(d1.prepare("UPDATE ledger_transactions SET status = 'posted', posted_at = ? WHERE id = ? AND status = 'draft'").bind(now, transactionId));
    await d1.batch(statements);
    return transactionId;
  }

  async reverse(transactionId: string, actorUserId: string, reason: string) {
    const d1 = getD1();
    const transaction = await d1.prepare("SELECT * FROM ledger_transactions WHERE id = ? AND status = 'posted'").bind(transactionId).first<Record<string, unknown>>();
    if (!transaction) throw new Error("ledger_transaction_not_reversible");
    const rows = await d1.prepare(`SELECT le.*, la.code, la.name, la.kind, la.normal_balance
      FROM ledger_entries le JOIN ledger_accounts la ON la.id = le.account_id WHERE le.transaction_id = ?`).bind(transactionId).all<Record<string, unknown>>();
    const postings = reversePostings(rows.results.map((row) => ({
      accountCode: String(row.code), accountName: String(row.name), accountKind: String(row.kind) as LedgerPosting["accountKind"],
      normalBalance: String(row.normal_balance) as LedgerPosting["normalBalance"], direction: String(row.direction) as LedgerPosting["direction"], amountCents: Number(row.amount_cents),
    })));
    const reversalId = `ltx_${crypto.randomUUID()}`;
    await this.post({ id: reversalId, externalRef: `reversal:${transactionId}`, reversalOfId: transactionId, type: "reversal", description: reason, userId: actorUserId, legacyType: "adjustment", postings });
    await d1.prepare("UPDATE ledger_transactions SET status = 'reversed' WHERE id = ? AND status = 'posted'").bind(transactionId).run();
    return reversalId;
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
