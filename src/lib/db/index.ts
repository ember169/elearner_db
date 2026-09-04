import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import fs from "fs";
import path from "path";
import { seedLearningResources, backfillCompetencyIds, ensureCppModuleResources } from "@/lib/learn/seed";
import { seedKnowledgeArticles } from "@/lib/knowledge/seed";
import { seedSectionExercises } from "@/lib/knowledge/exercise-seed";

type DB = BetterSQLite3Database<typeof schema>;

let instance: DB | null = null;

function initDb(): DB {
  const dbPath =
    process.env.DATABASE_PATH || path.join(process.cwd(), "data", "learner.db");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const database = drizzle(sqlite, { schema });
  try {
    migrate(database, {
      migrationsFolder: path.join(process.cwd(), "src/lib/db/migrations"),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("duplicate column name") && !msg.includes("ADD COLUMN")) throw e;
  }
  ensureExerciseSchema(sqlite);
  ensureManualCompletions(sqlite);
  ensureProjectChoices(sqlite);
  return database;
}

/**
 * Comprehension-quiz tables, created idempotently in code rather than via a
 * drizzle migration. The repo's migration timestamps are non-monotonic, which
 * makes drizzle's migrator re-run and skip migrations unpredictably (hence the
 * error-swallowing try/catch above); CREATE TABLE IF NOT EXISTS plus a guarded
 * ALTER is deterministic on both fresh and already-seeded databases.
 */
function ensureExerciseSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS section_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL REFERENCES article_sections(id) ON DELETE CASCADE,
      slug TEXT,
      sort_order INTEGER DEFAULT 0,
      prompt TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS exercise_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL REFERENCES section_exercises(id) ON DELETE CASCADE,
      selected_index INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      answered_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  // Pre-slug pilot databases have the table without the column.
  try {
    sqlite.exec("ALTER TABLE section_exercises ADD COLUMN slug TEXT");
  } catch {
    /* column already exists */
  }
  // Drop any slug-less rows left by the pilot; they are re-seeded with slugs.
  sqlite.exec("DELETE FROM section_exercises WHERE slug IS NULL");
}

function ensureManualCompletions(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS manual_project_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function ensureProjectChoices(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS project_choices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_name TEXT NOT NULL UNIQUE,
      chosen_slug TEXT NOT NULL,
      chosen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function getDb(): DB {
  if (!instance) {
    instance = initDb();
    seedLearningResources();
    ensureCppModuleResources();
    backfillCompetencyIds();
    seedKnowledgeArticles();
    // Comprehension MCQs — resolves to sections by heading, so must run after
    // articles are seeded. Idempotent (skips once any exercise exists).
    seedSectionExercises();
  }
  return instance;
}

// Lazy connection: importing this module has no side effects. The database is
// opened and migrated on first actual use — at runtime, when a request handler
// runs a query — never during `next build`. The build spins up several worker
// processes to analyze the routes (all force-dynamic); because it only imports
// them and never executes their queries, migrations no longer run, and can no
// longer race across those workers, at build time.
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : value;
  },
});
