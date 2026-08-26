CREATE TABLE `sanction_appeals` (
	`id` text PRIMARY KEY NOT NULL,
	`sanction_id` text NOT NULL,
	`user_id` text NOT NULL,
	`reviewed_by_id` text,
	`reason` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`resolution` text,
	`created_at` integer NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`sanction_id`) REFERENCES `sanctions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewed_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_sanction_appeals_status_created` ON `sanction_appeals` (`status`,`created_at`);