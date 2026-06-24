#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const failures = []
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8') }
function exists(rel) { return fs.existsSync(path.join(root, rel)) }
function assert(condition, message) { if (!condition) failures.push(message) }
function finish(status) {
  if (failures.length) {
    console.error(status.replace('PASS_', 'FAIL_'))
    for (const failure of failures) console.error('- ' + failure)
    process.exit(1)
  }
  console.log(status)
}

const homeSection = read('src/components/markdown/HomeSection.vue')
const homePage = read('src/content/pages/home/index.md')
assert(homeSection.includes('getCollectionKey'), 'HomeSection must use getCollectionKey')
assert(homeSection.includes("| 'post'"), 'HomeSection source type must include post')
assert(homePage.includes('source: post'), 'home index must include a post home-section')
assert(homePage.includes('최근 글'), 'home index must expose recent posts copy')
finish('PASS_CMS206A_HOMEPAGE_SURFACE_RESOLUTION')
