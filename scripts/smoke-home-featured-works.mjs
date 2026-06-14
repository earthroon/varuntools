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

const component = read(componentPath)
const home = read(homePath)
const worksCss = read(worksCssPath)
const pageRegistry = read('src/markdown/pageRegistry.ts')
const pkg = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')

assert(component.includes('getWorkCollectionEntries'), 'HomeFeaturedWorks must reuse works collection SSOT')
assert(component.includes('.filter((entry) => entry.featured)'), 'HomeFeaturedWorks must filter featured entries')
assert(component.includes('.filter((entry) => entry.hasWorkMetadata)'), 'HomeFeaturedWorks must require work metadata to avoid product featured bleed')
assert(component.includes("entry.workStatus !== 'private'"), 'HomeFeaturedWorks must hide private works')
assert(component.includes("entry.workStatus !== 'draft'"), 'HomeFeaturedWorks must hide draft works')
assert(component.includes('.slice(0, props.limit)'), 'HomeFeaturedWorks must apply limit')
assert(component.includes('WorkCard'), 'HomeFeaturedWorks must render WorkCard entries')
assert(component.includes('작업 전체 보기') && component.includes('href="/works"'), 'HomeFeaturedWorks must link to /works')
assert(!component.includes('[object Object]'), 'HomeFeaturedWorks source must not contain [object Object]')

assert(home.includes('import HomeFeaturedWorks'), 'HomePage must import HomeFeaturedWorks')
assert(home.includes('<HomeFeaturedWorks :pages="pages"'), 'HomePage must mount HomeFeaturedWorks with route pages')

assert(pageRegistry.includes('hasWorkMetadata'), 'WorkCardEntry must expose hasWorkMetadata')
assert(pageRegistry.includes('b.weight - a.weight'), 'works sorting must still prioritize weight')
assert(pageRegistry.includes('Number(b.year ?? 0)'), 'works sorting must still include year')

assert(worksCss.includes('.vt-home-featured-works'), 'home featured styles must exist')
assert(worksCss.includes('var(--vt-'), 'home featured styles must use existing VT tokens')
assert(worksCss.includes('@media (max-width: 720px)'), 'home featured styles must include responsive fallback')

assert(pkg.scripts?.['smoke:home-featured-works'] === 'node scripts/smoke-home-featured-works.mjs', 'package.json must expose smoke:home-featured-works')
assert(checkLaunch.includes('scripts/smoke-home-featured-works.mjs'), 'check:launch must run smoke-home-featured-works')

console.log('[smoke:home-featured-works] PASS')
