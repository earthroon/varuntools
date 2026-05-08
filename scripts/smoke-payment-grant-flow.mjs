#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const errors = []
const required = [
  'workers/delivery/src/paymentActivation.ts',
  'workers/delivery/src/index.ts',
  'workers/delivery/src/db.ts',
  'workers/delivery/src/toss.ts',
  'workers/delivery/src/env.ts',
  'workers/delivery/src/types.ts',
  'workers/delivery/migrations/0002_payment_webhook_activation.sql',
  'docs/authoring/payment-webhook-activation.md',
  'docs/migration/commit-74.md',
]

for (const rel of required) {
  if (!existsSync(path.join(root, rel))) errors.push(`missing ${rel}`)
}

function text(rel) {
  return readFileSync(path.join(root, rel), 'utf8')
}

if (!errors.length) {
  const activation = text('workers/delivery/src/paymentActivation.ts')
  const index = text('workers/delivery/src/index.ts')
  const db = text('workers/delivery/src/db.ts')
  const toss = text('workers/delivery/src/toss.ts')
  const env = text('workers/delivery/src/env.ts')
  const types = text('workers/delivery/src/types.ts')
  const migration = text('workers/delivery/migrations/0002_payment_webhook_activation.sql')
  const docs = text('docs/authoring/payment-webhook-activation.md')

  for (const token of [
    'POST /webhooks/toss',
    'PAYMENT_STATUS_CHANGED',
    'paymentKey',
    'retrieveTossPaymentSafe',
    "status === 'DONE'",
    'purchase_orders',
    'purchase_grants',
    'webhook_events',
    'already-processed',
    'already-granted',
    'no-grant',
    'payment-not-paid',
    'expectedAmount',
    'readyForCheckout',
    'PAYMENT_WEBHOOK_MODE',
    'not_configured',
    'test',
    'live',
  ]) {
    const haystack = [activation, index, db, toss, env, types, migration, docs].join('\n')
    if (!haystack.includes(token)) errors.push(`missing token ${token}`)
  }

  if (!index.includes('activateTossPaymentWebhook(body.rawJson, env, productsBySlug)')) {
    errors.push('index.ts must delegate authenticated webhook rawJson to activateTossPaymentWebhook')
  }
  if (index.includes('createPurchaseGrant(') || index.includes('retrieveTossPayment(env')) {
    errors.push('index.ts must not create grants or retrieve payments directly')
  }
  if (activation.includes('Date.now()}`') || activation.includes('Date.now()}')) {
    errors.push('paymentActivation.ts must not use Date.now as webhook eventId fallback')
  }
  const unpaidIndex = activation.indexOf('!isPaidPayment(payment)')
  const grantIndex = activation.indexOf('const grantResult = await createPurchaseGrantOnce')
  if (unpaidIndex === -1 || grantIndex === -1 || unpaidIndex > grantIndex) {
    errors.push('unpaid payment branch must be checked before createPurchaseGrantOnce')
  }
  for (const forbidden of ['successUrl', 'localStorage', 'sessionStorage', 'r2Key', 'publicUrl']) {
    if (activation.includes(forbidden)) errors.push(`paymentActivation.ts must not contain ${forbidden}`)
  }
  if (!db.includes('findPurchaseOrderByPaymentKey')) errors.push('db.ts missing paymentKey idempotency helper')
  if (!db.includes('findPurchaseGrantByOrderProduct')) errors.push('db.ts missing order/product grant idempotency helper')
  if (!db.includes('createPurchaseGrantOnce')) errors.push('db.ts missing createPurchaseGrantOnce')
  if (!migration.includes('idx_purchase_grants_order_product')) errors.push('migration missing order/product unique index')
  if (!docs.includes('결제 성공 화면은 구매 권한을 증명하지 않습니다')) errors.push('payment activation docs missing frontend trust boundary copy')
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR ${error}`)
  process.exit(1)
}

console.log('[smoke:payment-grant-flow] OK payment webhook activation creates grants only after server-side verification')
