#!/usr/bin/env node
import fs from 'node:fs'

const PASS_STATUS = 'PASS_CMS_207F_HOMEPAGE_RECENT_PUBLIC_CONTENT_FEED'

function fail(message) {
  console.error(message)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`${file} is missing`)
  return fs.readFileSync(file, 'utf8')
}

const componentPath = 'src/components/home/HomeRecentPublicContent.vue'
const homePath = 'src/pages/HomePage.vue'
const pkgPath = 'package.json'

const component = read(componentPath)
const home = read(homePath)
const pkg = JSON.parse(read(pkgPath))

const checks = [
  [component.includes('usePublicContentCollection'), 'HomeRecentPublicContent must reuse usePublicContentCollection'],
  [component.includes("'post'") || component.includes('"post"'), 'HomeRecentPublicContent includeCategories must include post'],
  [component.includes('href="/index"'), 'HomeRecentPublicContent must link to /index'],
  [component.includes('recentEntries'), 'HomeRecentPublicContent must compute recentEntries'],
  [home.includes("import HomeRecentPublicContent from '@/components/home/HomeRecentPublicContent.vue'"), 'HomePage must import HomeRecentPublicContent'],
  [home.includes('<HomeRecentPublicContent'), 'HomePage template must render HomeRecentPublicContent'],
  [pkg.scripts?.['smoke:cms207f'], 'package.json must expose smoke:cms207f'],
]

for (const [ok, message] of checks) {
  if (!ok) fail(message)
}

console.log(PASS_STATUS)
