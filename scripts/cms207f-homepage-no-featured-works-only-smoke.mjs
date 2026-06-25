#!/usr/bin/env node
import fs from 'node:fs'

const PASS_STATUS = 'PASS_CMS_207F_NO_FEATURED_WORKS_ONLY_HOME_LISTING'

function fail(message) {
  console.error(message)
  process.exit(1)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`${file} is missing`)
  return fs.readFileSync(file, 'utf8')
}

const home = read('src/pages/HomePage.vue')
const component = read('src/components/home/HomeRecentPublicContent.vue')

const recentIndex = home.indexOf('<HomeRecentPublicContent')
const worksIndex = home.indexOf('<HomeFeaturedWorks')

if (recentIndex < 0) fail('HomePage does not render HomeRecentPublicContent')
if (worksIndex < 0) fail('HomePage does not render HomeFeaturedWorks; this patch must extend, not delete, the existing section')
if (recentIndex > worksIndex) fail('HomeRecentPublicContent must render before HomeFeaturedWorks')
if (!component.includes("'post'") && !component.includes('"post"')) fail('post category is not included in homepage recent feed candidates')
if (/\.filter\(\s*\(?\s*entry\s*\)?\s*=>\s*entry\.featured\s*\)/.test(component)) {
  fail('homepage recent feed must not be featured-only')
}
if (!component.includes('allEntries')) fail('homepage recent feed must use public index entries, not a separate content source')

console.log(PASS_STATUS)
