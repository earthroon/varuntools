#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd(), '..', '..')
const failures = []
function exists(relativePath) { return fs.existsSync(path.join(root, relativePath)) }
function read(relativePath) { return exists(relativePath) ? fs.readFileSync(path.join(root, relativePath), 'utf8') : '' }
function requireFile(relativePath) { if (!exists(relativePath)) failures.push('missing ' + relativePath) }
function requireToken(relativePath, token) { if (!read(relativePath).includes(token)) failures.push(relativePath + ' missing token: ' + token) }

for (const file of [
  'workers/delivery/src/db.ts',
  'workers/delivery/src/grants.ts',
  'workers/delivery/src/index.ts',
  'workers/delivery/src/paymentActivation.ts',
  'workers/delivery/src/paymentWebhookAuth.ts',
  'workers/delivery/src/toss.ts',
  'workers/delivery/src/types.ts',
]) requireFile(file)

for (const [file, tokens] of Object.entries({
  'workers/delivery/src/index.ts': ['/webhooks/toss', 'consumeGrantDownloadAtomically', 'getPrivateDeliverableObject'],
  'workers/delivery/src/paymentWebhookAuth.ts': ['verifyPaymentWebhookIngress', 'timingSafeEqual', 'x-varuntools-webhook-secret'],
  'workers/delivery/src/paymentActivation.ts': ['activateTossPaymentWebhook', 'createPurchaseGrantOnce', 'retrieveTossPaymentSafe'],
  'workers/delivery/src/db.ts': ['insertWebhookEventReceived', 'ON CONFLICT(event_id) DO NOTHING', 'consumeGrantDownloadAtomically'],
  'workers/delivery/src/grants.ts': ['scopedIdCandidates'],
  'workers/delivery/src/types.ts': ['GrantConsumeResult', 'WEBHOOK_AUTH_INVALID'],
})) {
  for (const token of tokens) requireToken(file, token)
}

if (failures.length > 0) {
  console.error('[delivery:check] failed')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log('[delivery:check] OK delivery worker contract files are present')
