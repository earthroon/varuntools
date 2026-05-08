#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const root = process.cwd()
const failures = []
const objectLeakToken = '[' + 'object Object' + ']'

function fail(message) {
  failures.push(message)
}

function fullPath(relativePath) {
  return path.join(root, relativePath)
}

function exists(relativePath) {
  return fs.existsSync(fullPath(relativePath))
}

function read(relativePath) {
  return fs.readFileSync(fullPath(relativePath), 'utf8')
}

function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) {
    fail(`${label} failed: ${result.stderr || result.stdout}`)
  }
}

run('content:page-inventory', 'node', ['scripts/generate-content-page-inventory.mjs'])
run('seo:generate-sitemap', 'node', ['scripts/generate-sitemap.mjs'])
run('seo:generate-robots', 'node', ['scripts/generate-robots.mjs'])
run('search:generate-public-index', 'node', ['scripts/generate-page-search-index.mjs'])
run('search:generate-internal-docs-index', 'node', ['scripts/generate-internal-docs-search-index.mjs'])

const requiredFiles = [
  'scripts/smoke-content-page-inventory-clean.mjs',
  'generated/page-inventory.json',
  'generated/page-inventory.md',
  'generated/sitemap.xml',
  'generated/robots.txt',
  'src/content/generated/page-search-index.json',
  'src/content/pages/wiper/index.md',
  'src/content/pages/lab-markdown-gallery/index.md',
  'src/content/pages/works/index.md',
  'src/content/pages/products/dummy-catalog/index.md',
  'src/content/pages/products/spec-playground/index.md',
  'docs/migration/commit-134.md',
  'BAKE_REPORT_COMMIT_134.md',
]

for (const file of requiredFiles) {
  if (!exists(file)) fail(`Missing required file: ${file}`)
}

const inventory = JSON.parse(read('generated/page-inventory.json'))
const warnings = inventory.warnings || []
const errors = inventory.errors || []
const pages = inventory.pages || []
const bySource = new Map(pages.map((page) => [page.source, page]))

const expectedSlugMatches = [
  ['src/content/pages/wiper/index.md', 'wiper', '/wiper'],
  ['src/content/pages/lab-markdown-gallery/index.md', 'lab-markdown-gallery', '/lab-markdown-gallery'],
  ['src/content/pages/works/index.md', 'works', '/works'],
]
for (const [source, slug, routePath] of expectedSlugMatches) {
  const page = bySource.get(source)
  if (!page) fail(`Inventory missing ${source}`)
  if (page && page.slug !== slug) fail(`${source} slug should be ${slug}, got ${page.slug}`)
  if (page && page.routePath !== routePath) fail(`${source} routePath should be ${routePath}, got ${page.routePath}`)
}

for (const source of [
  'src/content/pages/products/dummy-catalog/index.md',
  'src/content/pages/products/spec-playground/index.md',
]) {
  const page = bySource.get(source)
  if (!page) fail(`Inventory missing ${source}`)
  if (page && page.visibility !== 'hidden') fail(`${source} should be hidden, got ${page.visibility}`)
  if (page && page.noindex !== true) fail(`${source} should be noindex`)
  if (page && page.featured !== false) fail(`${source} should not be featured`)
}

for (const [code, source] of [
  ['ROUTE_SLUG_MISMATCH', 'src/content/pages/wiper/index.md'],
  ['ROUTE_SLUG_MISMATCH', 'src/content/pages/lab-markdown-gallery/index.md'],
  ['ROUTE_SLUG_MISMATCH', 'src/content/pages/works/index.md'],
  ['PUBLIC_DUMMY_PAGE', 'src/content/pages/products/dummy-catalog/index.md'],
  ['PUBLIC_PLAYGROUND_PAGE', 'src/content/pages/products/spec-playground/index.md'],
]) {
  if (warnings.some((issue) => issue.code === code && issue.source === source)) {
    fail(`Resolved warning still present: ${code} ${source}`)
  }
}

if (errors.length > 0) fail(`Page inventory should have no hard errors, found ${errors.length}`)
if ((inventory.summary?.warnings ?? 0) !== warnings.length) fail('Inventory summary warning count must match warning list')
if ((inventory.summary?.errors ?? 0) !== errors.length) fail('Inventory summary error count must match error list')

const sitemap = exists('generated/sitemap.xml') ? read('generated/sitemap.xml') : ''
const publicSearch = exists('src/content/generated/page-search-index.json') ? read('src/content/generated/page-search-index.json') : ''
const navSource = [
  exists('src/navigation/pageIndex.ts') ? read('src/navigation/pageIndex.ts') : '',
  exists('src/navigation/sectionNavigation.ts') ? read('src/navigation/sectionNavigation.ts') : '',
].join('\n')

for (const forbidden of ['/products/dummy-catalog', '/products/spec-playground']) {
  if (sitemap.includes(forbidden)) fail(`Sitemap should not contain ${forbidden}`)
  if (publicSearch.includes(forbidden)) fail(`Public search should not contain ${forbidden}`)
  if (navSource.includes(forbidden)) fail(`Public navigation source should not contain ${forbidden}`)
}

const pkg = JSON.parse(read('package.json'))
if (pkg.scripts?.['smoke:content-page-inventory-clean'] !== 'node scripts/smoke-content-page-inventory-clean.mjs') {
  fail('package.json missing smoke:content-page-inventory-clean script')
}
if (!read('scripts/check-launch.mjs').includes('smoke-content-page-inventory-clean.mjs')) {
  fail('check-launch missing smoke-content-page-inventory-clean')
}

for (const file of requiredFiles.concat(['package.json', 'scripts/check-launch.mjs'])) {
  if (exists(file) && read(file).includes(objectLeakToken)) fail(`Object serialization leak detected in ${file}`)
}

if (failures.length > 0) {
  console.error('[smoke:content-page-inventory-clean] failed')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[smoke:content-page-inventory-clean] OK')
console.log('- target route/slug mismatch warnings are resolved')
console.log('- dummy/spec playground pages are hidden and noindex')
console.log('- dummy/spec playground routes are excluded from sitemap, public search, and navigation')
