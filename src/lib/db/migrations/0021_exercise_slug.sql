-- Stable identity for exercises so content refreshes update in place
-- (preserving attempts) instead of duplicating. Clear the slug-less pilot rows
-- once; they are re-seeded with slugs on the next init.
DELETE FROM section_exercises;
--> statement-breakpoint
ALTER TABLE section_exercises ADD slug TEXT;
