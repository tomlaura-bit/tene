CREATE TABLE `matchmaking_queue` (
	`user_id` text PRIMARY KEY NOT NULL,
	`region` text DEFAULT 'lima' NOT NULL,
	`elo_at_join` integer DEFAULT 1000 NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_matchmaking_queue_region_joined` ON `matchmaking_queue` (`region`,`joined_at`);--> statement-breakpoint
CREATE INDEX `idx_matchmaking_queue_region_elo` ON `matchmaking_queue` (`region`,`elo_at_join`);