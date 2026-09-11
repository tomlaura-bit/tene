export type LedgerDirection = "debit" | "credit";

export type LedgerPosting = {
  accountCode: string;
  accountName: string;
  accountKind: "asset" | "liability" | "revenue" | "expense" | "equity";
  normalBalance: LedgerDirection;
  direction: LedgerDirection;
  amountCents: number;
};

export function assertBalanced(postings: LedgerPosting[]) {
  if (postings.length < 2) throw new Error("ledger_transaction_requires_two_entries");
  let balance = 0;
  for (const posting of postings) {
    if (!Number.isSafeInteger(posting.amountCents) || posting.amountCents <= 0)
      throw new Error("ledger_entry_invalid");
    balance += posting.direction === "debit" ? posting.amountCents : -posting.amountCents;
  }
  if (balance !== 0) throw new Error("ledger_transaction_unbalanced");
}

export function reversePostings(postings: LedgerPosting[]): LedgerPosting[] {
  assertBalanced(postings);
  return postings.map((posting) => ({
    ...posting,
    direction: posting.direction === "debit" ? "credit" : "debit",
  }));
}
