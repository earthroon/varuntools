#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const requiredFiles = [
  'workers/delivery/wrangler.toml',
  'workers/delivery/package.json',
  'workers/delivery/src/index.ts',
  'workers/delivery/src/env.ts',
  'workers/delivery/src/types.ts',
  'workers/delivery/src/grants.ts',
  'workers/delivery/src/r2.ts',
  'workers/delivery/src/generated/product-delivery-manifest.json',
  'docs/authoring/cloudflare-delivery-worker.md',
  'docs/migration/commit-68.md',
]

const errors = []
function file(pathname) { return path.join(root, pathname) }
function expect(condition, message) { if (!condition) errors.push(message) }

for (const item of requiredFiles) expect(existsSync(file(item)), `Missing required file: ${item}`)

if (existsSync(file('workers/delivery/src/index.ts'))) {
  const worker = readFileSync(file('workers/delivery/src/index.ts'), 'utf8')
  const envSource = existsSync(file('workers/delivery/src/env.ts')) ? readFileSync(file('workers/delivery/src/env.ts'), 'utf8') : ''
  const allWorkerSource = worker + '\n' + envSource
  expect(allWorkerSource.includes('GRANT_VALIDATION_NOT_CONFIGURED'), 'Worker must block downloads while grant validation is not configured.')
  expect(allWorkerSource.includes('VARUNTOOLS_PRODUCT_BUCKET'), 'Worker contract must reference the R2 bucket binding name.')
  expect(!allWorkerSource.includes('gateCode'), 'Worker contract must not use inquiry gateCode as delivery authorization.')
  expect(worker.includes('/health'), 'Worker should expose /health route.')
  expect(worker.includes('/download'), 'Worker should expose /download route contract.')
}

if (existsSync(file('workers/delivery/wrangler.toml'))) {
  const wrangler = readFileSync(file('workers/delivery/wrangler.toml'), 'utf8')
  expect(wrangler.includes('[[r2_buckets]]'), 'wrangler.toml must declare [[r2_buckets]].')
  expect(wrangler.includes('binding = "VARUNTOOLS_PRODUCT_BUCKET"'), 'wrangler.toml must declare VARUNTOOLS_PRODUCT_BUCKET binding.')
}

if (existsSync(file('workers/delivery/src/generated/product-delivery-manifest.json'))) {
  const raw = readFileSync(file('workers/delivery/src/generated/product-delivery-manifest.json'), 'utf8')
  const manifest = JSON.parse(raw)
  expect(manifest.schemaVersion === 1, 'Delivery manifest schemaVersion must be 1.')
  expect(Array.isArray(manifest.products), 'Delivery manifest products must be an array.')
  expect(manifest.products.length >= 2, 'Delivery manifest should include current product package manifests.')
  for (const product of manifest.products) {
    expect(product.delivery?.provider === 'cloudflare-r2', `Product ${product.slug} must use cloudflare-r2 delivery provider.`)
    expect(product.delivery?.access === 'private', `Product ${product.slug} must use private delivery access.`)
    expect(!JSON.stringify(product).includes('publicUrl'), `Product ${product.slug} delivery manifest must not include publicUrl.`)
    expect(!JSON.stringify(product).includes('downloadUrl'), `Product ${product.slug} delivery manifest must not include downloadUrl.`)
  }
}

if (errors.length) {
  console.error('Delivery Worker Contract Smoke')
  for (const error of errors) console.error(`ERROR ${error}`)
  console.error('[smoke:delivery-worker] FAILED')
  process.exit(1)
}

console.log('Delivery Worker Contract Smoke')
console.log('[smoke:delivery-worker] OK Cloudflare R2 delivery worker contract is wired')
