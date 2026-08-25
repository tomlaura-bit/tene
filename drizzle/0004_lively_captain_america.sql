CREATE TABLE `match_events` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text NOT NULL,
	`event_type` text NOT NULL,
	`payload_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`server_id`) REFERENCES `match_servers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_match_events_server_created` ON `match_events` (`server_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `match_servers` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`provider` text DEFAULT 'matchzy' NOT NULL,
	`region` text DEFAULT 'lima' NOT NULL,
	`address_encrypted` text,
	`map` text,
	`status` text DEFAULT 'provisioning' NOT NULL,
	`team_a_score` integer DEFAULT 0 NOT NULL,
	`team_b_score` integer DEFAULT 0 NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_match_servers_room` ON `match_servers` (`room_id`);