ALTER TABLE admin_action_audit_log ADD COLUMN actor_sub TEXT;
ALTER TABLE admin_action_audit_log ADD COLUMN plan_status TEXT;
ALTER TABLE admin_action_audit_log ADD COLUMN plan_valid INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admin_action_audit_log ADD COLUMN execution_allowed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE admin_action_audit_log ADD COLUMN runtime_blocked INTEGER NOT NULL DEFAULT 1;
ALTER TABLE admin_action_audit_log ADD COLUMN request_id TEXT;
ALTER TABLE admin_action_audit_log ADD COLUMN cf_ray TEXT;
ALTER TABLE admin_action_audit_log ADD COLUMN operator_note TEXT;

CREATE INDEX IF NOT EXISTS idx_admin_action_audit_log_request_id
ON admin_action_audit_log(request_id);

CREATE INDEX IF NOT EXISTS idx_admin_action_audit_log_plan_status
ON admin_action_audit_log(plan_status);

CREATE INDEX IF NOT EXISTS idx_admin_action_audit_log_actor_sub
ON admin_action_audit_log(actor_sub);
