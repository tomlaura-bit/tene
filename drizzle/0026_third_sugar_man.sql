CREATE TABLE `privacy_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`resolution` text,
	`requested_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_privacy_requests_user_requested` ON `privacy_requests` (`user_id`,`requested_at`);--> statement-breakpoint
CREATE INDEX `idx_privacy_requests_status_requested` ON `privacy_requests` (`status`,`requested_at`);