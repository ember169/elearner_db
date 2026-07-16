ALTER TABLE weekly_plans ADD COLUMN mentor_briefing TEXT;
--> statement-breakpoint
ALTER TABLE weekly_plans ADD COLUMN collapsed_briefing TEXT;
--> statement-breakpoint
ALTER TABLE plan_items ADD COLUMN source_week TEXT;
--> statement-breakpoint
ALTER TABLE plan_items ADD COLUMN attempt_count INTEGER DEFAULT 0;
--> statement-breakpoint
ALTER TABLE plan_items ADD COLUMN blocked_reason TEXT;
--> statement-breakpoint
ALTER TABLE plan_items ADD COLUMN blocked_since TEXT;
--> statement-breakpoint
ALTER TABLE plan_items ADD COLUMN description TEXT;
