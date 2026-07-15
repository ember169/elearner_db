import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

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
  migrate(database, {
    migrationsFolder: path.join(process.cwd(), "src/lib/db/migrations"),
  });
  return database;
}

function getDb(): DB {
  if (!instance) instance = initDb();
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
