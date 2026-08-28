CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`window_started_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rate_limits_expires` ON `rate_limits` (`expires_at`);--> statement-breakpoint
ALTER TABLE `users` ADD `legal_version` text;--> statement-breakpoint
ALTER TABLE `users` ADD `terms_accepted_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `privacy_accepted_at` integer;