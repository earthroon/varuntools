#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))

function assert(condition, message) {
  if (!condition) {
    console.error(`[smoke:home-featured-works] FAIL ${message}`)
    process.exit(1)
  }
}

const componentPath = 'src/components/home/HomeFeaturedWorks.vue'
const homePath = 'src/pages/HomePage.vue'
const worksCssPath = 'src/styles/markdown-works.css'

assert(exists(componentPath), 'HomeFeaturedWorks.vue must exist')
assert(exists(homePath), 'HomePage.vue must exist')
assert(exists(worksCssPath), 'markdown-works.css must exist')

const component = read(componentPath)
const home = read(homePath)
const worksCss = read(worksCssPath)
const pkg = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')

assert(
  component.includes('useHomeCollections'),
  'HomeFeaturedWorks must use home collections SSOT',
)

assert(
  component.includes('featuredWorks'),
  'HomeFeaturedWorks must consume featuredWorks from home collections SSOT',
)

assert(
  !component.includes('getWorkCollectionEntries'),
  'HomeFeaturedWorks must not use legacy getWorkCollectionEntries',
)

assert(
  !component.includes('LoadedMarkdownPage'),
  'HomeFeaturedWorks must not depend on LoadedMarkdownPage',
)

assert(
  !component.includes('props.pages'),
  'HomeFeaturedWorks must not consume route pages',
)

assert(
  component.includes('.slice(0, props.limit)'),
  'HomeFeaturedWorks must apply limit',
)

assert(
  component.includes('WorkCard'),
  'HomeFeaturedWorks must render WorkCard entries',
)

assert(
  component.includes('작업 전체 보기') &&
    component.includes('href="/works"'),
  'HomeFeaturedWorks must link to /works',
)

assert(
  !component.includes('[object Object]'),
  'HomeFeaturedWorks source must not contain [object Object]',
)

assert(
  home.includes('import HomeFeaturedWorks'),
  'HomePage must import HomeFeaturedWorks',
)

assert(
  home.includes('<HomeFeaturedWorks />'),
  'HomePage must mount HomeFeaturedWorks without legacy pages prop',
)

assert(
  !home.includes('<HomeFeaturedWorks :pages='),
  'HomePage must not pass legacy route pages to HomeFeaturedWorks',
)

assert(
  worksCss.includes('.vt-home-featured-works'),
  'home featured styles must exist',
)

assert(
  worksCss.includes('var(--vt-'),
  'home featured styles must use existing VT tokens',
)

assert(
  worksCss.includes('@media (max-width: 720px)'),
  'home featured styles must include responsive fallback',
)

assert(
  pkg.scripts?.['smoke:home-featured-works'] ===
    'node scripts/smoke-home-featured-works.mjs',
  'package.json must expose smoke:home-featured-works',
)

assert(
  checkLaunch.includes('scripts/smoke-home-featured-works.mjs'),
  'check:launch must run smoke-home-featured-works',
)

console.log('[smoke:home-featured-works] PASS')
