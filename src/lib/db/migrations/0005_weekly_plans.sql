CREATE TABLE `weekly_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`week_start` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plan_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`weekly_plan_id` integer NOT NULL REFERENCES `weekly_plans`(`id`) ON DELETE CASCADE,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`why` text,
	`estimated_hours` real DEFAULT 2,
	`priority` text DEFAULT 'medium' NOT NULL,
	`day_index` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`ref` text,
	`link` text,
	`sort_order` integer DEFAULT 0,
	`deferred_to` text,
	`completed_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `catalog_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`difficulty` text,
	`path` text,
	`link` text,
	`source` text DEFAULT 'sync' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
