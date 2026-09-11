import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "../../db";
import { rolePermissions, userPermissions } from "../../db/schema";

export const FINANCIAL_PERMISSIONS = ["payment.review", "payment.destination.manage", "withdrawal.approve", "ledger.read", "ledger.adjust", "reconciliation.run", "reconciliation.close", "audit.read"] as const;
export type FinancialPermission = (typeof FINANCIAL_PERMISSIONS)[number];

const defaults: Record<string, readonly FinancialPermission[]> = {
  owner: FINANCIAL_PERMISSIONS,
  admin: ["payment.review", "ledger.read", "reconciliation.run", "audit.read"],
  mod: ["audit.read"],
};

export async function hasFinancialPermission(user: { id: string; role: string }, permission: FinancialPermission) {
  const db = getDb();
  const overrides = await db.select({ effect: userPermissions.effect }).from(userPermissions)
    .where(and(eq(userPermissions.userId, user.id), eq(userPermissions.permission, permission), isNull(userPermissions.revokedAt))).limit(1);
  if (overrides[0]) return overrides[0].effect === "allow";
  const assigned = await db.select({ permission: rolePermissions.permission }).from(rolePermissions)
    .where(and(eq(rolePermissions.role, user.role), eq(rolePermissions.permission, permission))).limit(1);
  return assigned.length > 0 || (defaults[user.role]?.includes(permission) ?? false);
}
