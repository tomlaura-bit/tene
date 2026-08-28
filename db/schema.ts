import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  authSubjectId: text("auth_subject_id").unique(),
  email: text("email").unique(),
  fullName: text("full_name"),
  birthDate: text("birth_date"),
  steamId64: text("steam_id_64").unique(),
  steamPersonaName: text("steam_persona_name"),
  steamAvatarUrl: text("steam_avatar_url"),
  steamLinkedAt: integer("steam_linked_at", { mode: "timestamp" }),
  nickname: text("nickname").notNull(),
  cs2Minutes: integer("cs2_minutes").notNull().default(0),
  level: integer("level").notNull().default(1),
  status: text("status", {
    enum: ["pending", "verified", "rejected", "suspended", "banned"],
  })
    .notNull()
    .default("pending"),
  role: text("role", {
    enum: ["player", "sub", "streamer", "mod", "admin", "owner"],
  })
    .notNull()
    .default("player"),
  legalVersion: text("legal_version"),
  termsAcceptedAt: integer("terms_accepted_at", { mode: "timestamp" }),
  privacyAcceptedAt: integer("privacy_accepted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    windowStartedAt: integer("window_started_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [index("idx_rate_limits_expires").on(table.expiresAt)],
);

export const accountRegistrations = sqliteTable("account_registrations", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  nickname: text("nickname").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  birthDate: text("birth_date").notNull(),
  status: text("status", {
    enum: [
      "email_pending",
      "steam_pending",
      "review_pending",
      "active",
      "blocked",
    ],
  })
    .notNull()
    .default("email_pending"),
  emailVerifiedAt: integer("email_verified_at", { mode: "timestamp" }),
  linkedUserId: text("linked_user_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const birthdayRewards = sqliteTable(
  "birthday_rewards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    year: integer("year").notNull(),
    freeRoomsGranted: integer("free_rooms_granted").notNull().default(2),
    freeRoomsUsed: integer("free_rooms_used").notNull().default(0),
    grantedAt: integer("granted_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("idx_birthday_rewards_user_year").on(table.userId, table.year),
  ],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    plan: text("plan", { enum: ["sub"] })
      .notNull()
      .default("sub"),
    priceCents: integer("price_cents").notNull().default(2000),
    status: text("status", {
      enum: ["pending", "active", "expired", "cancelled"],
    })
      .notNull()
      .default("pending"),
    startsAt: integer("starts_at", { mode: "timestamp" }),
    endsAt: integer("ends_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_subscriptions_user_status").on(table.userId, table.status),
  ],
);

export const benefitPasses = sqliteTable(
  "benefit_passes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    source: text("source", {
      enum: ["daily_sub", "birthday", "promotion"],
    }).notNull(),
    valueCents: integer("value_cents").notNull().default(600),
    status: text("status", {
      enum: ["available", "reserved", "used", "expired"],
    })
      .notNull()
      .default("available"),
    validOn: text("valid_on"),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    roomId: text("room_id").references(() => rooms.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_benefit_passes_user_status").on(table.userId, table.status),
  ],
);

export const wallets = sqliteTable("wallets", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  availableCents: integer("available_cents").notNull().default(0),
  lockedCents: integer("locked_cents").notNull().default(0),
  debtCents: integer("debt_cents").notNull().default(0),
});

export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey(),
  createdById: text("created_by_id").references(() => users.id),
  name: text("name").notNull(),
  status: text("status", {
    enum: ["open", "draft", "veto", "live", "review", "settled", "cancelled"],
  })
    .notNull()
    .default("open"),
  entryCents: integer("entry_cents").notNull().default(600),
  prizePerWinnerCents: integer("prize_per_winner_cents")
    .notNull()
    .default(1000),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const roomPlayers = sqliteTable(
  "room_players",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    team: text("team", { enum: ["pool", "a", "b"] })
      .notNull()
      .default("pool"),
    isCaptain: integer("is_captain", { mode: "boolean" })
      .notNull()
      .default(false),
    joinedAt: integer("joined_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("idx_room_players_room_user").on(table.roomId, table.userId),
  ],
);

