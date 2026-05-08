export function createInquiryId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `inq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function createInquiryEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `inqevt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
