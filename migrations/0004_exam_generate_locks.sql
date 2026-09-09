-- Serialize generate/force-regen per exam so concurrent requests cannot
-- delete each other's freshly written instances mid-ZIP response.
CREATE TABLE exam_generate_locks (
  exam_id TEXT PRIMARY KEY REFERENCES exams(id) ON DELETE CASCADE,
  lock_token TEXT NOT NULL,
  locked_at TEXT NOT NULL DEFAULT (datetime('now'))
);
