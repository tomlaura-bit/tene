CREATE TABLE `external_financial_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`external_id` text NOT NULL,
	`operation_ref` text,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'PEN' NOT NULL,
	`status` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`payload_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_external_movements_provider_id` ON `external_financial_movements` (`provider`,`external_id`);--> statement-breakpoint
CREATE INDEX `idx_external_movements_operation` ON `external_financial_movements` (`operation_ref`);--> statement-breakpoint
CREATE TABLE `ledger_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`normal_balance` text NOT NULL,
	`currency` text DEFAULT 'PEN' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_accounts_code_unique` ON `ledger_accounts` (`code`);--> statement-breakpoint
CREATE INDEX `idx_ledger_accounts_user` ON `ledger_accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `ledger_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`external_ref` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`currency` text DEFAULT 'PEN' NOT NULL,
	`description` text NOT NULL,
	`reversal_of_id` text,
	`posted_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_transactions_external_ref_unique` ON `ledger_transactions` (`external_ref`);--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_transactions_reversal_of_id_unique` ON `ledger_transactions` (`reversal_of_id`);--> statement-breakpoint
CREATE INDEX `idx_ledger_transactions_status_created` ON `ledger_transactions` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `outbox_events` (
	`id` text PRIMARY KEY NOT NULL,
	`deduplication_key` text NOT NULL,
	`topic` text NOT NULL,
	`aggregate_type` text NOT NULL,
	`aggregate_id` text NOT NULL,
	`payload_json` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`available_at` integer NOT NULL,
	`locked_at` integer,
	`last_error` text,
	`completed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outbox_events_deduplication_key_unique` ON `outbox_events` (`deduplication_key`);--> statement-breakpoint
CREATE INDEX `idx_outbox_ready` ON `outbox_events` (`status`,`available_at`);--> statement-breakpoint
CREATE TABLE `reconciliation_items` (
	`id` text PRIMARY KEY NOT NULL,
	`reconciliation_id` text NOT NULL,
	`operation_ref` text NOT NULL,
	`source` text NOT NULL,
	`internal_cents` integer,
	`external_cents` integer,
	`status` text NOT NULL,
	`details_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`reconciliation_id`) REFERENCES `reconciliations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reconciliation_items_run_ref_source` ON `reconciliation_items` (`reconciliation_id`,`operation_ref`,`source`);--> statement-breakpoint
CREATE INDEX `idx_reconciliation_items_status` ON `reconciliation_items` (`status`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role` text NOT NULL,
	`permission` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_role_permissions_role_permission` ON `role_permissions` (`role`,`permission`);--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`permission` text NOT NULL,
	`effect` text NOT NULL,
	`granted_by_id` text NOT NULL,
	`granted_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`granted_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_user_permissions_user_permission` ON `user_permissions` (`user_id`,`permission`);--> statement-breakpoint
ALTER TABLE `idempotency_keys` ADD `request_hash` text;--> statement-breakpoint
ALTER TABLE `idempotency_keys` ADD `response_status` integer;--> statement-breakpoint
ALTER TABLE `idempotency_keys` ADD `response_body` text;--> statement-breakpoint
ALTER TABLE `ledger_entries` ADD `transaction_id` text REFERENCES ledger_transactions(id);--> statement-breakpoint
ALTER TABLE `ledger_entries` ADD `account_id` text REFERENCES ledger_accounts(id);--> statement-breakpoint
ALTER TABLE `ledger_entries` ADD `direction` text;--> statement-breakpoint
ALTER TABLE `webhook_receipts` ADD `external_event_id` text;--> statement-breakpoint
ALTER TABLE `webhook_receipts` ADD `payload_hash` text;--> statement-breakpoint
ALTER TABLE `webhook_receipts` ADD `occurred_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_webhook_receipts_provider_event` ON `webhook_receipts` (`provider`,`external_event_id`);
--> statement-breakpoint
CREATE TRIGGER `guard_ledger_transaction_post_balance`
BEFORE UPDATE OF status ON `ledger_transactions`
WHEN OLD.status = 'draft' AND NEW.status = 'posted'
BEGIN
  SELECT CASE WHEN (SELECT COUNT(*) FROM ledger_entries WHERE transaction_id = NEW.id) < 2
    THEN RAISE(ABORT, 'ledger_transaction_requires_two_entries') END;
  SELECT CASE WHEN COALESCE((SELECT SUM(CASE direction WHEN 'debit' THEN amount_cents ELSE -amount_cents END) FROM ledger_entries WHERE transaction_id = NEW.id), 0) != 0
    THEN RAISE(ABORT, 'ledger_transaction_unbalanced') END;
  SELECT CASE WHEN EXISTS (SELECT 1 FROM ledger_entries WHERE transaction_id = NEW.id AND (amount_cents <= 0 OR direction NOT IN ('debit','credit') OR account_id IS NULL))
    THEN RAISE(ABORT, 'ledger_entry_invalid') END;
END;
--> statement-breakpoint
CREATE TRIGGER `guard_posted_ledger_entry_update`
BEFORE UPDATE ON `ledger_entries`
WHEN OLD.transaction_id IS NOT NULL AND EXISTS (SELECT 1 FROM ledger_transactions WHERE id = OLD.transaction_id AND status IN ('posted','reversed'))
BEGIN SELECT RAISE(ABORT, 'posted_ledger_entry_immutable'); END;
--> statement-breakpoint
CREATE TRIGGER `guard_posted_ledger_entry_delete`
BEFORE DELETE ON `ledger_entries`
WHEN OLD.transaction_id IS NOT NULL AND EXISTS (SELECT 1 FROM ledger_transactions WHERE id = OLD.transaction_id AND status IN ('posted','reversed'))
BEGIN SELECT RAISE(ABORT, 'posted_ledger_entry_immutable'); END;
--> statement-breakpoint
CREATE TRIGGER `guard_posted_ledger_transaction_update`
BEFORE UPDATE ON `ledger_transactions`
WHEN OLD.status IN ('posted','reversed') AND NOT (OLD.status = 'posted' AND NEW.status = 'reversed' AND OLD.id = NEW.id AND OLD.type = NEW.type AND OLD.currency = NEW.currency AND OLD.description = NEW.description AND OLD.external_ref IS NEW.external_ref AND OLD.reversal_of_id IS NEW.reversal_of_id AND OLD.created_at = NEW.created_at AND OLD.posted_at IS NEW.posted_at)
BEGIN SELECT RAISE(ABORT, 'posted_ledger_transaction_immutable'); END;
--> statement-breakpoint
CREATE TRIGGER `guard_posted_ledger_transaction_delete`
BEFORE DELETE ON `ledger_transactions`
WHEN OLD.status IN ('posted','reversed')
BEGIN SELECT RAISE(ABORT, 'posted_ledger_transaction_immutable'); END;
