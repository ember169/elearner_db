-- Auto-graded multiple-choice comprehension exercises anchored to a section
CREATE TABLE section_exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES article_sections(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint

-- One row per answered attempt (local, single-user progress)
CREATE TABLE exercise_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exercise_id INTEGER NOT NULL REFERENCES section_exercises(id) ON DELETE CASCADE,
  selected_index INTEGER NOT NULL,
  is_correct INTEGER NOT NULL,
  answered_at TEXT NOT NULL DEFAULT (datetime('now'))
);
