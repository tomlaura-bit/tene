CREATE TABLE `dispute_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`dispute_id` text NOT NULL,
	`type` text NOT NULL,
	`storage_key` text,
	`description` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`dispute_id`) REFERENCES `match_disputes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_dispute_evidence_dispute` ON `dispute_evidence` (`dispute_id`);--> statement-breakpoint
CREATE TABLE `match_disputes` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`reporter_id` text NOT NULL,
	`accused_user_id` text,
	`reviewed_by_id` text,
	`reason` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`resolution` text,
	`created_at` integer NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`accused_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_match_disputes_status_created` ON `match_disputes` (`status`,`created_at`);