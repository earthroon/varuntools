export function maskEmail(email: string | null | undefined): string | null { if(!email) return null; const [name, domain] = email.split('@'); if(!domain) return '***'; return `${name.slice(0,2)}***@${domain}` }
export function maskPaymentKey(paymentKey: string | null | undefined): string | null { if(!paymentKey) return null; return `${paymentKey.slice(0,4)}****${paymentKey.slice(-4)}` }
export function maskGrantId(grantId: string | null | undefined): string | null { if(!grantId) return null; return `${grantId.slice(0,6)}****${grantId.slice(-4)}` }
export function stripPrivateDeliveryFields<T>(input:T):T { return JSON.parse(JSON.stringify(input, (key, value) => ['r2Key','privatePath','downloadUrl','publicUrl','rawJson'].includes(key) ? undefined : value)) }
