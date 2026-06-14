#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const errors = []
const requiredFiles = [
  'workers/delivery/src/toss.ts',
  'workers/delivery/src/index.ts',
  'workers/delivery/src/paymentActivation.ts',
  'workers/delivery/src/paymentWebhookAuth.ts',
  'workers/delivery/src/db.ts',
  'docs/authoring/payment-webhook.md',
]

for (const rel of requiredFiles) {
  if (!existsSync(path.join(root, rel))) errors.push(`missing ${rel}`)
}

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8')
}

const index = read('workers/delivery/src/index.ts')
const activation = read('workers/delivery/src/paymentActivation.ts')
const auth = read('workers/delivery/src/paymentWebhookAuth.ts')
const db = read('workers/delivery/src/db.ts')
const types = read('workers/delivery/src/types.ts')
const toss = read('workers/delivery/src/toss.ts')
const docs = read('docs/authoring/payment-webhook.md')

for (const token of [
  '/webhooks/toss',
  "pathname.startsWith('/webhooks/toss/')",
  'verifyPaymentWebhookIngress',
  'readWebhookRawJsonWithLimit',
  'activateTossPaymentWebhook(body.rawJson',
]) {
  if (!index.includes(token)) errors.push(`webhook route missing ${token}`)
}

for (const token of [
  'PAYMENT_WEBHOOK_SECRET_NOT_CONFIGURED',
  'PAYMENT_WEBHOOK_SECRET_WEAK',
  'WEBHOOK_AUTH_MISSING',
  'WEBHOOK_AUTH_INVALID',
  'WEBHOOK_BODY_TOO_LARGE',
  'timingSafeEqual',
  'content-length',
  'x-varuntools-webhook-secret',
]) {
  if (!auth.includes(token)) errors.push(`webhook auth missing ${token}`)
}

for (const token of [
  'rawJson: string',
  'JSON.parse(rawJson)',
  'insertWebhookEventReceived',
  'retrieveTossPaymentSafe',
  'WEBHOOK_PAYMENT_KEY_MISSING',
  'createPurchaseGrantOnce',
]) {
  if (!activation.includes(token)) errors.push(`activation flow missing ${token}`)
}

if (!db.includes('ON CONFLICT(event_id) DO NOTHING')) errors.push('webhook_events insert must be atomic/idempotent')
if (!db.includes('result.meta?.changes')) errors.push('webhook_events insert must inspect D1 changes')
if (!toss.includes('/v1/payments/')) errors.push('toss.ts must retrieve payment server-to-server')

for (const code of [
  'PAYMENT_WEBHOOK_SECRET_NOT_CONFIGURED',
  'PAYMENT_WEBHOOK_SECRET_WEAK',
  'WEBHOOK_AUTH_MISSING',
  'WEBHOOK_AUTH_INVALID',
  'WEBHOOK_BODY_TOO_LARGE',
]) {
  if (!types.includes(code)) errors.push(`ApiErrorCode missing ${code}`)
}

for (const phrase of [
  '/webhooks/toss/<PAYMENT_WEBHOOK_SECRET>',
  'Webhook ingress secret',
  'Toss retrieve',
]) {
  if (!docs.includes(phrase)) errors.push(`payment webhook docs missing ${phrase}`)
}

if (errors.length) {
  for (const e of errors) console.error(`ERROR ${e}`)
  process.exit(1)
}

console.log('[smoke:payment-webhook] OK authenticated webhook ingress contract is sealed')
