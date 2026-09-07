-- Exams are private workspaces addressed by raw token in URL; only hash stored.
CREATE TABLE exams (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'Exam',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE exam_payloads (
  exam_id TEXT PRIMARY KEY REFERENCES exams(id) ON DELETE CASCADE,
  bank_json TEXT NOT NULL,
  roster_json TEXT NOT NULL,
  generated_at TEXT
);

CREATE TABLE instances (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  map_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_instances_exam ON instances(exam_id);

CREATE TABLE grades (
  instance_id TEXT PRIMARY KEY REFERENCES instances(id) ON DELETE CASCADE,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  answers_json TEXT NOT NULL,
  score_correct INTEGER NOT NULL,
  score_pct REAL NOT NULL,
  status TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_grades_exam ON grades(exam_id);
