import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  steamId64: text("steam_id_64").notNull().unique(),
  nickname: text("nickname").notNull(),
  cs2Minutes: integer("cs2_minutes").notNull().default(0),
  level: integer("level").notNull().default(1),
  status: text("status", { enum: ["pending", "verified", "rejected", "suspended", "banned"] }).notNull().default("pending"),
  role: text("role", { enum: ["player", "sub", "streamer", "mod", "admin", "owner"] }).notNull().default("player"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const wallets = sqliteTable("wallets", {
  userId: text("user_id").primaryKey().references(() => users.id),
  availableCents: integer("available_cents").notNull().default(0),
  lockedCents: integer("locked_cents").notNull().default(0),
  debtCents: integer("debt_cents").notNull().default(0),
});

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status", { enum: ["open", "draft", "veto", "live", "review", "settled", "cancelled"] }).notNull().default("open"),
  entryCents: integer("entry_cents").notNull().default(600),
  prizePerWinnerCents: integer("prize_per_winner_cents").notNull().default(1000),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const roomPlayers = sqliteTable("room_players", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => rooms.id),
  userId: text("user_id").notNull().references(() => users.id),
  team: text("team", { enum: ["pool", "a", "b"] }).notNull().default("pool"),
  isCaptain: integer("is_captain", { mode: "boolean" }).notNull().default(false),
  joinedAt: integer("joined_at", { mode: "timestamp" }).notNull(),
}, (table) => [uniqueIndex("idx_room_players_room_user").on(table.roomId, table.userId)]);

export const ledgerEntries = sqliteTable("ledger_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  roomId: text("room_id").references(() => rooms.id),
  type: text("type", { enum: ["deposit", "entry_lock", "entry_release", "fee", "prize", "withdrawal", "penalty", "adjustment"] }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  description: text("description").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const verificationReviews = sqliteTable("verification_reviews", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  reviewerId: text("reviewer_id").references(() => users.id),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  assignedLevel: integer("assigned_level"),
  profilePublic: integer("profile_public", { mode: "boolean" }).notNull().default(false),
  gameDetailsPublic: integer("game_details_public", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [index("idx_verification_reviews_status_created").on(table.status, table.createdAt)]);

export const sanctions = sqliteTable("sanctions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  issuedById: text("issued_by_id").notNull().references(() => users.id),
  type: text("type", { enum: ["warning", "mute", "suspension", "ban", "no_show", "abandonment"] }).notNull(),
  reason: text("reason").notNull(),
  penaltyCents: integer("penalty_cents").notNull().default(0),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [index("idx_sanctions_user_created").on(table.userId, table.createdAt)]);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull().references(() => users.id),
  targetUserId: text("target_user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  beforeJson: text("before_json"),
  afterJson: text("after_json"),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => [index("idx_audit_logs_actor_created").on(table.actorId, table.createdAt)]);
