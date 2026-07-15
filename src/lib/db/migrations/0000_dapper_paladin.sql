CREATE TABLE `activity_feed` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`event_type` text NOT NULL,
	`title` text NOT NULL,
	`details` text,
	`timestamp` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`date` text NOT NULL,
	`data` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ft_achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`achievement_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`tier` text,
	`kind` text
);
--> statement-breakpoint
CREATE TABLE `ft_logtimes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`duration_seconds` integer DEFAULT 0,
	`host` text
);
--> statement-breakpoint
CREATE TABLE `ft_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`login` text NOT NULL,
	`level` real DEFAULT 0,
	`correction_points` integer DEFAULT 0,
	`wallet` integer DEFAULT 0,
	`coalition` text,
	`coalition_score` integer,
	`campus` text,
	`image_url` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ft_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`status` text,
	`final_mark` integer,
	`validated` integer,
	`marked_at` text
);
--> statement-breakpoint
CREATE TABLE `ft_skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`skill_id` integer NOT NULL,
	`name` text NOT NULL,
	`level` real DEFAULT 0,
	`cursus_id` integer
);
--> statement-breakpoint
CREATE TABLE `goal_milestones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`goal_id` integer NOT NULL,
	`title` text NOT NULL,
	`target_value` real,
	`reached_at` text,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text,
	`target_value` real,
	`current_value` real DEFAULT 0,
	`metric_source` text,
	`deadline` text,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `htb_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity_type` text NOT NULL,
	`object_type` text,
	`name` text,
	`date` text
);
--> statement-breakpoint
CREATE TABLE `htb_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`rank` text,
	`rank_id` integer,
	`points` integer DEFAULT 0,
	`ranking` integer,
	`system_owns` integer DEFAULT 0,
	`user_owns` integer DEFAULT 0,
	`system_bloods` integer DEFAULT 0,
	`user_bloods` integer DEFAULT 0,
	`current_rank_progress` real DEFAULT 0,
	`next_rank` text,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `maldev_exercises` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exercise_id` text NOT NULL,
	`module_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'pending',
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `maldev_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module_id` text NOT NULL,
	`name` text NOT NULL,
	`progress` real DEFAULT 0,
	`exercises_completed` integer DEFAULT 0,
	`total_exercises` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `maldev_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`overall_progress` real DEFAULT 0,
	`modules_completed` integer DEFAULT 0,
	`total_modules` integer DEFAULT 0,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`notes` text,
	`category` text,
	`tags` text DEFAULT '[]',
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`ft_client_id` text,
	`ft_client_secret` text,
	`ft_user_id` text,
	`ft_access_token` text,
	`ft_token_expires_at` integer,
	`thm_username` text,
	`htb_api_token` text,
	`htb_user_id` text,
	`maldev_db_path` text,
	`theme` text DEFAULT 'dark',
	`sync_interval_minutes` integer DEFAULT 60
);
--> statement-breakpoint
CREATE TABLE `sync_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`platform` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`items_synced` integer DEFAULT 0,
	`started_at` text DEFAULT (datetime('now')) NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text DEFAULT 'general',
	`is_completed` integer DEFAULT false,
	`is_auto_generated` integer DEFAULT false,
	`is_recurring` integer DEFAULT false,
	`recurrence_pattern` text,
	`due_date` text,
	`completed_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `thm_badges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`badge_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`image_url` text
);
--> statement-breakpoint
CREATE TABLE `thm_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`rank` integer,
	`rank_title` text,
	`points` integer DEFAULT 0,
	`rooms_completed` integer DEFAULT 0,
	`badges_count` integer DEFAULT 0,
	`streak` integer DEFAULT 0,
	`level` integer DEFAULT 0,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `thm_rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_code` text NOT NULL,
	`room_name` text NOT NULL,
	`completed_at` text
);
