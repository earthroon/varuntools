#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const file = path.join(root, 'public', 'search-index.json')
const failures = []
function check(name, condition) { if (!condition) failures.push(name) }

check('public/search-index.json exists', fs.existsSync(file))
let payload = null
if (fs.existsSync(file)) {
  try { payload = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { failures.push('public/search-index.json parses') }
}

const entries = Array.isArray(payload?.entries) ? payload.entries : []
check('search index version is 1', payload?.version === 1)
check('generatedAt is ISO string', typeof payload?.generatedAt === 'string' && !Number.isNaN(Date.parse(payload.generatedAt)))
check('entries is non-empty array', entries.length > 0)

const bySlug = new Map(entries.map((entry) => [entry.slug, entry]))
check('home included', bySlug.has('home'))
check('products included', bySlug.has('products'))
check('dummy catalog included', bySlug.has('products/dummy-catalog'))
check('policies hidden pages excluded', !entries.some((entry) => String(entry.slug).startsWith('policies/')))
check('draft/hidden product excluded', !entries.some((entry) => entry.product?.status === 'draft' || entry.product?.status === 'hidden'))
check('hidden pages excluded', !entries.some((entry) => entry.visibility === 'hidden'))

for (const entry of entries) {
  for (const key of ['slug', 'href', 'title', 'kind', 'tags']) {
    check(`entry ${entry.slug || '<unknown>'} has ${key}`, entry[key] !== undefined)
  }
}

const dummy = bySlug.get('products/dummy-catalog')
check('dummy catalog has product status', dummy?.product?.status === 'coming-soon')
check('dummy catalog has product type', typeof dummy?.product?.type === 'string' && dummy.product.type.length > 0)
check('dummy catalog has product category', dummy?.product?.category === 'templates')
check('dummy catalog has product subcategory', dummy?.product?.subcategory === 'workflow')
check('dummy catalog has product collection', dummy?.product?.collection === 'varun-tools')

if (failures.length) {
  console.error('smoke:search-index FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`smoke:search-index OK — ${entries.length} entries`)
