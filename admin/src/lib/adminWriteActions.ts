import type { AdminDryRunInput, AdminWriteActionPlan } from '@/types/admin'

const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE ?? '/api'

async function requestDryRun(path: string, input: AdminDryRunInput): Promise<AdminWriteActionPlan> {
  const response = await fetch(`${ADMIN_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  })
  const payload = await response.json()
  if (!response.ok || !payload.ok) {
    throw new Error(payload?.error?.message ?? 'Dry-run write action planning failed.')
  }
  return payload.data as AdminWriteActionPlan
}

export async function dryRunGrantRevoke(grantId: string, input: AdminDryRunInput): Promise<AdminWriteActionPlan> {
  return requestDryRun(`/write-actions/grants/${encodeURIComponent(grantId)}/revoke/dry-run`, input)
}

export async function dryRunGrantReissue(grantId: string, input: AdminDryRunInput): Promise<AdminWriteActionPlan> {
  return requestDryRun(`/write-actions/grants/${encodeURIComponent(grantId)}/reissue/dry-run`, input)
}

export async function dryRunRefundNote(orderId: string, input: AdminDryRunInput): Promise<AdminWriteActionPlan> {
  return requestDryRun(`/write-actions/orders/${encodeURIComponent(orderId)}/refund-note/dry-run`, input)
}

export async function dryRunSupportNote(orderId: string, input: AdminDryRunInput): Promise<AdminWriteActionPlan> {
  return requestDryRun(`/write-actions/orders/${encodeURIComponent(orderId)}/support-note/dry-run`, input)
}

export async function dryRunWebhookReplay(eventId: string, input: AdminDryRunInput): Promise<AdminWriteActionPlan> {
  return requestDryRun(`/write-actions/webhook-events/${encodeURIComponent(eventId)}/replay/dry-run`, input)
}
