#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const taxonomyPath = path.join(root, 'config/public-content-taxonomy.json')
const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'))
const runtime = fs.readFileSync(path.join(root, 'src/content/publicContentTaxonomy.ts'), 'utf8')
const inventory = fs.readFileSync(path.join(root, 'scripts/generate-content-page-inventory.mjs'), 'utf8')

const required = ['page', 'post', 'work', 'case-study', 'lab', 'tool', 'product']
for (const key of required) {
  if (!taxonomy.publicCategories.includes(key)) throw new Error('missing category in taxonomy: ' + key)
}
if (!runtime.includes('public-content-taxonomy.json')) throw new Error('runtime taxonomy must import JSON SSOT')
if (!inventory.includes('public-content-taxonomy.json')) throw new Error('inventory script must read JSON SSOT')
console.log('CMS206B_TAXONOMY_SSOT_SYNC_PASS')