export const ledgerEntries = sqliteTable("ledger_entries", {
  id: text("id").primaryKey(),
  paymentRequestId: text("payment_request_id").unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  roomId: text("room_id").references(() => rooms.id),
  type: text("type", {
    enum: [
      "deposit",
      "entry_lock",
      "entry_release",
      "fee",
      "prize",
      "withdrawal",
      "penalty",
      "adjustment",
    ],
  }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  description: text("description").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const verificationReviews = sqliteTable(
  "verification_reviews",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    reviewerId: text("reviewer_id").references(() => users.id),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    assignedLevel: integer("assigned_level"),
    profilePublic: integer("profile_public", { mode: "boolean" })
      .notNull()
      .default(false),
    gameDetailsPublic: integer("game_details_public", { mode: "boolean" })
      .notNull()
      .default(false),
    notes: text("notes"),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_verification_reviews_status_created").on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const sanctions = sqliteTable(
  "sanctions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    issuedById: text("issued_by_id")
      .notNull()
      .references(() => users.id),
    type: text("type", {
      enum: ["warning", "mute", "suspension", "ban", "no_show", "abandonment"],
    }).notNull(),
    reason: text("reason").notNull(),
    penaltyCents: integer("penalty_cents").notNull().default(0),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_sanctions_user_created").on(table.userId, table.createdAt),
  ],
);

export const sanctionAppeals = sqliteTable(
  "sanction_appeals",
  {
    id: text("id").primaryKey(),
    sanctionId: text("sanction_id")
      .notNull()
      .references(() => sanctions.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    reviewedById: text("reviewed_by_id").references(() => users.id),
    reason: text("reason").notNull(),
    status: text("status", { enum: ["pending", "accepted", "rejected"] })
      .notNull()
      .default("pending"),
    resolution: text("resolution"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_sanction_appeals_status_created").on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id),
    targetUserId: text("target_user_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    beforeJson: text("before_json"),
    afterJson: text("after_json"),
    reason: text("reason"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_audit_logs_actor_created").on(table.actorId, table.createdAt),
  ],
);

export const roleAssignments = sqliteTable(
  "role_assignments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    assignedById: text("assigned_by_id")
      .notNull()
      .references(() => users.id),
    role: text("role", {
      enum: ["player", "sub", "streamer", "mod", "admin", "owner"],
    }).notNull(),
    previousRole: text("previous_role"),
    reason: text("reason").notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_role_assignments_user_created").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const paymentRequests = sqliteTable(
  "payment_requests",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    reviewedById: text("reviewed_by_id").references(() => users.id),
    type: text("type", { enum: ["deposit", "withdrawal"] }).notNull(),
    method: text("method", { enum: ["yape", "plin"] }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    operationCode: text("operation_code"),
    destinationName: text("destination_name"),
    destinationPhone: text("destination_phone"),
    status: text("status", {
      enum: ["pending", "approved", "rejected", "paid", "cancelled"],
    })
      .notNull()
      .default("pending"),
    proofUrl: text("proof_url"),
    reviewNotes: text("review_notes"),
    requestedAt: integer("requested_at", { mode: "timestamp" }).notNull(),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_payment_requests_status_requested").on(
      table.status,
      table.requestedAt,
    ),
    uniqueIndex("idx_payment_requests_operation_code").on(table.operationCode),
  ],
);

export const reconciliations = sqliteTable("reconciliations", {
  id: text("id").primaryKey(),
  dateKey: text("date_key").notNull().unique(),
  expectedCents: integer("expected_cents").notNull().default(0),
  actualCents: integer("actual_cents").notNull().default(0),
  differenceCents: integer("difference_cents").notNull().default(0),
  status: text("status", { enum: ["open", "matched", "review"] })
    .notNull()
    .default("open"),
  closedById: text("closed_by_id").references(() => users.id),
  closedAt: integer("closed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const steamProfileChecks = sqliteTable(
  "steam_profile_checks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    steamId64: text("steam_id_64").notNull(),
    profilePublic: integer("profile_public", { mode: "boolean" })
      .notNull()
      .default(false),
    gameDetailsPublic: integer("game_details_public", { mode: "boolean" })
      .notNull()
      .default(false),
    ownsCs2: integer("owns_cs2", { mode: "boolean" }).notNull().default(false),
    cs2Minutes: integer("cs2_minutes").notNull().default(0),
    eligible: integer("eligible", { mode: "boolean" }).notNull().default(false),
    rawSnapshotJson: text("raw_snapshot_json"),
    checkedAt: integer("checked_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_steam_profile_checks_user_checked").on(
      table.userId,
      table.checkedAt,
    ),
  ],
);

export const matchServers = sqliteTable(
  "match_servers",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id),
    provider: text("provider").notNull().default("matchzy"),
    region: text("region").notNull().default("lima"),
    addressEncrypted: text("address_encrypted"),
    passwordEncrypted: text("password_encrypted"),
    map: text("map"),
    status: text("status", {
      enum: ["provisioning", "ready", "live", "finished", "failed"],
    })
      .notNull()
      .default("provisioning"),
    teamAScore: integer("team_a_score").notNull().default(0),
    teamBScore: integer("team_b_score").notNull().default(0),
    startedAt: integer("started_at", { mode: "timestamp" }),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [uniqueIndex("idx_match_servers_room").on(table.roomId)],
);

export const matchEvents = sqliteTable(
  "match_events",
  {
    id: text("id").primaryKey(),
    serverId: text("server_id")
      .notNull()
      .references(() => matchServers.id),
    eventType: text("event_type").notNull(),
    payloadJson: text("payload_json").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_match_events_server_created").on(
      table.serverId,
      table.createdAt,
    ),
  ],
);

export const matchDisputes = sqliteTable(
  "match_disputes",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id),
    accusedUserId: text("accused_user_id").references(() => users.id),
    reviewedById: text("reviewed_by_id").references(() => users.id),
    reason: text("reason", {
      enum: ["hacking", "collusion", "wrong_result", "impersonation", "other"],
    }).notNull(),
    description: text("description").notNull(),
    status: text("status", { enum: ["pending", "upheld", "dismissed"] })
      .notNull()
      .default("pending"),
    resolution: text("resolution"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_match_disputes_status_created").on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const disputeEvidence = sqliteTable(
  "dispute_evidence",
  {
    id: text("id").primaryKey(),
    disputeId: text("dispute_id")
      .notNull()
      .references(() => matchDisputes.id),
    type: text("type", { enum: ["demo", "clip", "image", "note"] }).notNull(),
    storageKey: text("storage_key"),
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [index("idx_dispute_evidence_dispute").on(table.disputeId)],
);

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    roomId: text("room_id").references(() => rooms.id),
    channel: text("channel", {
      enum: ["general", "looking_for_room", "support", "announcements", "room"],
    }).notNull(),
    body: text("body").notNull(),
    deletedById: text("deleted_by_id").references(() => users.id),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_chat_messages_channel_created").on(
      table.channel,
      table.createdAt,
    ),
  ],
);

export const chatReports = sqliteTable(
  "chat_reports",
  {
    id: text("id").primaryKey(),
    messageId: text("message_id")
      .notNull()
      .references(() => chatMessages.id),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id),
    reason: text("reason").notNull(),
    status: text("status", { enum: ["pending", "resolved", "dismissed"] })
      .notNull()
      .default("pending"),
    reviewedById: text("reviewed_by_id").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  },
  (table) => [
    index("idx_chat_reports_status_created").on(table.status, table.createdAt),
  ],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    type: text("type", {
      enum: [
        "match",
        "wallet",
        "staff",
        "sanction",
        "community",
        "birthday",
        "security",
      ],
    }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    actionUrl: text("action_url"),
    readAt: integer("read_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_notifications_user_created").on(table.userId, table.createdAt),
  ],
);

export const notificationPreferences = sqliteTable("notification_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  matches: integer("matches", { mode: "boolean" }).notNull().default(true),
  wallet: integer("wallet", { mode: "boolean" }).notNull().default(true),
  staff: integer("staff", { mode: "boolean" }).notNull().default(true),
  community: integer("community", { mode: "boolean" }).notNull().default(false),
  emailEnabled: integer("email_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const playerRatings = sqliteTable(
  "player_ratings",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id),
    seasonKey: text("season_key").notNull(),
    elo: integer("elo").notNull().default(1000),
    level: integer("level").notNull().default(1),
    matches: integer("matches").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    calibrationStatus: text("calibration_status", {
      enum: ["pending", "staff_assigned", "established"],
    })
      .notNull()
      .default("pending"),
    calibratedById: text("calibrated_by_id").references(() => users.id),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_player_ratings_season_elo").on(table.seasonKey, table.elo),
  ],
);

