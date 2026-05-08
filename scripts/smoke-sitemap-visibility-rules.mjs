#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const root = process.cwd()
const failures = []
const warnings = []
const objectLeakToken = '[' + 'object Object' + ']'

function fail(message) {
  failures.push(message)
}

function warn(message) {
  warnings.push(message)
}

function fullPath(relativePath) {
  return path.join(root, relativePath)
}

function read(relativePath) {
  return fs.readFileSync(fullPath(relativePath), 'utf8')
}

function assertFile(relativePath) {
  if (!fs.existsSync(fullPath(relativePath))) fail(`Missing required file: ${relativePath}`)
}

const generator = spawnSync('node', ['scripts/generate-content-page-inventory.mjs'], {
  cwd: root,
  encoding: 'utf8',
})
if (generator.status !== 0) {
  fail(`content:page-inventory failed before sitemap smoke: ${generator.stderr || generator.stdout}`)
}

const requiredFiles = [
  'src/content/contentVisibility.ts',
  'src/sitemap/sitemapVisibility.ts',
  'src/sitemap/sitemapCandidates.ts',
  'scripts/smoke-sitemap-visibility-rules.mjs',
  'generated/page-inventory.json',
  'docs/authoring/sitemap-search-visibility.md',
  'docs/migration/commit-131.md',
  'BAKE_REPORT_COMMIT_131.md',
]
requiredFiles.forEach(assertFile)

const visibilitySource = read('src/content/contentVisibility.ts')
for (const token of [
  'ContentVisibilitySurface',
  'shouldIncludeInSitemap',
  'shouldIncludeInSearchIndex',
  'isInternalPreviewPage',
  'isDummyOrPlaygroundPage',
  "page.section === 'checkout'",
  "page.section === 'qa'",
]) {
  if (!visibilitySource.includes(token)) fail(`contentVisibility.ts missing ${token}`)
}

const sitemapSource = read('src/sitemap/sitemapCandidates.ts')
for (const token of ['getSitemapCandidates', 'shouldIncludeInSitemap', 'href: page.routePath']) {
  if (!sitemapSource.includes(token)) fail(`sitemapCandidates.ts missing ${token}`)
}

const inventory = JSON.parse(read('generated/page-inventory.json'))
const pages = inventory.pages || []

function isInternalPreviewPage(page) {
  const haystack = `${page.source || ''} ${page.routePath || ''} ${page.slug || ''}`.toLowerCase()
  return haystack.includes('editorial-showcase') || haystack.includes('visual-qa')
}

function isDummyOrPlaygroundPage(page) {
  const haystack = `${page.source || ''} ${page.routePath || ''} ${page.slug || ''}`.toLowerCase()
  return /dummy|playground|spec/.test(haystack)
}

function shouldIncludeInSitemap(page) {
  if (page.visibility && page.visibility !== 'public') return false
  if (page.status && page.status !== 'active') return false
  if (page.noindex) return false
  if (page.section === 'checkout') return false
  if (page.section === 'qa') return false
  if (isInternalPreviewPage(page)) return false
  if (isDummyOrPlaygroundPage(page)) return false
  return true
}

const candidates = pages.filter(shouldIncludeInSitemap)
const candidateRoutes = new Set(candidates.map((page) => page.routePath))

const forbiddenRoutes = [
  '/works/editorial-showcase',
  '/products/dummy-catalog',
  '/products/spec-playground',
  '/checkout/success',
  '/checkout/fail',
  '/qa/ewa-gallery',
]
for (const route of forbiddenRoutes) {
  if (candidateRoutes.has(route)) fail(`Forbidden route leaked into sitemap candidates: ${route}`)
}

for (const page of pages) {
  const included = candidateRoutes.has(page.routePath)
  if (included && page.visibility && page.visibility !== 'public') fail(`Sitemap includes non-public page: ${page.routePath}`)
  if (included && page.status && page.status !== 'active') fail(`Sitemap includes non-active page: ${page.routePath}`)
  if (included && page.noindex) fail(`Sitemap includes noindex page: ${page.routePath}`)
  if (included && page.section === 'checkout') fail(`Sitemap includes checkout page: ${page.routePath}`)
  if (included && page.section === 'qa') fail(`Sitemap includes QA page: ${page.routePath}`)
  if (included && isDummyOrPlaygroundPage(page)) fail(`Sitemap includes dummy/playground/spec page: ${page.routePath}`)

  if (!included && page.visibility === 'public' && page.status === 'active' && !page.noindex && page.section === 'works' && !isInternalPreviewPage(page)) {
    warn(`Public work page is missing from sitemap candidates: ${page.routePath}`)
  }
}

for (const route of ['/', '/works', '/works/varuntools-showroom']) {
  if (!candidateRoutes.has(route)) fail(`Expected public route missing from sitemap candidates: ${route}`)
}

const pkg = JSON.parse(read('package.json'))
if (pkg.scripts?.['smoke:sitemap-visibility-rules'] !== 'node scripts/smoke-sitemap-visibility-rules.mjs') {
  fail('package.json missing smoke:sitemap-visibility-rules script.')
}
if (!read('scripts/check-launch.mjs').includes('smoke-sitemap-visibility-rules.mjs')) {
  fail('scripts/check-launch.mjs does not include smoke-sitemap-visibility-rules.')
}

for (const file of requiredFiles.concat(['package.json', 'scripts/check-launch.mjs'])) {
  if (fs.existsSync(fullPath(file)) && read(file).includes(objectLeakToken)) fail(`Object serialization leak detected in ${file}`)
}

if (warnings.length > 0) {
  console.warn('[smoke:sitemap-visibility-rules] warnings')
  for (const warning of warnings) console.warn(`- ${warning}`)
}

if (failures.length > 0) {
  console.error('[smoke:sitemap-visibility-rules] failed')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[smoke:sitemap-visibility-rules] OK')
console.log(`- inventory pages: ${pages.length}`)
console.log(`- sitemap candidates: ${candidates.length}`)
console.log('- hidden/noindex/checkout/QA/dummy/playground/editorial preview pages are excluded')
