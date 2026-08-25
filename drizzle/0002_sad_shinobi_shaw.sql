CREATE TABLE `payment_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`reviewed_by_id` text,
	`type` text NOT NULL,
	`method` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`operation_code` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`proof_url` text,
	`review_notes` text,
	`requested_at` integer NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payment_requests_status_requested` ON `payment_requests` (`status`,`requested_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_payment_requests_operation_code` ON `payment_requests` (`operation_code`);--> statement-breakpoint
CREATE TABLE `reconciliations` (
	`id` text PRIMARY KEY NOT NULL,
	`date_key` text NOT NULL,
	`expected_cents` integer DEFAULT 0 NOT NULL,
	`actual_cents` integer DEFAULT 0 NOT NULL,
	`difference_cents` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`closed_by_id` text,
	`closed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`closed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reconciliations_date_key_unique` ON `reconciliations` (`date_key`);