CREATE TABLE IF NOT EXISTS `deadlines` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `type` text NOT NULL,
  `label` text NOT NULL,
  `target_date` text NOT NULL,
  `ft_slug` text,
  `circle` integer,
  `parent_id` integer,
  `auto_generated` integer DEFAULT false,
  `weekly_hours_needed` real,
  `warning` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);
