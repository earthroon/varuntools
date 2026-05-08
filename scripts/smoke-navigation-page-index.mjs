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

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assertFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    fail(`Missing required file: ${relativePath}`)
  }
}

function loadPageIndex() {
  const source = read('src/navigation/pageIndex.ts')
  const js = source
    .replace(/^import[^\n]*\n/gm, '')
    .replace(/export const pageIndex\s*=/, 'const pageIndex =')
    .replace(/\s+as const satisfies readonly NavigationItem\[\]/, '')
  try {
    return Function(`${js}\nreturn pageIndex`)()
  } catch (error) {
    fail(`Could not parse src/navigation/pageIndex.ts: ${error.message}`)
    return []
  }
}

function hasObjectLeak(relativePath) {
  return read(relativePath).includes(objectLeakToken)
}

const generator = spawnSync('node', ['scripts/generate-content-page-inventory.mjs'], {
  cwd: root,
  encoding: 'utf8',
})
if (generator.status !== 0) {
  fail(`content:page-inventory failed before navigation smoke: ${generator.stderr || generator.stdout}`)
}

const requiredFiles = [
  'src/navigation/navigationTypes.ts',
  'src/navigation/pageIndex.ts',
  'src/navigation/sectionNavigation.ts',
  'src/navigation/navigationVisibility.ts',
  'scripts/smoke-navigation-page-index.mjs',
  'generated/page-inventory.json',
  'docs/authoring/navigation-page-index.md',
  'docs/migration/commit-128.md',
  'BAKE_REPORT_COMMIT_128.md',
]
requiredFiles.forEach(assertFile)

const pageIndex = loadPageIndex()
const inventory = JSON.parse(read('generated/page-inventory.json'))
const byRoute = new Map(inventory.pages.map((page) => [page.routePath, page]))

if (!Array.isArray(pageIndex) || pageIndex.length === 0) {
  fail('pageIndex must contain at least one navigation item.')
}

const ids = new Set()
const hrefs = new Set()
for (const item of pageIndex) {
  if (!item.id) fail('Navigation item is missing id.')
  if (!item.label) fail(`Navigation item ${item.id || '(unknown)'} is missing label.`)
  if (!item.href) fail(`Navigation item ${item.id || '(unknown)'} is missing href.`)
  if (!Array.isArray(item.surface) || item.surface.length === 0) fail(`Navigation item ${item.id} is missing surface.`)
  if (typeof item.order !== 'number') fail(`Navigation item ${item.id} is missing numeric order.`)
  if (ids.has(item.id)) fail(`Duplicate navigation id: ${item.id}`)
  if (hrefs.has(item.href)) fail(`Duplicate navigation href: ${item.href}`)
  ids.add(item.id)
  hrefs.add(item.href)

  const page = byRoute.get(item.href)
  if (!page) {
    warn(`Navigation href is not in generated inventory: ${item.href}`)
    continue
  }

  const publicSurface = item.surface.some((surface) => ['header', 'footer', 'section', 'utility'].includes(surface))
  if (publicSurface) {
    if (page.visibility && page.visibility !== 'public') fail(`Navigation leaks non-public page: ${item.href}`)
    if (page.status && page.status !== 'active') fail(`Navigation leaks non-active page: ${item.href}`)
    if (page.noindex) fail(`Navigation leaks noindex page: ${item.href}`)
    if (page.section === 'checkout') fail(`Navigation leaks checkout page: ${item.href}`)
    if (page.section === 'qa') fail(`Navigation leaks QA page: ${item.href}`)
    if (/dummy/i.test(page.source || item.href)) fail(`Navigation leaks dummy page: ${item.href}`)
    if (/playground|spec/i.test(page.source || item.href)) fail(`Navigation leaks playground/spec page: ${item.href}`)
  }
}

const pageIndexSource = read('src/navigation/pageIndex.ts')
for (const token of ["surface: ['header'", "surface: ['section'", "surface: ['footer'", "surface: ['header', 'footer', 'utility']"]) {
  if (!pageIndexSource.includes(token)) fail(`pageIndex.ts is missing expected surface token: ${token}`)
}

for (const requiredId of ['home', 'works', 'products', 'tools-wiper', 'inquiry']) {
  if (!ids.has(requiredId)) fail(`pageIndex is missing required item id: ${requiredId}`)
}

const forbiddenHrefs = [
  '/checkout/success',
  '/checkout/fail',
  '/qa/ewa-gallery',
  '/works/editorial-showcase',
  '/products/dummy-catalog',
  '/products/spec-playground',
]
for (const href of forbiddenHrefs) {
  if (hrefs.has(href)) fail(`Forbidden page leaked into navigation: ${href}`)
}

const sectionSource = read('src/navigation/sectionNavigation.ts')
for (const token of ['headerNavigation', 'footerNavigation', 'utilityNavigation', 'sectionNavigation']) {
  if (!sectionSource.includes(token)) fail(`sectionNavigation.ts is missing ${token}.`)
}

const visibilitySource = read('src/navigation/navigationVisibility.ts')
for (const token of ['isPageEligibleForPublicNavigation', 'noindex', 'dummy|playground|spec']) {
  if (!visibilitySource.includes(token)) fail(`navigationVisibility.ts is missing guard token: ${token}`)
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['smoke:navigation-page-index'] !== 'node scripts/smoke-navigation-page-index.mjs') {
  fail('package.json is missing smoke:navigation-page-index script.')
}
if (!read('scripts/check-launch.mjs').includes('smoke:navigation-page-index')) {
  fail('scripts/check-launch.mjs does not include smoke:navigation-page-index.')
}

for (const file of requiredFiles.concat(['package.json', 'scripts/check-launch.mjs'])) {
  if (fs.existsSync(path.join(root, file)) && hasObjectLeak(file)) {
    fail(`Object serialization leak detected in ${file}`)
  }
}

if (warnings.length > 0) {
  console.warn('[smoke:navigation-page-index] warnings')
  for (const warning of warnings) console.warn(`- ${warning}`)
}

if (failures.length > 0) {
  console.error('[smoke:navigation-page-index] failed')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[smoke:navigation-page-index] OK')
console.log(`- navigation items: ${pageIndex.length}`)
console.log(`- inventory pages: ${inventory.pages.length}`)
console.log('- hidden/noindex/checkout/QA/dummy/playground pages are excluded from public navigation')
