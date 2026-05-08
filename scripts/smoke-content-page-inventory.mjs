#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const root = process.cwd()
const requiredFiles = [
  'scripts/generate-content-page-inventory.mjs',
  'scripts/smoke-content-page-inventory.mjs',
  'docs/authoring/content-page-inventory.md',
  'docs/migration/commit-127.md',
  'BAKE_REPORT_COMMIT_127.md',
]
const failures = []
function assert(condition, message) {
  if (!condition) failures.push(message)
}
function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

for (const file of requiredFiles) assert(fs.existsSync(path.join(root, file)), `${file} must exist`)

const generate = spawnSync('node', ['scripts/generate-content-page-inventory.mjs'], { cwd: root, stdio: 'inherit' })
assert(generate.status === 0, 'content page inventory generator must pass without hard errors')

const jsonFile = 'generated/page-inventory.json'
const mdFile = 'generated/page-inventory.md'
assert(fs.existsSync(path.join(root, jsonFile)), 'generated/page-inventory.json must exist')
assert(fs.existsSync(path.join(root, mdFile)), 'generated/page-inventory.md must exist')

const inventory = JSON.parse(read(jsonFile))
const sources = new Set(inventory.pages.map((page) => page.source))
const warningCodes = new Set(inventory.warnings.map((issue) => issue.code))
const errorCodes = new Set(inventory.errors.map((issue) => issue.code))
const generatorSource = read('scripts/generate-content-page-inventory.mjs')
const packageJson = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')
const mdReport = read(mdFile)

assert(inventory.summary.total > 0, 'inventory summary must include pages')
assert(typeof inventory.summary.public === 'number', 'inventory summary must include public count')
assert(typeof inventory.summary.hidden === 'number', 'inventory summary must include hidden count')
assert(typeof inventory.summary.noindex === 'number', 'inventory summary must include noindex count')
assert(typeof inventory.summary.featured === 'number', 'inventory summary must include featured count')
assert(sources.has('src/content/pages/works/index.md'), 'inventory must include works/index.md')
assert(sources.has('src/content/pages/works/varuntools-showroom/index.md'), 'inventory must include varuntools showroom page')
assert(sources.has('src/content/pages/works/editorial-showcase/index.md'), 'inventory must include editorial showcase page')
assert(generatorSource.includes('ROUTE_SLUG_MISMATCH'), 'route/slug mismatch warning contract must exist')
assert(generatorSource.includes('HIDDEN_FEATURED_PAGE'), 'hidden featured page error contract must exist')
assert(generatorSource.includes('PUBLIC_DUMMY_PAGE'), 'public dummy warning contract must exist')
assert(generatorSource.includes('PUBLIC_PLAYGROUND_PAGE'), 'public playground warning contract must exist')
assert(generatorSource.includes('CHECKOUT_PAGE_INDEXABLE'), 'checkout noindex warning contract must exist')
assert(generatorSource.includes('OBJECT_OBJECT_LEAK'), 'object leak guard must exist')
assert(!errorCodes.has('OBJECT_OBJECT_LEAK'), 'inventory must not include object object leak errors')
assert(packageJson.scripts['content:page-inventory'] === 'node scripts/generate-content-page-inventory.mjs', 'package.json must contain content:page-inventory')
assert(packageJson.scripts['smoke:content-page-inventory'] === 'node scripts/smoke-content-page-inventory.mjs', 'package.json must contain smoke:content-page-inventory')
assert(checkLaunch.includes('smoke:content-page-inventory'), 'check:launch must include smoke:content-page-inventory')
assert(mdReport.includes('## Public Pages'), 'markdown inventory must include public pages report')
assert(mdReport.includes('## Hidden / Private / Draft Pages'), 'markdown inventory must include hidden/private/draft report')
assert(mdReport.includes('## Noindex Pages'), 'markdown inventory must include noindex report')
assert(mdReport.includes('## Featured Pages'), 'markdown inventory must include featured report')

const scannedFiles = [
  ...requiredFiles,
  jsonFile,
  mdFile,
  'package.json',
  'scripts/check-launch.mjs',
]
for (const file of scannedFiles) {
  const objectLeakToken = `[object ${'Object'}]`
  assert(!read(file).includes(objectLeakToken), `${file} must not contain object serialization leak`)
}

if (failures.length) {
  console.error('[smoke:content-page-inventory] FAIL')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('[smoke:content-page-inventory] PASS')
