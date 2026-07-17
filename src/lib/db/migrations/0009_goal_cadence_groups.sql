CREATE TABLE `goal_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`operator` text DEFAULT 'and' NOT NULL,
	`parent_group_id` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `goals` ADD `goal_type` text DEFAULT 'cumulative' NOT NULL;
--> statement-breakpoint
ALTER TABLE `goals` ADD `cadence_value` real;
--> statement-breakpoint
ALTER TABLE `goals` ADD `cadence_unit` text;
--> statement-breakpoint
ALTER TABLE `goals` ADD `group_id` integer;
