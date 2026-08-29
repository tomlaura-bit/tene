CREATE TABLE `webhook_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`room_id` text NOT NULL,
	`received_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_webhook_receipts_received` ON `webhook_receipts` (`received_at`);