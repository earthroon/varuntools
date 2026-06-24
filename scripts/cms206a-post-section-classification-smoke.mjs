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

const inventory = read('scripts/generate-content-page-inventory.mjs')
assert(inventory.includes("if (first === 'post') return 'post'"), 'inventory sectionFor must classify post')
assert(inventory.includes("if (first === 'case-study'"), 'inventory sectionFor must classify case-study')
assert(inventory.includes('ORPHAN_PUBLISHED_MARKDOWN'), 'inventory must contain orphan gate')
const generatedType = read('src/types/generatedContent.ts')
assert(generatedType.includes("| 'post'"), 'GeneratedPageType must include post')
assert(generatedType.includes("| 'case-study'"), 'GeneratedPageType must include case-study')
finish('PASS_CMS206A_POST_SECTION_CLASSIFICATION')
