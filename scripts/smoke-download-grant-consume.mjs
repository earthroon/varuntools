#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const errors = []
const required = [
  'workers/delivery/src/db.ts',
  'workers/delivery/src/index.ts',
  'workers/delivery/src/grants.ts',
  'workers/delivery/src/types.ts',
  'docs/authoring/purchase-grants.md',
  'docs/authoring/private-r2-download.md',
  'docs/migration/commit-83.md',
]

for (const rel of required) {
  if (!existsSync(path.join(root, rel))) errors.push(`missing ${rel}`)
}

function text(rel) {
  return readFileSync(path.join(root, rel), 'utf8')
}

if (!errors.length) {
  const db = text('workers/delivery/src/db.ts')
  const index = text('workers/delivery/src/index.ts')
  const types = text('workers/delivery/src/types.ts')
  const grants = text('workers/delivery/src/grants.ts')
  const purchaseDocs = text('docs/authoring/purchase-grants.md')
  const downloadDocs = text('docs/authoring/private-r2-download.md')

  const haystack = [db, index, types, grants, purchaseDocs, downloadDocs].join('\n')
  for (const token of [
    'consumeGrantDownloadAtomically',
    'UPDATE purchase_grants',
    'download_count = download_count + 1',
    "status = 'active'",
    'expires_at IS NULL',
    'expires_at =',
    'expires_at >',
    'max_downloads IS NULL',
    'download_count < max_downloads',
    'result.meta?.changes',
    'GRANT_DOWNLOAD_LIMIT_REACHED',
    'GRANT_CONSUME_CONFLICT',
    'GrantConsumeResult',
    '조건부 UPDATE',
    'download_count is incremented only after the private R2 object is found',
  ]) {
    if (!haystack.includes(token)) errors.push(`missing atomic consume token: ${token}`)
  }

  if (db.includes('export async function incrementGrantDownloadCount')) {
    errors.push('db.ts must not export legacy unconditional incrementGrantDownloadCount')
  }
  if (index.includes('incrementGrantDownloadCount')) {
    errors.push('index.ts must not call legacy unconditional incrementGrantDownloadCount')
  }
  const objectIndex = index.indexOf('object = await getPrivateDeliverableObject')
  const consumeIndex = index.indexOf('const consume = await consumeGrantDownloadAtomically')
  if (objectIndex === -1 || consumeIndex === -1 || objectIndex > consumeIndex) {
    errors.push('handleDownload must fetch the R2 object before consuming the grant counter')
  }
  if (index.includes('!grant.deliverableIds.includes(deliverable.id)')) {
    errors.push('handleDownload must not re-break scoped deliverable grants with a raw deliverableIds.includes check')
  }
  if (!grants.includes('scopedIdCandidates')) {
    errors.push('validateGrant must remain the deliverable scope SSOT and support scoped productSlug:deliverableId entries')
  }
  if (!purchaseDocs.includes('Commit 83 atomic download consume')) {
    errors.push('purchase-grants.md missing Commit 83 note')
  }
  if (!downloadDocs.includes('Commit 83')) {
    errors.push('private-r2-download.md missing Commit 83 note')
  }
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`)
  process.exit(1)
}

console.log('[smoke:download-grant-consume] OK purchase_grants download counter is consumed by a conditional UPDATE boundary')
