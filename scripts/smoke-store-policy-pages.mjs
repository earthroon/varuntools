#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import matter from 'gray-matter'

const root = process.cwd()
const issues = []

function file(rel) {
  return path.join(root, rel)
}

function read(rel) {
  if (!existsSync(file(rel))) {
    issues.push(`missing file: ${rel}`)
    return ''
  }
  return readFileSync(file(rel), 'utf8')
}

const policies = [
  ['src/content/pages/policies/index.md', 'policies'],
  ['src/content/pages/policies/store/index.md', 'policies/store'],
  ['src/content/pages/policies/shipping/index.md', 'policies/shipping'],
  ['src/content/pages/policies/refund/index.md', 'policies/refund'],
  ['src/content/pages/policies/privacy/index.md', 'policies/privacy'],
  ['src/content/pages/policies/digital-download/index.md', 'policies/digital-download'],
]

for (const [rel, slug] of policies) {
  const raw = read(rel)
  if (!raw) continue
  const parsed = matter(raw)
  const data = parsed.data || {}
  if (data.slug !== slug) issues.push(`${rel} slug should be ${slug}`)
  if (data.status !== 'active') issues.push(`${rel} status should be active`)
  if (data.visibility !== 'hidden') issues.push(`${rel} visibility should be hidden`)
  if (data.robots !== 'noindex,follow') issues.push(`${rel} robots should be noindex,follow`)
  if (!data.title) issues.push(`${rel} title is required`)
  if (!data.description) issues.push(`${rel} description is required`)
}

const hub = read('src/content/pages/policies/index.md')
for (const href of ['/policies/store', '/policies/shipping', '/policies/refund', '/policies/privacy', '/policies/digital-download']) {
  if (!hub.includes(href)) issues.push(`policies hub missing ${href}`)
}

if (issues.length) {
  console.error('[VARUNTOOLS][smoke:store-policies] FAILED')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('[VARUNTOOLS][smoke:store-policies] OK')
console.log('Store policy pages are present, hidden from collections, and route-ready.')
