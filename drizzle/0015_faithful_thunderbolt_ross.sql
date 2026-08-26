PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_subject_id` text,
	`email` text,
	`full_name` text,
	`birth_date` text,
	`steam_id_64` text,
	`nickname` text NOT NULL,
	`cs2_minutes` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`role` text DEFAULT 'player' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "auth_subject_id", "email", "full_name", "birth_date", "steam_id_64", "nickname", "cs2_minutes", "level", "status", "role", "created_at") SELECT "id", NULL, NULL, NULL, NULL, "steam_id_64", "nickname", "cs2_minutes", "level", "status", "role", "created_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_auth_subject_id_unique` ON `users` (`auth_subject_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_steam_id_64_unique` ON `users` (`steam_id_64`);
