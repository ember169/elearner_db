-- V4: Learning Resources
CREATE TABLE IF NOT EXISTS learning_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  external_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  difficulty TEXT,
  estimated_hours REAL,
  content_type TEXT,
  tags_json TEXT,
  competency_ids TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS learning_paths (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  competency_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS learning_path_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path_id INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  resource_id INTEGER NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0
);
--> statement-breakpoint

-- V4: Knowledge Articles
CREATE TABLE IF NOT EXISTS knowledge_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competency_id TEXT NOT NULL,
  depth_tier INTEGER NOT NULL,
  title TEXT NOT NULL,
  recommended_level INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ready',
  generated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS article_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  heading TEXT NOT NULL,
  content TEXT NOT NULL,
  is_expanded INTEGER DEFAULT 0,
  expansion_prompt TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS article_annotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES article_sections(id) ON DELETE CASCADE,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  highlight_text TEXT NOT NULL,
  note_text TEXT,
  review_card_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS user_content_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  after_section_id INTEGER REFERENCES article_sections(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  block_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
--> statement-breakpoint

-- V4: Mentor Chat
CREATE TABLE IF NOT EXISTS mentor_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  context_json TEXT,
  article_id INTEGER REFERENCES knowledge_articles(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
