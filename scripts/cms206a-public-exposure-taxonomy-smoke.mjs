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

assert(exists('src/content/exposureTaxonomy.ts'), 'src/content/exposureTaxonomy.ts must exist')
const taxonomy = read('src/content/exposureTaxonomy.ts')
for (const token of ['PUBLIC_CATEGORY_KEYS', 'PUBLIC_KIND_KEYS', 'resolvePublicExposure', 'getCollectionKey', 'ORPHAN_PUBLISHED_MARKDOWN']) {
  assert(taxonomy.includes(token), `taxonomy must include ${token}`)
}
for (const kind of ["'post'", "'case-study'", "'page'"]) assert(taxonomy.includes(kind), `taxonomy must include ${kind}`)
finish('PASS_CMS206A_PUBLIC_EXPOSURE_TAXONOMY')
