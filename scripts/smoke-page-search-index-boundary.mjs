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

run('search:generate-public-index', ['scripts/generate-page-search-index.mjs'])
run('search:generate-internal-docs-index', ['scripts/generate-internal-docs-search-index.mjs'])

const publicPath = 'src/content/generated/page-search-index.json'
const internalPath = 'src/content/generated/internal-docs-search-index.json'
for (const file of [
  publicPath,
  internalPath,
  'scripts/generate-internal-docs-search-index.mjs',
  'scripts/smoke-page-search-index-boundary.mjs',
  'docs/authoring/page-search-visibility.md',
  'docs/migration/commit-133.md',
  'BAKE_REPORT_COMMIT_133.md',
]) {
  if (!exists(file)) fail(`Missing required file: ${file}`)
}

const publicIndex = JSON.parse(read(publicPath))
const internalIndex = JSON.parse(read(internalPath))
const publicSerialized = JSON.stringify(publicIndex)
const internalSerialized = JSON.stringify(internalIndex)

if (publicIndex.visibility !== 'public') fail('Public search index has wrong visibility marker.')
if (internalIndex.visibility !== 'internal-docs') fail('Internal docs search index has wrong visibility marker.')
if ((publicIndex.summary?.docs || 0) !== 0) fail('Public search index still contains docs summary count.')
if ((internalIndex.summary?.authoring || 0) <= 0) fail('Internal docs search index must contain authoring docs.')
if ((internalIndex.summary?.migration || 0) <= 0) fail('Internal docs search index must contain migration docs.')
if ((internalIndex.summary?.reports || 0) <= 0) fail('Internal docs search index must contain bake reports.')

for (const fragment of ['docs/authoring', 'docs/migration', 'BAKE_REPORT_COMMIT']) {
  if (publicSerialized.includes(fragment)) fail(`Internal docs leaked into public search index: ${fragment}`)
  if (!internalSerialized.includes(fragment)) fail(`Internal docs index missing expected fragment: ${fragment}`)
}

for (const fragment of ['/checkout/success', '/checkout/fail', '/qa/ewa-gallery', '/claim', '/products/dummy-catalog', '/products/spec-playground', '/works/editorial-showcase']) {
  if (publicSerialized.includes(fragment)) fail(`Forbidden route leaked into public search index: ${fragment}`)
}

const pkg = JSON.parse(read('package.json'))
if (pkg.scripts?.['search:generate-internal-docs-index'] !== 'node scripts/generate-internal-docs-search-index.mjs') fail('package.json missing search:generate-internal-docs-index script.')
if (pkg.scripts?.['search:generate'] !== 'npm run search:generate-public-index && npm run search:generate-internal-docs-index') fail('package.json missing search:generate aggregate script.')
if (pkg.scripts?.['smoke:page-search-index-boundary'] !== 'node scripts/smoke-page-search-index-boundary.mjs') fail('package.json missing smoke:page-search-index-boundary script.')
if (!read('scripts/check-launch.mjs').includes('smoke-page-search-index-boundary.mjs')) fail('check-launch missing page search index boundary smoke.')

for (const file of [publicPath, internalPath, 'package.json', 'scripts/check-launch.mjs']) {
  if (exists(file) && read(file).includes(objectLeakToken)) fail(`Object serialization leak detected in ${file}`)
}

if (failures.length) {
  console.error('[smoke:page-search-index-boundary] failed')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[smoke:page-search-index-boundary] OK')
console.log(`- public search pages: ${publicIndex.pages.length}`)
console.log(`- internal docs pages: ${internalIndex.pages.length}`)
