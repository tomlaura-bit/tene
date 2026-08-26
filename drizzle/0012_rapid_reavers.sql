CREATE TABLE `player_ratings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`season_key` text NOT NULL,
	`elo` integer DEFAULT 1000 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`matches` integer DEFAULT 0 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`calibration_status` text DEFAULT 'pending' NOT NULL,
	`calibrated_by_id` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`calibrated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_player_ratings_season_elo` ON `player_ratings` (`season_key`,`elo`);--> statement-breakpoint
CREATE TABLE `rating_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`room_id` text,
	`before_elo` integer NOT NULL,
	`delta` integer NOT NULL,
	`after_elo` integer NOT NULL,
	`reason` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_rating_changes_user_created` ON `rating_changes` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `team_balance_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`team_a_elo` integer NOT NULL,
	`team_b_elo` integer NOT NULL,
	`difference` integer NOT NULL,
	`algorithm_version` text DEFAULT 'v1' NOT NULL,
	`teams_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_team_balance_room_created` ON `team_balance_snapshots` (`room_id`,`created_at`);