export const ratingChanges = sqliteTable(
  "rating_changes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    roomId: text("room_id").references(() => rooms.id),
    beforeElo: integer("before_elo").notNull(),
    delta: integer("delta").notNull(),
    afterElo: integer("after_elo").notNull(),
    reason: text("reason", {
      enum: ["match", "calibration", "admin_correction"],
    }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_rating_changes_user_created").on(table.userId, table.createdAt),
  ],
);

export const teamBalanceSnapshots = sqliteTable(
  "team_balance_snapshots",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id),
    teamAElo: integer("team_a_elo").notNull(),
    teamBElo: integer("team_b_elo").notNull(),
    difference: integer("difference").notNull(),
    algorithmVersion: text("algorithm_version").notNull().default("v1"),
    teamsJson: text("teams_json").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_team_balance_room_created").on(table.roomId, table.createdAt),
  ],
);

export const competitiveSeasons = sqliteTable("competitive_seasons", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  status: text("status", { enum: ["scheduled", "active", "closed"] })
    .notNull()
    .default("scheduled"),
  startsAt: integer("starts_at", { mode: "timestamp" }).notNull(),
  endsAt: integer("ends_at", { mode: "timestamp" }).notNull(),
  resetFactorBasisPoints: integer("reset_factor_basis_points")
    .notNull()
    .default(2500),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const seasonPlacements = sqliteTable(
  "season_placements",
  {
    id: text("id").primaryKey(),
    seasonId: text("season_id")
      .notNull()
      .references(() => competitiveSeasons.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    finalPosition: integer("final_position").notNull(),
    finalElo: integer("final_elo").notNull(),
    finalLevel: integer("final_level").notNull(),
    badgeKey: text("badge_key"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("idx_season_placements_season_user").on(
      table.seasonId,
      table.userId,
    ),
    index("idx_season_placements_season_position").on(
      table.seasonId,
      table.finalPosition,
    ),
  ],
);

export const publicPlayerProfiles = sqliteTable("public_player_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  location: text("location"),
  bio: text("bio"),
  preferredMapsJson: text("preferred_maps_json").notNull().default("[]"),
  badgesJson: text("badges_json").notNull().default("[]"),
  profileVisible: integer("profile_visible", { mode: "boolean" })
    .notNull()
    .default(true),
  matchHistoryVisible: integer("match_history_visible", { mode: "boolean" })
    .notNull()
    .default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
