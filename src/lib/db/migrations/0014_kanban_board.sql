ALTER TABLE plan_items ADD COLUMN goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE plan_items ADD COLUMN category TEXT;
--> statement-breakpoint
ALTER TABLE plan_items ADD COLUMN board_status TEXT DEFAULT 'backlog';
--> statement-breakpoint
UPDATE plan_items SET category = CASE
  WHEN type IN ('thm', 'htb', 'rootme') THEN 'cybersec'
  WHEN type = 'maldev' THEN 'maldev'
  ELSE '42'
END WHERE category IS NULL;
--> statement-breakpoint
UPDATE plan_items SET board_status = CASE
  WHEN status = 'done' THEN 'done'
  WHEN status = 'active' THEN 'in_progress'
  ELSE 'backlog'
END;
