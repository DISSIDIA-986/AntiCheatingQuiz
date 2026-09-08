-- Never reuse a printed sheet code after force-regen (old QR must stay dead).
CREATE TABLE issued_instance_ids (
  instance_id TEXT PRIMARY KEY,
  issued_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO issued_instance_ids (instance_id)
SELECT id FROM instances;
