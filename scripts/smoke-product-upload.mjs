#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const required = [
  'src/config/productUpload.ts',
  'scripts/audit-product-upload.mjs',
  'src/content/pages/products/dummy-catalog/product.manifest.json',
  'src/content/pages/products/spec-playground/product.manifest.json',
  'docs/authoring/product-upload.md',
  'docs/authoring/cloudflare-product-delivery.md',
  'docs/migration/commit-67.md',
]

const errors = []
function read(rel) {
  const file = path.join(root, rel)
  if (!existsSync(file)) {
    errors.push(`Missing required file: ${rel}`)
    return ''
  }
  return readFileSync(file, 'utf8')
}

for (const file of required) read(file)

const dummy = read('src/content/pages/products/dummy-catalog/product.manifest.json')
const spec = read('src/content/pages/products/spec-playground/product.manifest.json')
const audit = read('scripts/audit-product-upload.mjs')
const productUploadDoc = read('docs/authoring/product-upload.md')
const cloudflareDoc = read('docs/authoring/cloudflare-product-delivery.md')
const packageJson = read('package.json')
const checkLaunch = read('scripts/check-launch.mjs')

for (const [label, raw] of [['dummy-catalog', dummy], ['spec-playground', spec]]) {
  if (!raw.includes('"isDemo": true')) errors.push(`${label} manifest must mark isDemo=true.`)
  if (!raw.includes('"provider": "cloudflare-r2"')) errors.push(`${label} manifest must use Cloudflare R2 delivery provider.`)
  if (!raw.includes('"mode": "post-purchase"')) errors.push(`${label} manifest must use post-purchase delivery mode.`)
  if (raw.includes('"publicUrl"') || raw.includes('"downloadUrl"')) errors.push(`${label} manifest must not expose public download URL fields.`)
}

if (!audit.includes('public-download-url-forbidden')) errors.push('audit-product-upload must forbid public download URLs.')
if (!audit.includes('readyForCheckout')) errors.push('audit-product-upload must validate readyForCheckout.')
if (!productUploadDoc.includes('product.manifest.json')) errors.push('product-upload doc must describe manifest SSOT.')
if (!cloudflareDoc.includes('post-purchase')) errors.push('cloudflare delivery doc must describe post-purchase delivery.')
if (!packageJson.includes('"audit:product-upload"')) errors.push('package.json must expose audit:product-upload.')
if (!packageJson.includes('"smoke:product-upload"')) errors.push('package.json must expose smoke:product-upload.')
if (!checkLaunch.includes('audit-product-upload.mjs')) errors.push('check-launch must include audit:product-upload.')
if (!checkLaunch.includes('smoke-product-upload.mjs')) errors.push('check-launch must include smoke:product-upload.')

if (errors.length) {
  console.error('[smoke:product-upload] FAILED')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('[smoke:product-upload] OK product upload SSOT is wired')
