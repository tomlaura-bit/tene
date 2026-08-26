CREATE TABLE `public_player_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`location` text,
	`bio` text,
	`preferred_maps_json` text DEFAULT '[]' NOT NULL,
	`badges_json` text DEFAULT '[]' NOT NULL,
	`profile_visible` integer DEFAULT true NOT NULL,
	`match_history_visible` integer DEFAULT true NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
