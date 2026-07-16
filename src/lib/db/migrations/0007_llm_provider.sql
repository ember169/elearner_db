ALTER TABLE settings ADD COLUMN llm_provider TEXT DEFAULT 'anthropic';
--> statement-breakpoint
ALTER TABLE settings ADD COLUMN llm_base_url TEXT;
