CREATE TABLE IF NOT EXISTS admin_action_audit_log (
  id TEXT PRIMARY KEY,
  action_kind TEXT NOT NULL,
  mode TEXT NOT NULL,
  actor_email_masked TEXT,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  order_id TEXT,
  product_slug TEXT,
  variant_id TEXT,
  bundle_id TEXT,
  risk_level TEXT NOT NULL,
  reason TEXT,
  confirm_phrase_matched INTEGER NOT NULL DEFAULT 0,
  dry_run_result_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_action_audit_log_action_kind
ON admin_action_audit_log(action_kind);

CREATE INDEX IF NOT EXISTS idx_admin_action_audit_log_target
ON admin_action_audit_log(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_admin_action_audit_log_created_at
ON admin_action_audit_log(created_at);
