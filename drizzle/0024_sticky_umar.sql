ALTER TABLE `room_players` ADD `slot_number` integer;--> statement-breakpoint
UPDATE `room_players` AS current
SET `slot_number` = (
  SELECT COUNT(*)
  FROM `room_players` AS prior
  WHERE prior.`room_id` = current.`room_id`
    AND (
      prior.`joined_at` < current.`joined_at`
      OR (prior.`joined_at` = current.`joined_at` AND prior.`id` <= current.`id`)
    )
);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_room_players_room_slot` ON `room_players` (`room_id`,`slot_number`);
