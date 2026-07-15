CREATE TABLE `guidance_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`prompt` text NOT NULL,
	`response` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rootme_challenges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`challenge_id` integer NOT NULL,
	`title` text NOT NULL,
	`category` text,
	`score` integer DEFAULT 0,
	`solved_at` text
);
--> statement-breakpoint
CREATE TABLE `rootme_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`score` integer DEFAULT 0,
	`position` integer,
	`challenges_solved` integer DEFAULT 0,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `settings` ADD `rootme_api_key` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `rootme_cookie` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `rootme_user_id` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `llm_api_key` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `llm_model` text DEFAULT 'claude-sonnet-5';