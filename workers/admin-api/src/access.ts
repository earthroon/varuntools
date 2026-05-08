import type { AccessIdentity, Env } from './types'
import { accessConfigured } from './env'

type AccessResult = { ok: true; identity: AccessIdentity } | { ok: false; status: number; code: string; message: string }
type JsonRecord = Record<string, unknown>
type AccessJwk = JsonWebKey & { kid?: string; alg?: string; use?: string }
type AccessCertsResponse = { keys?: AccessJwk[] }
type DecodedJwt = { header: JsonRecord; payload: JsonRecord; signingInput: string; signature: Uint8Array }

type CachedJwks = { expiresAt: number; keys: AccessJwk[] }
const jwksCache = new Map<string, CachedJwks>()
const JWKS_CACHE_TTL_MS = 10 * 60 * 1000

function fail(status: number, code: string, message: string): AccessResult {
  return { ok: false, status, code, message }
}

function normalizeTeamDomain(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  return trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`
}

function base64UrlToBytes(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes
  } catch {
    return null
  }
}

function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}

function parseJsonPart(value: string): JsonRecord | null {
  const bytes = base64UrlToBytes(value)
  if (!bytes) return null
  try {
    const parsed = JSON.parse(bytesToUtf8(bytes))
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as JsonRecord : null
  } catch {
    return null
  }
}

function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [encodedHeader, encodedPayload, encodedSignature] = parts
  const header = parseJsonPart(encodedHeader)
  const payload = parseJsonPart(encodedPayload)
  const signature = base64UrlToBytes(encodedSignature)
  if (!header || !payload || !signature) return null
  return { header, payload, signingInput: `${encodedHeader}.${encodedPayload}`, signature }
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function getAudList(payload: JsonRecord): string[] {
  const value = payload.aud
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return [value]
  return []
}

function parseAllowedEmails(value?: string): string[] {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function normalizeJwks(body: AccessCertsResponse): AccessJwk[] {
  if (!Array.isArray(body.keys)) return []
  return body.keys.filter((key): key is AccessJwk => Boolean(key) && typeof key === 'object')
}

async function fetchAccessJwks(teamDomain: string): Promise<AccessJwk[]> {
  const cached = jwksCache.get(teamDomain)
  if (cached && cached.expiresAt > Date.now()) return cached.keys

  const response = await fetch(`${teamDomain}/cdn-cgi/access/certs`, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`Cloudflare Access certs unavailable: ${response.status}`)
  const body = await response.json() as AccessCertsResponse
  const keys = normalizeJwks(body)
  jwksCache.set(teamDomain, { expiresAt: Date.now() + JWKS_CACHE_TTL_MS, keys })
  return keys
}

async function importAccessPublicKey(jwk: AccessJwk): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    { ...jwk, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
}

async function verifyRs256Signature(decoded: DecodedJwt, teamDomain: string): Promise<boolean | 'CERTS_UNAVAILABLE'> {
  let keys: AccessJwk[]
  try {
    keys = await fetchAccessJwks(teamDomain)
  } catch {
    return 'CERTS_UNAVAILABLE'
  }

  const kid = getString(decoded.header.kid)
  const candidates = keys.filter((key) => !kid || key.kid === kid)
  if (!candidates.length) return false

  const signingBytes = new TextEncoder().encode(decoded.signingInput)
  for (const jwk of candidates) {
    try {
      const key = await importAccessPublicKey(jwk)
      const verified = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decoded.signature, signingBytes)
      if (verified) return true
    } catch {
      // Keep trying the remaining Access keys. A malformed or stale key must not grant access.
    }
  }
  return false
}

export async function verifyAccessRequest(request: Request, env: Env): Promise<AccessResult> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!token) return fail(401, 'ACCESS_TOKEN_MISSING', 'Missing Cf-Access-Jwt-Assertion.')
  if (!accessConfigured(env)) return fail(501, 'ADMIN_API_NOT_CONFIGURED', 'ACCESS_TEAM_DOMAIN and ACCESS_AUD are required.')

  const teamDomain = normalizeTeamDomain(env.ACCESS_TEAM_DOMAIN!)
  if (!teamDomain) return fail(501, 'ADMIN_API_NOT_CONFIGURED', 'ACCESS_TEAM_DOMAIN is empty.')
  const decoded = decodeJwt(token)
  if (!decoded) return fail(401, 'ACCESS_TOKEN_INVALID', 'Invalid Access JWT format.')

  const alg = getString(decoded.header.alg)
  const kid = getString(decoded.header.kid)
  if (alg !== 'RS256' || !kid) return fail(401, 'ACCESS_HEADER_INVALID', 'Access JWT must use RS256 and include kid.')

  const signatureResult = await verifyRs256Signature(decoded, teamDomain)
  if (signatureResult === 'CERTS_UNAVAILABLE') return fail(503, 'ACCESS_CERTS_UNAVAILABLE', 'Cloudflare Access certs are unavailable.')
  if (!signatureResult) return fail(401, 'ACCESS_SIGNATURE_INVALID', 'Access JWT signature verification failed.')

  const payload = decoded.payload
  const issuer = getString(payload.iss)
  if (issuer !== teamDomain) return fail(403, 'ACCESS_ISSUER_MISMATCH', 'Access issuer mismatch.')

  const audList = getAudList(payload)
  if (!audList.includes(env.ACCESS_AUD!)) return fail(403, 'ACCESS_AUD_MISMATCH', 'Access AUD mismatch.')

  const now = Math.floor(Date.now() / 1000)
  const exp = Number(payload.exp ?? 0)
  if (!Number.isFinite(exp) || exp <= 0) return fail(401, 'ACCESS_TOKEN_INVALID', 'Access token expiry is missing.')
  if (exp <= now) return fail(401, 'ACCESS_TOKEN_EXPIRED', 'Access token expired.')

  const nbf = Number(payload.nbf ?? 0)
  if (Number.isFinite(nbf) && nbf > now) return fail(401, 'ACCESS_TOKEN_NOT_ACTIVE', 'Access token is not active yet.')

  const iat = Number(payload.iat ?? 0)
  const email = getString(payload.email).toLowerCase()
  const sub = getString(payload.sub)
  if (!email && !sub) return fail(403, 'ACCESS_IDENTITY_MISSING', 'Access identity is missing email/sub.')

  const allowed = parseAllowedEmails(env.ACCESS_ALLOWED_EMAILS)
  if (allowed.length && (!email || !allowed.includes(email))) return fail(403, 'ACCESS_EMAIL_NOT_ALLOWED', 'Email is not allowed.')

  return {
    ok: true,
    identity: {
      email: email || sub,
      aud: env.ACCESS_AUD!,
      exp,
      iat: Number.isFinite(iat) ? iat : undefined,
      nbf: Number.isFinite(nbf) && nbf > 0 ? nbf : undefined,
      iss: issuer,
      sub: sub || undefined,
      type: getString(payload.type) || undefined,
    },
  }
}
