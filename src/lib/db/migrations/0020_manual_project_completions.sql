CREATE TABLE IF NOT EXISTS manual_project_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
