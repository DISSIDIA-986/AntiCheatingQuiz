-- Short-lived, exam-scoped instructor sessions keep sheet QR codes from acting
-- as credentials. Existing exam tokens remain the compatibility login path.
CREATE TABLE grading_sessions (
  token_hash TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_grading_sessions_exam ON grading_sessions(exam_id);
CREATE INDEX idx_grading_sessions_expiry ON grading_sessions(expires_at);