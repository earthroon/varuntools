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

const taxonomy = read('src/content/exposureTaxonomy.ts')
const inventory = read('scripts/generate-content-page-inventory.mjs')
assert(taxonomy.includes('ORPHAN_PUBLISHED_MARKDOWN'), 'taxonomy must define orphan issue')
assert(inventory.includes('ORPHAN_PUBLISHED_MARKDOWN'), 'inventory must report orphan issue')
assert(inventory.includes('routeOnly'), 'inventory must honor routeOnly escape hatch')
finish('PASS_CMS206A_NO_ORPHAN_PUBLISHED_MARKDOWN')
