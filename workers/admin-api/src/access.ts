export type AccessValidationErrorCode =
  | 'ACCESS_TOKEN_MISSING'
  | 'ACCESS_TOKEN_MALFORMED'
  | 'ACCESS_CERTS_UNAVAILABLE'
  | 'ACCESS_SIGNATURE_INVALID'
  | 'ACCESS_ISSUER_MISMATCH'
  | 'ACCESS_AUD_MISMATCH'
  | 'ACCESS_TOKEN_EXPIRED'
  | 'ACCESS_TOKEN_NOT_ACTIVE'
  | 'ACCESS_EMAIL_NOT_ALLOWED'

export type AccessValidationResult =
  | { ok: true; identity: AccessIdentity }
  | { ok: false; code: AccessValidationErrorCode; status: number }

export interface AccessEnv {
  ACCESS_TEAM_DOMAIN?: string
  ACCESS_AUD?: string
  ADMIN_ALLOWED_EMAILS?: string
}

export interface AccessIdentity {
  iss: string
  sub?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  type?: string
  email: string
  name?: string
}

type AccessJwtHeader = {
  alg?: string
  kid?: string
  typ?: string
}

type JwkSet = {
  keys?: JsonWebKey[]
}

const textDecoder = new TextDecoder()
const jwksCache = new Map<string, { expiresAt: number; keys: JsonWebKey[] }>()

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function decodeJsonSegment(segment: string): unknown {
  return JSON.parse(textDecoder.decode(base64UrlToBytes(segment)))
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function getNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function splitJwt(assertion: string): { header: AccessJwtHeader; payload: Record<string, unknown>; signingInput: Uint8Array; signature: Uint8Array } | null {
  const parts = assertion.split('.')
  if (parts.length !== 3) return null
  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const header = decodeJsonSegment(encodedHeader) as AccessJwtHeader
  const payload = decodeJsonSegment(encodedPayload) as Record<string, unknown>
  return {
    header,
    payload,
    signingInput: new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    signature: base64UrlToBytes(encodedSignature),
  }
}

function certsUrl(env: AccessEnv): string | null {
  const team = env.ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return team ? `https://${team}/cdn-cgi/access/certs` : null
}

async function loadAccessCerts(env: AccessEnv): Promise<JsonWebKey[] | null> {
  const url = certsUrl(env)
  if (!url) return null
  const cached = jwksCache.get(url)
  if (cached && cached.expiresAt > Date.now()) return cached.keys
  const response = await fetch(url)
  if (!response.ok) return null
  const body = (await response.json()) as JwkSet
  const keys = Array.isArray(body.keys) ? body.keys : []
  jwksCache.set(url, { expiresAt: Date.now() + 300_000, keys })
  return keys
}

async function verifySignature(header: AccessJwtHeader, signingInput: Uint8Array, signature: Uint8Array, env: AccessEnv): Promise<boolean | null> {
  if (header.alg !== 'RS256') return false
  const keys = await loadAccessCerts(env)
  if (!keys) return null
  const candidates = keys.filter((key) => !header.kid || key.kid === header.kid)
  for (const jwk of candidates) {
    const publicKey = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
    const verified = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, signingInput)
    if (verified) return true
  }
  return false
}

function toAudienceList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  return typeof value === 'string' ? [value] : []
}

function allowedEmails(env: AccessEnv): Set<string> {
  return new Set((env.ADMIN_ALLOWED_EMAILS ?? '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean))
}

function identityFromPayload(payload: Record<string, unknown>): AccessIdentity {
  return {
    iss: getString(payload.iss),
    sub: getString(payload.sub) || undefined,
    aud: Array.isArray(payload.aud) ? toAudienceList(payload.aud) : getString(payload.aud) || undefined,
    exp: getNumber(payload.exp),
    nbf: getNumber(payload.nbf),
    iat: getNumber(payload.iat),
    type: getString(payload.type) || undefined,
    email: getString(payload.email).toLowerCase(),
    name: getString(payload.name) || undefined,
  }
}

export async function validateAccessJwt(request: Request, env: AccessEnv, nowSeconds = Math.floor(Date.now() / 1000)): Promise<AccessValidationResult> {
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion') ?? ''
  if (!assertion) return { ok: false, code: 'ACCESS_TOKEN_MISSING', status: 401 }

  const decoded = splitJwt(assertion)
  if (!decoded) return { ok: false, code: 'ACCESS_TOKEN_MALFORMED', status: 401 }

  const signatureValid = await verifySignature(decoded.header, decoded.signingInput, decoded.signature, env)
  if (signatureValid === null) return { ok: false, code: 'ACCESS_CERTS_UNAVAILABLE', status: 503 }
  if (!signatureValid) return { ok: false, code: 'ACCESS_SIGNATURE_INVALID', status: 401 }

  const identity = identityFromPayload(decoded.payload)
  const expectedIssuer = env.ACCESS_TEAM_DOMAIN ? `https://${env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '')}` : ''
  if (expectedIssuer && identity.iss !== expectedIssuer) return { ok: false, code: 'ACCESS_ISSUER_MISMATCH', status: 401 }

  const audList = toAudienceList(decoded.payload.aud)
  if (env.ACCESS_AUD && !audList.includes(env.ACCESS_AUD!)) return { ok: false, code: 'ACCESS_AUD_MISMATCH', status: 401 }
  if (identity.exp && identity.exp <= nowSeconds) return { ok: false, code: 'ACCESS_TOKEN_EXPIRED', status: 401 }
  if (identity.nbf && identity.nbf > nowSeconds) return { ok: false, code: 'ACCESS_TOKEN_NOT_ACTIVE', status: 401 }

  const emails = allowedEmails(env)
  if (emails.size > 0 && !emails.has(identity.email)) return { ok: false, code: 'ACCESS_EMAIL_NOT_ALLOWED', status: 403 }

  return { ok: true, identity }
}
