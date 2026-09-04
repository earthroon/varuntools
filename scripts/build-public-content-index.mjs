#!/usr/bin/env node
import fs from 'node:fs'
import crypto from 'node:crypto'
import {
  CMS207M_R1_CONTENT_PROJECTION_SCHEMA,
  readJson,
  trimSlashes,
} from './lib/cms207m-public-projection.mjs'

const PATCH_ID = 'CMS-207H'
const PASS_STATUS = 'PASS_CMS_207H_PUBLIC_CONTENT_INDEX_BUILD'
const SOURCE_FILE = 'src/content/generated/publicContentProjection.generated.json'
const TAXONOMY_FILE = 'config/public-content-taxonomy.json'
const OUT_FILE = 'dist/public-content-index.json'
const RECEIPT_FILE = 'public-content-index-receipt.json'
const BLOCKED_STATUSES = new Set(['draft', 'archived', 'trashed'])
const BLOCKED_VISIBILITIES = new Set(['hidden', 'private', 'draft'])

function fail(code, message, extra = {}) {
  const receipt = {
    ok: false,
    patchId: PATCH_ID,
    status: 'FAIL_' + PASS_STATUS,
    blockedReasonCode: code,
    blockedReason: message,
    ...extra,
    generatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(RECEIPT_FILE, JSON.stringify(receipt, null, 2) + '\n', 'utf8')
  const error = new Error(message)
  error.code = code
  throw error
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function loadTaxonomy() {
  const raw = readJson(TAXONOMY_FILE, {}) || {}
  return {
    publicIndexCategories: new Set(Array.isArray(raw.publicIndexCategories) ? raw.publicIndexCategories : []),
    collectionIndexSlugs: new Set((Array.isArray(raw.collectionIndexSlugs) ? raw.collectionIndexSlugs : []).map(trimSlashes)),
    labels: raw.labels && typeof raw.labels === 'object' ? raw.labels : {},
  }
}

function isEligible(entry, taxonomy) {
  if (!entry.slug || entry.href === '/') return false
  if (taxonomy.collectionIndexSlugs.has(trimSlashes(entry.slug))) return false
  if (taxonomy.publicIndexCategories.size && !taxonomy.publicIndexCategories.has(entry.category)) return false
  if (BLOCKED_VISIBILITIES.has(entry.visibility)) return false
  if (entry.editorialVisibility && entry.editorialVisibility !== 'listed') return false
  if (entry.routeOnly === true || entry.collection === 'none') return false
  if (BLOCKED_STATUSES.has(entry.status)) return false
  return true
}

function compareEntries(a, b) {
  return Number(b.time || 0) - Number(a.time || 0)
    || Number(b.featured) - Number(a.featured)
    || Number(a.order || 9999) - Number(b.order || 9999)
    || String(a.title).localeCompare(String(b.title))
}

function main() {
  if (!fs.existsSync(SOURCE_FILE)) fail('CMS_207M_PUBLIC_CONTENT_PROJECTION_MISSING', `${SOURCE_FILE} is missing`)
  const source = readJson(SOURCE_FILE, null)
  if (!source || source.schemaVersion !== CMS207M_R1_CONTENT_PROJECTION_SCHEMA || !Array.isArray(source.entries)) {
    fail('CMS_207M_PUBLIC_CONTENT_PROJECTION_SCHEMA_MISMATCH', `${SOURCE_FILE} schema mismatch`)
  }

  const taxonomy = loadTaxonomy()
  const entries = source.entries
    .filter((entry) => isEligible(entry, taxonomy))
    .map((entry) => ({
      slug: entry.slug,
      href: entry.href,
      title: entry.title,
      description: entry.description || '',
      category: entry.category,
      categoryLabel: entry.categoryLabel || taxonomy.labels[entry.category] || entry.category,
      kind: entry.kind || entry.category,
      collection: entry.collection || entry.kind || entry.category,
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      order: Number.isFinite(Number(entry.order)) ? Number(entry.order) : 9999,
      featured: entry.featured === true,
      cover: entry.cover || '',
      thumbnail: entry.thumbnail || entry.cover || '',
      contentDir: entry.contentDir || entry.slug,
      status: entry.status || 'active',
      visibility: entry.visibility || 'public',
      ...(Number.isFinite(Number(entry.year)) ? { year: Number(entry.year) } : {}),
      time: Number.isFinite(Number(entry.time)) ? Number(entry.time) : 0,
      source: entry.source || '',
      sourcePath: entry.sourcePath || '',
    }))
    .sort(compareEntries)

  if (!entries.length) fail('CMS_207H_NO_PUBLIC_INDEX_ENTRIES', 'no public content index entries were generated')
  for (const entry of entries) {
    for (const key of ['slug', 'href', 'title', 'category', 'status', 'visibility']) {
      if (!String(entry[key] || '').trim()) fail('CMS_207H_PUBLIC_INDEX_INVALID_ENTRY', `public content index entry is missing ${key}`, { entry })
    }
  }

  fs.mkdirSync('dist', { recursive: true })
  const index = {
    schemaVersion: 'cms-public-content-index.v1',
    patchId: PATCH_ID,
    generatedAt: new Date().toISOString(),
    source: 'cms-207m-public-content-projection',
    entries,
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(index, null, 2) + '\n', 'utf8')
  const vacmsEntryCount = entries.filter((entry) => entry.source === 'vacms').length
  const receipt = {
    ok: true,
    patchId: PATCH_ID,
    status: PASS_STATUS,
    sourceSchemaVersion: CMS207M_R1_CONTENT_PROJECTION_SCHEMA,
    indexPath: OUT_FILE,
    indexSha256: hashFile(OUT_FILE),
    entryCount: entries.length,
    vacmsEntryCount,
    generatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(RECEIPT_FILE, JSON.stringify(receipt, null, 2) + '\n', 'utf8')
  console.log(PASS_STATUS)
  console.log('entryCount=' + entries.length)
  console.log('vacmsEntryCount=' + vacmsEntryCount)
}

main()
