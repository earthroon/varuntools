#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import process from 'node:process'

const requiredFiles = [
  'scripts/product-sync.mjs',
  'docs/authoring/product-manifest-page-sync.md',
  'docs/migration/commit-75.md',
]

const failures = []
function expect(condition, message) {
  if (!condition) failures.push(message)
}
function read(file) {
  return readFileSync(file, 'utf8')
}

for (const file of requiredFiles) expect(existsSync(file), `missing required file: ${file}`)

const pkg = JSON.parse(read('package.json'))
const scripts = pkg.scripts || {}
expect(scripts['product:sync-check'] === 'node scripts/product-sync.mjs --check', 'package.json must define product:sync-check as a no-write check')
expect(scripts['product:sync'] === 'node scripts/product-sync.mjs --write', 'package.json must define product:sync as explicit write command')
expect(scripts['smoke:product-sync'] === 'node scripts/smoke-product-sync.mjs', 'package.json must define smoke:product-sync')

const productSync = read('scripts/product-sync.mjs')
for (const token of [
  'product.manifest.json',
  'index.md',
  '--check',
  '--write',
  'manifest.slug',
  'folder slug',
  'readyForCatalog',
  'isDemo',
  'visibility',
  'checkoutProvider',
  'checkoutMode',
  'successUrl',
  'failUrl',
  'claimRedirect',
  'Refusing to sync private or runtime-only field',
]) {
  expect(productSync.includes(token), `product-sync.mjs missing token: ${token}`)
}

const checkLaunch = read('scripts/check-launch.mjs')
expect(checkLaunch.includes("scripts/smoke-product-sync.mjs"), 'check-launch must include smoke:product-sync')
expect(checkLaunch.includes("'scripts/product-sync.mjs', '--check'"), 'check-launch must include product:sync-check')
expect(!checkLaunch.includes("'scripts/product-sync.mjs', '--write'"), 'check-launch must not run product:sync --write')

const allowedMapMatch = productSync.match(/const SYNC_FIELD_MAP = \[([\s\S]*?)\n\]/)
expect(Boolean(allowedMapMatch), 'product-sync must expose SYNC_FIELD_MAP')
const allowedMap = allowedMapMatch ? allowedMapMatch[1] : ''
for (const forbidden of ['r2Key', 'privatePath', 'internalPath', 'downloadUrl', 'publicUrl', 'grantId', 'paymentKey', 'webhookEventId', 'purchaseOrderId', 'buyerEmail']) {
  expect(!allowedMap.includes(forbidden), `SYNC_FIELD_MAP must not include forbidden field: ${forbidden}`)
  expect(productSync.includes(`'${forbidden}'`), `product-sync should explicitly forbid ${forbidden}`)
}

for (const docFile of ['docs/authoring/product-manifest-page-sync.md', 'docs/migration/commit-75.md']) {
  const doc = read(docFile)
  for (const token of ['product:sync-check', 'product:sync', 'no silent auto-fix', 'explicit write only', 'r2Key', 'privatePath', 'downloadUrl', 'publicUrl']) {
    expect(doc.includes(token), `${docFile} missing token: ${token}`)
  }
}

if (failures.length) {
  console.error('[smoke:product-sync] FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[smoke:product-sync] OK product manifest/page sync gate is wired')
