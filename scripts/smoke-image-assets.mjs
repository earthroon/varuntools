#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

function fail(message) {
  console.error(`[smoke:image-assets] FAIL ${message}`)
  process.exit(1)
}

function read(file) {
  if (!existsSync(file)) fail(`missing ${file}`)
  return readFileSync(file, 'utf8')
}

const packageJson = JSON.parse(read('package.json'))
const scripts = packageJson.scripts || {}

if (scripts['audit:images'] !== 'node scripts/audit-images.mjs') fail('package.json missing audit:images script')
if (scripts['smoke:image-assets'] !== 'node scripts/smoke-image-assets.mjs') fail('package.json missing smoke:image-assets script')
if (!String(scripts['audit:content'] || '').includes('audit:images')) fail('audit:content must include audit:images')

const checkLaunch = read('scripts/check-launch.mjs')
const auditAssetsIndex = checkLaunch.indexOf('scripts/audit-assets.mjs')
const smokeAssetsIndex = checkLaunch.indexOf('scripts/smoke-asset-registry.mjs')
const auditImagesIndex = checkLaunch.indexOf('scripts/audit-images.mjs')
const smokeImageIndex = checkLaunch.indexOf('scripts/smoke-image-assets.mjs')

if (auditImagesIndex < 0) fail('check-launch missing audit:images step')
if (smokeImageIndex < 0) fail('check-launch missing smoke:image-assets step')
if (!(auditAssetsIndex < smokeAssetsIndex && smokeAssetsIndex < auditImagesIndex && auditImagesIndex < smokeImageIndex)) {
  fail('check-launch image audit order must be audit:assets -> smoke:assets -> audit:images -> smoke:image-assets')
}

const requiredDocs = [
  'docs/authoring/image-assets.md',
  'docs/migration/commit-51.md',
  'BAKE_REPORT_COMMIT_51.md',
]
for (const file of requiredDocs) read(file)

const imageDoc = read('docs/authoring/image-assets.md')
for (const token of ['kebab-case', 'cover.webp', 'thumbnail', 'warning', 'webp']) {
  if (!imageDoc.includes(token)) fail(`image-assets doc missing ${token}`)
}

const auditScript = read('scripts/audit-images.mjs')
for (const token of ['SIZE_LIMITS', 'gallery-thumb-missing', 'prefer-webp', 'missing-product-representative-image']) {
  if (!auditScript.includes(token)) fail(`audit-images script missing ${token}`)
}

const auditResult = spawnSync('node', ['scripts/audit-images.mjs'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
})

if (auditResult.status !== 0) {
  process.stdout.write(auditResult.stdout || '')
  process.stderr.write(auditResult.stderr || '')
  fail('audit:images should complete in warning mode')
}

if (!String(auditResult.stdout || '').includes('Image Audit')) fail('audit:images output missing header')
if (!String(auditResult.stdout || '').includes('[audit:images] OK')) fail('audit:images output missing OK marker')

console.log('[smoke:image-assets] OK image asset guard scripts, docs, and launch wiring are present')
