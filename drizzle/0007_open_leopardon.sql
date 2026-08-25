CREATE TABLE `benefit_passes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source` text NOT NULL,
	`value_cents` integer DEFAULT 600 NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`valid_on` text,
	`expires_at` integer,
	`room_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_benefit_passes_user_status` ON `benefit_passes` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan` text DEFAULT 'sub' NOT NULL,
	`price_cents` integer DEFAULT 2000 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`starts_at` integer,
	`ends_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_subscriptions_user_status` ON `subscriptions` (`user_id`,`status`);