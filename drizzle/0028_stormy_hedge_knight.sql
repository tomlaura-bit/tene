CREATE TABLE `payment_destinations` (
	`id` text PRIMARY KEY NOT NULL,
	`method` text NOT NULL,
	`display_name` text NOT NULL,
	`phone` text NOT NULL,
	`qr_object_key` text,
	`status` text DEFAULT 'inactive' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_by_id` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_destinations_method_unique` ON `payment_destinations` (`method`);--> statement-breakpoint
CREATE INDEX `idx_payment_destinations_status` ON `payment_destinations` (`status`);