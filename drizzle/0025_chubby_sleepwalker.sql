CREATE TABLE `idempotency_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`scope` text NOT NULL,
	`request_key` text NOT NULL,
	`status` text DEFAULT 'processing' NOT NULL,
	`resource_id` text,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_idempotency_user_scope_key` ON `idempotency_keys` (`user_id`,`scope`,`request_key`);--> statement-breakpoint
CREATE INDEX `idx_idempotency_expires` ON `idempotency_keys` (`expires_at`);
--> statement-breakpoint
CREATE TRIGGER `guard_wallet_insert`
BEFORE INSERT ON `wallets`
WHEN NEW.`available_cents` < 0 OR NEW.`locked_cents` < 0 OR NEW.`debt_cents` < 0
BEGIN SELECT RAISE(ABORT, 'wallet_balance_out_of_range'); END;
--> statement-breakpoint
CREATE TRIGGER `guard_wallet_update`
BEFORE UPDATE OF `available_cents`, `locked_cents`, `debt_cents` ON `wallets`
WHEN NEW.`available_cents` < 0 OR NEW.`locked_cents` < 0 OR NEW.`debt_cents` < 0
BEGIN SELECT RAISE(ABORT, 'wallet_balance_out_of_range'); END;
--> statement-breakpoint
CREATE TRIGGER `guard_room_values_insert`
BEFORE INSERT ON `rooms`
WHEN NEW.`entry_cents` <= 0 OR NEW.`prize_per_winner_cents` <= 0
BEGIN SELECT RAISE(ABORT, 'room_amount_out_of_range'); END;
--> statement-breakpoint
CREATE TRIGGER `guard_room_values_update`
BEFORE UPDATE OF `entry_cents`, `prize_per_winner_cents` ON `rooms`
WHEN NEW.`entry_cents` <= 0 OR NEW.`prize_per_winner_cents` <= 0
BEGIN SELECT RAISE(ABORT, 'room_amount_out_of_range'); END;
--> statement-breakpoint
CREATE TRIGGER `guard_room_slot_insert`
BEFORE INSERT ON `room_players`
WHEN NEW.`slot_number` IS NOT NULL AND (NEW.`slot_number` < 1 OR NEW.`slot_number` > 10)
BEGIN SELECT RAISE(ABORT, 'room_slot_out_of_range'); END;
--> statement-breakpoint
CREATE TRIGGER `guard_room_slot_update`
BEFORE UPDATE OF `slot_number` ON `room_players`
WHEN NEW.`slot_number` IS NOT NULL AND (NEW.`slot_number` < 1 OR NEW.`slot_number` > 10)
BEGIN SELECT RAISE(ABORT, 'room_slot_out_of_range'); END;
--> statement-breakpoint
CREATE TRIGGER `guard_rating_insert`
BEFORE INSERT ON `player_ratings`
WHEN NEW.`level` < 1 OR NEW.`level` > 10 OR NEW.`elo` < 0 OR NEW.`matches` < 0 OR NEW.`wins` < 0 OR NEW.`losses` < 0
BEGIN SELECT RAISE(ABORT, 'rating_out_of_range'); END;
--> statement-breakpoint
CREATE TRIGGER `guard_rating_update`
BEFORE UPDATE OF `level`, `elo`, `matches`, `wins`, `losses` ON `player_ratings`
WHEN NEW.`level` < 1 OR NEW.`level` > 10 OR NEW.`elo` < 0 OR NEW.`matches` < 0 OR NEW.`wins` < 0 OR NEW.`losses` < 0
BEGIN SELECT RAISE(ABORT, 'rating_out_of_range'); END;
--> statement-breakpoint
CREATE TRIGGER `guard_payment_amount_insert`
BEFORE INSERT ON `payment_requests`
WHEN NEW.`amount_cents` <= 0
BEGIN SELECT RAISE(ABORT, 'payment_amount_out_of_range'); END;
--> statement-breakpoint
CREATE TRIGGER `guard_payment_terminal_state`
BEFORE UPDATE OF `status` ON `payment_requests`
WHEN OLD.`status` <> NEW.`status` AND OLD.`status` <> 'pending'
BEGIN SELECT RAISE(ABORT, 'payment_already_terminal'); END;
--> statement-breakpoint
PRAGMA optimize;
