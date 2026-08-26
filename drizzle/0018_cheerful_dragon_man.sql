ALTER TABLE `ledger_entries` ADD `payment_request_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_entries_payment_request_id_unique` ON `ledger_entries` (`payment_request_id`);