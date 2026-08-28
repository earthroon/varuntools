#!/usr/bin/env node
import fs from 'node:fs'

const PASS_STATUS = 'PASS_CMS_207F_HOMEPAGE_RECENT_PUBLIC_CONTENT_FEED'
function fail(message) { console.error(message); process.exit(1) }
function read(file) { if (!fs.existsSync(file)) fail(`${file} is missing`); return fs.readFileSync(file, 'utf8') }

const component = read('src/components/home/HomeRecentPublicContent.vue')
const home = read('src/pages/HomePage.vue')
const builder = read('scripts/build-home-collections.mjs')
const pkg = JSON.parse(read('package.json'))
const checks = [
  [component.includes('useHomeCollections'), 'HomeRecentPublicContent must use useHomeCollections'],
  [component.includes("'post'") || component.includes('"post"'), 'HomeRecentPublicContent includeCategories must include post'],
  [component.includes('href="/index"'), 'HomeRecentPublicContent must link to /index'],
  [component.includes('recentEntries'), 'HomeRecentPublicContent must compute recentEntries'],
  [component.includes('generated-home-collections'), 'HomeRecentPublicContent must expose generated-home-collections source marker'],
  [!component.includes('useRuntimePublicContentIndex'), 'HomeRecentPublicContent must not runtime-swap to public index'],
  [builder.includes('publicContentProjection.generated.json'), 'home collection builder must derive from CMS-207M-R1 projection'],
  [home.includes("import HomeRecentPublicContent from '@/components/home/HomeRecentPublicContent.vue'"), 'HomePage must import HomeRecentPublicContent'],
  [home.includes('<HomeRecentPublicContent'), 'HomePage template must render HomeRecentPublicContent'],
  [pkg.scripts?.['smoke:cms207f'], 'package.json must expose smoke:cms207f'],
]
for (const [ok, message] of checks) if (!ok) fail(message)
console.log(PASS_STATUS)
