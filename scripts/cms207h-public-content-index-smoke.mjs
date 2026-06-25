#!/usr/bin/env node
import fs from 'node:fs'

const INDEX_FILE = 'dist/public-content-index.json'
const RECEIPT_FILE = 'public-content-index-receipt.json'
const PASS_STATUS = 'PASS_CMS_207H_PUBLIC_CONTENT_INDEX_SMOKE'
const BLOCKED_STATUSES = new Set(['draft', 'archived', 'trashed'])
const BLOCKED_VISIBILITIES = new Set(['hidden', 'private', 'draft'])

function fail(message) {
  throw new Error(message)
}

if (!fs.existsSync(INDEX_FILE)) fail('dist/public-content-index.json is missing')
if (!fs.existsSync(RECEIPT_FILE)) fail('public-content-index-receipt.json is missing')

const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'))
const receipt = JSON.parse(fs.readFileSync(RECEIPT_FILE, 'utf8'))

if (receipt.ok !== true) fail('public content index receipt is not ok')
if (index.schemaVersion !== 'cms-public-content-index.v1') fail('public content index schemaVersion mismatch')
if (!Array.isArray(index.entries) || !index.entries.length) fail('public content index has no entries')
if (!index.entries.some((entry) => entry.source === 'vacms')) fail('public content index has no VACMS source entry')
if (!index.entries.some((entry) => String(entry.href || '').startsWith('/post/'))) fail('public content index has no /post/ entry')

for (const entry of index.entries) {
  for (const key of ['slug', 'href', 'title', 'category', 'status', 'visibility']) {
    if (!String(entry[key] || '').trim()) fail('public content index entry missing key: ' + key)
  }
  if (BLOCKED_STATUSES.has(entry.status)) fail('public content index contains blocked status: ' + entry.slug)
  if (BLOCKED_VISIBILITIES.has(entry.visibility)) fail('public content index contains blocked visibility: ' + entry.slug)
}

console.log(PASS_STATUS)
