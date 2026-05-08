import type { AdminWriteMode, Env } from './types'

export function adminApiMode(env: Env) { return env.ADMIN_API_MODE ?? 'not_configured' }
export function adminApiReadOnly(env: Env) { return env.ADMIN_API_READ_ONLY !== 'false' }
export function adminDbConfigured(env: Env) { return Boolean(env.ADMIN_DB) }
export function inquiryDbConfigured(env: Env) { return Boolean(env.INQUIRY_DB || env.ADMIN_DB) }
export function accessConfigured(env: Env) { return Boolean(env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD) }
export function adminWriteMode(env: Env): AdminWriteMode { return env.ADMIN_WRITE_MODE ?? 'disabled' }
export function adminWriteDryRunOnly(env: Env) { return adminWriteMode(env) === 'dry-run' }
export function adminWriteAllowedEmails(env: Env): string[] { return String(env.ADMIN_WRITE_ALLOWED_EMAILS ?? '').split(',').map((email)=>email.trim().toLowerCase()).filter(Boolean) }
export function adminWriteConfirmRequired(env: Env) { return env.ADMIN_WRITE_REQUIRE_CONFIRM !== 'false' }
export function adminWriteAuditLogRequired(env: Env) { return env.ADMIN_WRITE_AUDIT_LOG_REQUIRED !== 'false' }
