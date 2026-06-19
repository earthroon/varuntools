-- F6-F32 admin action audit runtime fields
-- Adds dry-run audit correlation fields required by the admin audit smoke.
ALTER TABLE admin_action_audit_log ADD COLUMN plan_status TEXT;
ALTER TABLE admin_action_audit_log ADD COLUMN request_id TEXT;
ALTER TABLE admin_action_audit_log ADD COLUMN audit_recorded_at TEXT;
CREATE INDEX IF NOT EXISTS idx_admin_action_audit_log_request_id ON admin_action_audit_log(request_id);
