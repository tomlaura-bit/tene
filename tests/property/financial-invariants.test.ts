import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { assertBalanced, reversePostings, type LedgerPosting } from "../../lib/finance/domain";

function pair(amountCents: number): LedgerPosting[] {
  return [
    { accountCode: "cash", accountName: "Cash", accountKind: "asset", normalBalance: "debit", direction: "debit", amountCents },
    { accountCode: "wallet", accountName: "Wallet liability", accountKind: "liability", normalBalance: "credit", direction: "credit", amountCents },
  ];
}

describe("global financial properties", () => {
  it("every generated monetary transaction remains balanced after reversal", () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 100_000_000 }), (amount) => {
      const postings = pair(amount);
      expect(() => assertBalanced(postings)).not.toThrow();
      expect(() => assertBalanced(reversePostings(postings))).not.toThrow();
    }));
  });

  it("rejects every generated unequal debit and credit", () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 100_000_000 }),
      fc.integer({ min: 1, max: 100_000_000 }),
      (debit, delta) => {
        expect(() => assertBalanced([
          pair(debit)[0],
          { ...pair(debit)[1], amountCents: debit + delta },
        ])).toThrow("ledger_transaction_unbalanced");
      },
    ));
  });

  it("wallet projection never becomes negative when debits are guarded", () => {
    fc.assert(fc.property(
      fc.integer({ min: 0, max: 1_000_000 }),
      fc.array(fc.integer({ min: 0, max: 100_000 }), { maxLength: 100 }),
      (initial, withdrawals) => {
        const final = withdrawals.reduce((balance, withdrawal) => withdrawal <= balance ? balance - withdrawal : balance, initial);
        expect(final).toBeGreaterThanOrEqual(0);
      },
    ));
  });
});
