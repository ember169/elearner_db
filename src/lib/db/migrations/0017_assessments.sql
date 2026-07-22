-- Assessment AI settings columns
ALTER TABLE settings ADD assess_llm_provider text;
--> statement-breakpoint
ALTER TABLE settings ADD assess_llm_api_key text;
--> statement-breakpoint
ALTER TABLE settings ADD assess_llm_model text;
--> statement-breakpoint
ALTER TABLE settings ADD assess_llm_base_url text;
--> statement-breakpoint

-- Assessment sessions
CREATE TABLE assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competency_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  trigger_type TEXT NOT NULL,
  activity_level INTEGER NOT NULL,
  validated_level INTEGER,
  overall_score REAL,
  attempt_number INTEGER DEFAULT 1,
  previous_assessment_id INTEGER,
  question_count INTEGER DEFAULT 0,
  gaps_json TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint

-- Individual questions within an assessment
CREATE TABLE assessment_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  rubric_json TEXT NOT NULL,
  question_hash TEXT,
  student_answer TEXT,
  score_json TEXT,
  score REAL,
  difficulty_flag TEXT,
  sort_order INTEGER DEFAULT 0,
  answered_at TEXT,
  graded_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint

-- Latest validated level per competency
CREATE TABLE competency_validations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competency_id TEXT NOT NULL UNIQUE,
  validated_level INTEGER NOT NULL,
  assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL,
  persistent_gaps_json TEXT,
  validated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
