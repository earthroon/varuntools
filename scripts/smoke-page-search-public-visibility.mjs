#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const root = process.cwd()
const failures = []
const objectLeakToken = '[' + 'object Object' + ']'
function fail(message) { failures.push(message) }
function fullPath(relativePath) { return path.join(root, relativePath) }
function read(relativePath) { return fs.readFileSync(fullPath(relativePath), 'utf8') }
function exists(relativePath) { return fs.existsSync(fullPath(relativePath)) }
function run(label, args) {
  const result = spawnSync('node', args, { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) fail(`${label} failed: ${result.stderr || result.stdout}`)
}

run('content:page-inventory', ['scripts/generate-content-page-inventory.mjs'])
run('search:generate-public-index', ['scripts/generate-page-search-index.mjs'])

const requiredFiles = [
  'scripts/generate-page-search-index.mjs',
  'scripts/lib/page-search-index.mjs',
  'src/content/contentVisibility.ts',
  'src/search/searchVisibility.ts',
  'src/search/searchIndexCandidates.ts',
  'src/content/generated/page-search-index.json',
  'docs/authoring/page-search-visibility.md',
  'docs/migration/commit-133.md',
  'BAKE_REPORT_COMMIT_133.md',
]
for (const file of requiredFiles) if (!exists(file)) fail(`Missing required file: ${file}`)

const index = JSON.parse(read('src/content/generated/page-search-index.json'))
const pages = index.pages || []
const hrefs = new Set(pages.map((entry) => entry.href))
const sources = pages.map((entry) => String(entry.sourcePath || ''))

if (index.visibility !== 'public') fail('page-search-index visibility must be public.')
if (!Array.isArray(pages)) fail('page-search-index pages must be an array.')
if (index.summary?.docs !== 0) fail('public page-search-index must not count authoring docs.')

for (const href of ['/', '/works', '/works/varuntools-showroom', '/products']) {
  if (!hrefs.has(href)) fail(`Expected public search href missing: ${href}`)
}

const forbiddenFragments = [
  'docs/authoring',
  'docs/migration',
  'BAKE_REPORT',
  '/works/editorial-showcase',
  '/products/dummy-catalog',
  '/products/spec-playground',
  '/checkout/success',
  '/checkout/fail',
  '/qa/ewa-gallery',
  '/claim',
  '/inquiry',
]
for (const fragment of forbiddenFragments) {
  if (JSON.stringify(index).includes(fragment)) fail(`Forbidden public search leak detected: ${fragment}`)
}

for (const source of sources) {
  if (source.startsWith('docs/')) fail(`Docs source leaked into public search: ${source}`)
}

const visibilitySource = read('src/content/contentVisibility.ts')
for (const token of ['shouldIncludeInSearchIndex', "page.section === 'policies'", "page.section === 'claim'", "page.section === 'inquiry'"]) {
  if (!visibilitySource.includes(token)) fail(`contentVisibility.ts missing ${token}`)
}

const libSource = read('scripts/lib/page-search-index.mjs')
for (const token of ['shouldIncludeInventoryPageInPublicSearch', 'readInternalDocsSearchSources', 'buildAndWriteInternalDocsSearchIndex']) {
  if (!libSource.includes(token)) fail(`page-search-index lib missing ${token}`)
}

const pkg = JSON.parse(read('package.json'))
if (pkg.scripts?.['search:generate-public-index'] !== 'node scripts/generate-page-search-index.mjs') fail('package.json missing search:generate-public-index script.')
if (pkg.scripts?.['smoke:page-search-public-visibility'] !== 'node scripts/smoke-page-search-public-visibility.mjs') fail('package.json missing smoke:page-search-public-visibility script.')
if (!read('scripts/check-launch.mjs').includes('smoke-page-search-public-visibility.mjs')) fail('check-launch missing page search public visibility smoke.')

for (const file of requiredFiles.concat(['package.json', 'scripts/check-launch.mjs'])) {
  if (exists(file) && read(file).includes(objectLeakToken)) fail(`Object serialization leak detected in ${file}`)
}

if (failures.length) {
  console.error('[smoke:page-search-public-visibility] failed')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[smoke:page-search-public-visibility] OK')
console.log(`- public search pages: ${pages.length}`)
console.log('- docs/authoring, docs/migration, bake reports, hidden/noindex/checkout/QA/dummy/playground/editorial-preview are excluded')
