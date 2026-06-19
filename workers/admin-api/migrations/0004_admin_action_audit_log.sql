-- F6-F32-R1 admin action audit log base table.
CREATE TABLE IF NOT EXISTS admin_action_audit_log (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  action TEXT NOT NULL DEFAULT 'admin.dry_run',
  dry_run_result_json TEXT NOT NULL DEFAULT '{}',
  actor_email_masked TEXT,
  cf_ray TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_action_audit_log_created_at
  ON admin_action_audit_log(created_at);
