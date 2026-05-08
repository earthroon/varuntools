#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const failures = []
const objectLeakToken = '[' + 'object Object' + ']'

function fail(message) {
  failures.push(message)
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

function assertFile(relativePath) {
  if (!exists(relativePath)) fail(`Missing required file: ${relativePath}`)
}

function hasObjectLeak(relativePath) {
  return exists(relativePath) && read(relativePath).includes(objectLeakToken)
}

const requiredFiles = [
  'src/components/layout/SiteHeader.vue',
  'src/components/layout/SiteFooter.vue',
  'src/components/layout/SiteNavigationLink.vue',
  'src/navigation/navigationActive.ts',
  'src/navigation/navigationTypes.ts',
  'src/navigation/pageIndex.ts',
  'src/navigation/sectionNavigation.ts',
  'src/styles/site-navigation.css',
  'src/App.vue',
  'src/main.ts',
  'scripts/smoke-navigation-ui-connection.mjs',
  'docs/authoring/navigation-ui-connection.md',
  'docs/migration/commit-129.md',
  'BAKE_REPORT_COMMIT_129.md',
]
requiredFiles.forEach(assertFile)

const header = read('src/components/layout/SiteHeader.vue')
const footer = read('src/components/layout/SiteFooter.vue')
const link = read('src/components/layout/SiteNavigationLink.vue')
const app = read('src/App.vue')
const active = read('src/navigation/navigationActive.ts')
const section = read('src/navigation/sectionNavigation.ts')
const types = read('src/navigation/navigationTypes.ts')
const style = read('src/styles/site-navigation.css')
const main = read('src/main.ts')
const pageIndex = read('src/navigation/pageIndex.ts')

if (!header.includes('headerNavigation')) fail('SiteHeader.vue must import/use headerNavigation.')
if (!header.includes('utilityNavigation')) fail('SiteHeader.vue must import/use utilityNavigation.')
if (!header.includes('data-navigation-surface="header"')) fail('SiteHeader.vue must mark the header navigation surface.')
if (!header.includes('SiteNavigationLink')) fail('SiteHeader.vue must render SiteNavigationLink items.')
if (!header.includes('v-for="item in headerNavigation"')) fail('SiteHeader.vue must render headerNavigation with v-for.')
if (!header.includes('v-for="item in utilityNavigation"')) fail('SiteHeader.vue must render utilityNavigation with v-for.')

if (!footer.includes('footerNavigation')) fail('SiteFooter.vue must import/use footerNavigation.')
if (!footer.includes('data-navigation-surface="footer"')) fail('SiteFooter.vue must mark the footer navigation surface.')
if (!footer.includes('SiteNavigationLink')) fail('SiteFooter.vue must render SiteNavigationLink items.')
if (!footer.includes('v-for="item in footerNavigation"')) fail('SiteFooter.vue must render footerNavigation with v-for.')

if (!link.includes('isNavigationItemActive')) fail('SiteNavigationLink.vue must use active navigation helper.')
if (!link.includes('aria-current')) fail('SiteNavigationLink.vue must expose aria-current for active links.')
if (!link.includes('RouterLink')) fail('SiteNavigationLink.vue must render internal RouterLink links.')
if (!link.includes('target="_blank"') && !link.includes(':target="target"')) fail('SiteNavigationLink.vue must distinguish external links.')

if (!app.includes('<SiteHeader />')) fail('App.vue must render SiteHeader.')
if (!app.includes('<SiteFooter />')) fail('App.vue must render SiteFooter.')
if (!app.includes('<RouterView />')) fail('App.vue must preserve RouterView.')
if (!main.includes("./styles/site-navigation.css")) fail('src/main.ts must import site-navigation.css.')

if (!types.includes('NavigationActiveMatch')) fail('navigationTypes.ts must define NavigationActiveMatch.')
if (!active.includes("itemHref === '/' ? 'exact'")) fail('navigationActive.ts must default Home active matching to exact.')
if (!active.includes('startsWith')) fail('navigationActive.ts must support startsWith for nested routes.')
if (!active.includes('current === href || current.startsWith')) fail('navigationActive.ts must support nested active routes.')

for (const token of ['headerNavigation', 'footerNavigation', 'utilityNavigation']) {
  if (!section.includes(token)) fail(`sectionNavigation.ts is missing ${token}.`)
}

for (const token of ['vt-site-header', 'vt-site-footer', 'vt-site-nav-link', '@media (max-width: 820px)']) {
  if (!style.includes(token)) fail(`site-navigation.css is missing ${token}.`)
}

const forbiddenHrefs = [
  '/works/editorial-showcase',
  '/products/dummy-catalog',
  '/products/spec-playground',
  '/checkout/success',
  '/checkout/fail',
  '/qa/ewa-gallery',
]
const navSources = [header, footer, app, pageIndex]
for (const href of forbiddenHrefs) {
  for (const source of navSources) {
    if (source.includes(href)) fail(`Forbidden navigation href leaked into UI source: ${href}`)
  }
}

const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['smoke:navigation-ui-connection'] !== 'node scripts/smoke-navigation-ui-connection.mjs') {
  fail('package.json is missing smoke:navigation-ui-connection script.')
}
if (!read('scripts/check-launch.mjs').includes('smoke:navigation-ui-connection')) {
  fail('scripts/check-launch.mjs does not include smoke:navigation-ui-connection.')
}

for (const file of requiredFiles.concat(['package.json', 'scripts/check-launch.mjs'])) {
  if (hasObjectLeak(file)) fail(`Object serialization leak detected in ${file}`)
}

if (failures.length > 0) {
  console.error('[smoke:navigation-ui-connection] failed')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[smoke:navigation-ui-connection] OK')
console.log('- Header/Footer/Utility navigation are connected to sectionNavigation')
console.log('- Active route helper preserves exact Home matching and nested route matching')
console.log('- forbidden hidden/noindex/QA/checkout/dummy/playground links are not exposed in nav UI sources')
