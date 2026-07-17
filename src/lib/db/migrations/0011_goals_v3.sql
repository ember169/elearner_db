ALTER TABLE `goals` ADD `sort_order` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `goals` ADD `ft_slug` text;
--> statement-breakpoint
ALTER TABLE `goals` ADD `original_target` real;
--> statement-breakpoint
DROP TABLE `goal_groups`;
