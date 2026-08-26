CREATE TABLE `competitive_seasons` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`reset_factor_basis_points` integer DEFAULT 2500 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `competitive_seasons_key_unique` ON `competitive_seasons` (`key`);--> statement-breakpoint
CREATE TABLE `season_placements` (
	`id` text PRIMARY KEY NOT NULL,
	`season_id` text NOT NULL,
	`user_id` text NOT NULL,
	`final_position` integer NOT NULL,
	`final_elo` integer NOT NULL,
	`final_level` integer NOT NULL,
	`badge_key` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `competitive_seasons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_season_placements_season_user` ON `season_placements` (`season_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_season_placements_season_position` ON `season_placements` (`season_id`,`final_position`);