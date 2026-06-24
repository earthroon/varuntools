#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const inventoryPath = path.join(root, 'generated/page-inventory.json')
if (!fs.existsSync(inventoryPath)) throw new Error('generated/page-inventory.json missing; run npm run content:page-inventory first')
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'))
const allowed = new Set(['work', 'case-study'])
const leaked = inventory.pages.filter((page) => page.visibility === 'public' && page.collection === 'works' && !allowed.has(page.category))
if (leaked.length) throw new Error('mixed works index leak: ' + leaked.map((page) => page.source).join(', '))
console.log('CMS206B_NO_MIXED_WORK_INDEX_PASS')
