#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const errors = []
const file = (rel) => path.join(root, rel)
const read = (rel) => readFileSync(file(rel), 'utf8')
const expect = (condition, message) => { if (!condition) errors.push(message) }

for (const rel of [
  'workers/delivery/src/index.ts',
  'workers/delivery/src/grants.ts',
  'workers/delivery/src/db.ts',
  'workers/delivery/src/r2.ts',
  'workers/delivery/src/types.ts',
  'docs/authoring/private-r2-download.md',
  'docs/migration/commit-72.md',
]) expect(existsSync(file(rel)), `Missing ${rel}`)

const index = read('workers/delivery/src/index.ts')
const grants = read('workers/delivery/src/grants.ts')
const db = read('workers/delivery/src/db.ts')
const r2 = read('workers/delivery/src/r2.ts')
const types = read('workers/delivery/src/types.ts')
const docs = `${read('docs/authoring/private-r2-download.md')}\n${read('docs/migration/commit-72.md')}`

expect(index.includes('validateGrant(grantId, deliverableId, env)'), 'validateGrant must include deliverableId')
expect(index.includes('consumeGrantDownloadAtomically'), 'atomic consume missing')
const body = index.slice(index.indexOf('async function handleDownload'))
expect(body.indexOf('getPrivateDeliverableObject') < body.indexOf('consumeGrantDownloadAtomically'), 'R2 must precede atomic count consume')

for (const token of ['findGrantById', 'consumeGrantDownloadAtomically', 'download_count < max_downloads']) expect(db.includes(token), `db missing ${token}`)
for (const token of ['GRANT_NOT_FOUND', 'GRANT_INACTIVE', 'GRANT_REVOKED', 'GRANT_EXPIRED', 'GRANT_DOWNLOAD_LIMIT_REACHED', 'GRANT_DELIVERABLE_MISMATCH']) {
  expect(grants.includes(token), `grants missing ${token}`)
  expect(types.includes(token), `types missing ${token}`)
}
expect(grants.includes('scopedIdCandidates') && grants.includes('deliverableIds.includes(candidate)'), 'deliverable scope missing')
expect(grants.includes('status: 403') && grants.includes('GRANT_NOT_FOUND'), '403 missing')
expect(grants.includes('status: 410') && grants.includes('GRANT_EXPIRED'), '410 expired missing')

expect(r2.includes('R2_BUCKET_NOT_CONFIGURED') && r2.includes('R2_OBJECT_MISSING'), 'R2 errors missing')
expect(r2.includes('Cache-Control') && r2.includes('private, no-store'), 'cache header missing')
expect(r2.includes('Content-Disposition') && r2.includes('attachment'), 'attachment missing')
expect(r2.includes('X-Content-Type-Options') && r2.includes('nosniff'), 'nosniff missing')

const combined = [index, grants, db, r2, types].join('\n')
for (const token of ['R2_OBJECT_NOT_FOUND', 'publicUrl', 'downloadUrl', 'gateCode', 'localStorage', 'sessionStorage']) {
  expect(!combined.includes(token), `forbidden ${token}`)
}
expect(docs.includes('download_count') && docs.includes('R2_OBJECT_MISSING') && docs.includes('fail-closed'), 'docs incomplete')
const pkg = JSON.parse(read('package.json'))
expect(pkg.scripts['smoke:delivery-redemption'] === 'node scripts/smoke-delivery-redemption.mjs', 'package script missing')
expect(read('scripts/check-launch.mjs').includes('smoke-delivery-redemption.mjs'), 'check launch missing')

if (errors.length) {
  console.error('Delivery Redemption Smoke')
  for (const error of errors) console.error(`ERROR ${error}`)
  process.exit(1)
}
console.log('Delivery Redemption Smoke')
console.log('[smoke:delivery-redemption] OK private R2 redemption is fail-closed and grant-gated')
