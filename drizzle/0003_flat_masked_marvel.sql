CREATE TABLE `steam_profile_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`steam_id_64` text NOT NULL,
	`profile_public` integer DEFAULT false NOT NULL,
	`game_details_public` integer DEFAULT false NOT NULL,
	`owns_cs2` integer DEFAULT false NOT NULL,
	`cs2_minutes` integer DEFAULT 0 NOT NULL,
	`eligible` integer DEFAULT false NOT NULL,
	`raw_snapshot_json` text,
	`checked_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_steam_profile_checks_user_checked` ON `steam_profile_checks` (`user_id`,`checked_at`);