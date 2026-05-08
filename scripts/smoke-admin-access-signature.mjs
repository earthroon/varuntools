#!/usr/bin/env node
import fs from 'node:fs'

const failures = []
const read = (path) => fs.readFileSync(path, 'utf8')
const exists = (path) => fs.existsSync(path)
const accessPath = 'workers/admin-api/src/access.ts'
const typesPath = 'workers/admin-api/src/types.ts'
const docsPath = 'docs/admin/access-jwt-validation.md'

for (const path of [accessPath, typesPath, docsPath]) {
  if (!exists(path)) failures.push(`missing ${path}`)
}

if (exists(accessPath)) {
  const access = read(accessPath)
  const requiredTokens = [
    'Cf-Access-Jwt-Assertion',
    '/cdn-cgi/access/certs',
    'crypto.subtle.verify',
    "alg !== 'RS256'",
    'ACCESS_SIGNATURE_INVALID',
    'ACCESS_CERTS_UNAVAILABLE',
    'ACCESS_ISSUER_MISMATCH',
    'ACCESS_AUD_MISMATCH',
    'ACCESS_TOKEN_EXPIRED',
    'ACCESS_TOKEN_NOT_ACTIVE',
    'ACCESS_EMAIL_NOT_ALLOWED',
    'jwksCache',
  ]
  for (const token of requiredTokens) {
    if (!access.includes(token)) failures.push(`${accessPath} missing token: ${token}`)
  }
  const forbiddenTokens = [
    'parseJwtPayload',
    'Production should verify signature',
    "payload = parseJwtPayload",
    "code:'ACCESS_DENIED'",
  ]
  for (const token of forbiddenTokens) {
    if (access.includes(token)) failures.push(`${accessPath} still contains legacy token: ${token}`)
  }
  if (!/crypto\.subtle\.importKey\(\s*['"]jwk['"]/s.test(access)) failures.push(`${accessPath} does not import JWK public keys`)
  if (!/crypto\.subtle\.verify\(\s*['"]RSASSA-PKCS1-v1_5['"]/s.test(access)) failures.push(`${accessPath} does not verify RSASSA-PKCS1-v1_5 signatures`)
  if (!/audList\.includes\(env\.ACCESS_AUD!\)/.test(access)) failures.push(`${accessPath} does not check audience membership`)
  if (!/getString\(payload\.email\)\.toLowerCase\(\)/.test(access)) failures.push(`${accessPath} does not lowercase email before allowlist check`)
}

if (exists(typesPath)) {
  const types = read(typesPath)
  for (const token of ['iss: string', 'sub?: string', 'nbf?: number', 'type?: string']) {
    if (!types.includes(token)) failures.push(`${typesPath} missing AccessIdentity field: ${token}`)
  }
}

if (exists(docsPath)) {
  const docs = read(docsPath)
  for (const token of ['signature verification', 'ACCESS_SIGNATURE_INVALID', 'Payload shape is not identity. Signature is identity.']) {
    if (!docs.includes(token)) failures.push(`${docsPath} missing documentation token: ${token}`)
  }
}

const pkg = JSON.parse(read('package.json'))
if (pkg.scripts?.['smoke:admin-access-signature'] !== 'node scripts/smoke-admin-access-signature.mjs') {
  failures.push('package.json missing smoke:admin-access-signature script')
}

if (failures.length) {
  console.error('[smoke:admin-access-signature] FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[smoke:admin-access-signature] OK Access JWT signature verification boundary is sealed')
