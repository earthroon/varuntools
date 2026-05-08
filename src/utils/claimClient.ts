import type { ClaimClientMode, ClaimLookupInput, ClaimLookupResult } from '@/types/claim'
function clean(value: string | undefined): string { return (value || '').trim() }
export function normalizeClaimInput(input: ClaimLookupInput): ClaimLookupInput { return { claimToken: clean(input.claimToken), email: clean(input.email).toLowerCase() || undefined, orderId: clean(input.orderId) || undefined } }
export function validateClaimInput(input: ClaimLookupInput): string[] {
  const normalized = normalizeClaimInput(input)
  const errors: string[] = []
  if (!normalized.claimToken) errors.push('claim token을 입력해주세요.')
  if (normalized.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized.email)) errors.push('이메일 형식을 확인해주세요.')
  return errors
}
export function getClaimClientMode(): ClaimClientMode {
  const raw = String(import.meta.env.VITE_CLAIM_CLIENT_MODE || 'disabled')
  return raw === 'mock' || raw === 'worker' ? raw : 'disabled'
}
export async function lookupClaim(input: ClaimLookupInput): Promise<ClaimLookupResult> {
  const normalized = normalizeClaimInput(input)
  const errors = validateClaimInput(normalized)
  if (errors.length) return { status: 'error', message: errors.join(' ') }
  const mode = getClaimClientMode()
  if (mode === 'disabled') return { status: 'not-configured', message: '자동 수령 검증은 아직 연결되지 않았습니다. 결제 안내 메일 또는 문의 채널을 확인하세요.' }
  if (mode === 'mock') return { status: 'pending-worker', message: '수령 포털 UI는 준비되었습니다. 실제 권한 검증은 Delivery Worker 연결 후 활성화됩니다.', productTitle: 'VARUN Tools digital product', deliverables: [] }
  const response = await fetch('/claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(normalized) })
  if (response.status === 410) return { status: 'expired', message: '수령 가능 기간이 만료되었습니다.' }
  if (response.status === 404 || response.status === 403) return { status: 'not-found', message: '입력한 정보로 수령 권한을 찾지 못했습니다.' }
  if (response.status === 501) return { status: 'not-configured', message: '자동 수령 검증은 아직 연결되지 않았습니다. 결제 안내 메일 또는 문의 채널을 확인하세요.' }
  if (!response.ok) return { status: 'error', message: '수령 정보 확인 중 문제가 발생했습니다.' }
  const data = (await response.json()) as Partial<ClaimLookupResult>
  return { status: data.status || 'found', message: data.message || '구매 권한이 확인되었습니다.', productSlug: data.productSlug, productTitle: data.productTitle, grantId: data.grantId, expiresAt: data.expiresAt, deliverables: data.deliverables || [] }
}
