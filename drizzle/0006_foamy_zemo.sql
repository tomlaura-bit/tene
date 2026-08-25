CREATE TABLE `account_registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`nickname` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`birth_date` text NOT NULL,
	`status` text DEFAULT 'email_pending' NOT NULL,
	`email_verified_at` integer,
	`linked_user_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`linked_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_registrations_email_unique` ON `account_registrations` (`email`);--> statement-breakpoint
CREATE TABLE `birthday_rewards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`year` integer NOT NULL,
	`free_rooms_granted` integer DEFAULT 2 NOT NULL,
	`free_rooms_used` integer DEFAULT 0 NOT NULL,
	`granted_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_birthday_rewards_user_year` ON `birthday_rewards` (`user_id`,`year`);