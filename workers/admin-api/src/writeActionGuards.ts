import type { AccessIdentity, AdminWriteActionMode, AdminWriteActorRole, Env } from './types'
import { adminWriteAllowedEmails, adminWriteMode } from './env'

export type AdminWriteGuardResult =
  | { ok: true; code: string; message: string }
  | { ok: false; code: string; message: string }

const roleRank: Record<AdminWriteActorRole, number> = { viewer: 0, operator: 1, owner: 2 }

export function actorRole(identity: AccessIdentity, env: Env): AdminWriteActorRole {
  const allowed = adminWriteAllowedEmails(env)
  if (!allowed.length) return 'viewer'
  return allowed.includes(identity.email.toLowerCase()) ? 'owner' : 'viewer'
}

export function requireAdminWriteMode(env: Env, allowedModes: AdminWriteActionMode[]): AdminWriteGuardResult {
  const mode = adminWriteMode(env)
  if (allowedModes.includes(mode)) return { ok: true, code: 'admin-write-mode-ok', message: `ADMIN_WRITE_MODE=${mode}` }
  return { ok: false, code: 'admin-write-mode-blocked', message: `ADMIN_WRITE_MODE=${mode}. Dry-run planning is disabled by the admin write policy.` }
}

export function requireActorRole(identity: AccessIdentity, env: Env, requiredRole: AdminWriteActorRole): AdminWriteGuardResult {
  const actual = actorRole(identity, env)
  if (roleRank[actual] >= roleRank[requiredRole]) return { ok: true, code: 'actor-role-ok', message: `Actor role ${actual} satisfies ${requiredRole}.` }
  return { ok: false, code: 'actor-role-blocked', message: `Actor role ${actual} does not satisfy ${requiredRole}.` }
}

export function requireConfirmPhrase(provided: string | undefined, required: string): AdminWriteGuardResult {
  if (provided === required) return { ok: true, code: 'confirm-phrase-ok', message: 'Confirm phrase matched.' }
  return { ok: false, code: 'confirm-phrase-blocked', message: `Confirm phrase must exactly match ${required}.` }
}

export function blockRuntimeWriteAction(): AdminWriteGuardResult {
  return { ok: false, code: 'runtime-write-blocked', message: 'Runtime write actions are blocked by the dry-run-only admin write policy.' }
}
