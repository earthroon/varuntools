#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { CMS207M_R1_CONTENT_PROJECTION_SCHEMA, stableJson } from './lib/cms207m-public-projection.mjs'

const ROOT = process.cwd()
const SOURCE_PATH = path.join(ROOT, 'src', 'content', 'generated', 'publicContentProjection.generated.json')
const OUT_PATH = path.join(ROOT, 'src', 'content', 'generated', 'homeCollections.generated.json')
const CHECK = process.argv.includes('--check')
const SCHEMA_VERSION = 'home-collections.v1'

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (!fs.existsSync(SOURCE_PATH)) fail('E_CMS207M_PUBLIC_CONTENT_PROJECTION_MISSING')
const source = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'))
if (source.schemaVersion !== CMS207M_R1_CONTENT_PROJECTION_SCHEMA || !Array.isArray(source.entries)) {
  fail('E_CMS207M_PUBLIC_CONTENT_PROJECTION_SCHEMA_MISMATCH')
}

const entries = source.entries.map((entry) => ({
  slug: entry.slug,
  href: entry.href,
  contentDir: entry.contentDir,
  title: entry.title,
  description: entry.description,
  category: entry.category,
  categoryLabel: entry.categoryLabel,
  kind: entry.kind,
  collection: entry.collection,
  tags: Array.isArray(entry.tags) ? entry.tags : [],
  order: Number.isFinite(Number(entry.order)) ? Number(entry.order) : 9999,
  featured: entry.featured === true,
  visibility: entry.visibility || 'public',
  editorialVisibility: entry.editorialVisibility || (entry.visibility === 'public' ? 'listed' : 'internal'),
  routeOnly: entry.routeOnly === true,
  status: entry.status || 'active',
  cover: entry.cover || '',
  thumbnail: entry.thumbnail || entry.cover || '',
  ...(Number.isFinite(Number(entry.year)) ? { year: Number(entry.year) } : {}),
  ...(Number.isFinite(Number(entry.time)) && Number(entry.time) > 0 ? { time: Number(entry.time) } : {}),
  work: entry.work && typeof entry.work === 'object' ? entry.work : {
    hasWorkMetadata: false,
    status: entry.status || 'active',
    role: [],
    stack: [],
    period: '',
    type: entry.kind || entry.category || 'page',
  },
})).sort((a, b) => (
  a.order - b.order
  || Number(b.time || 0) - Number(a.time || 0)
  || String(a.slug).localeCompare(String(b.slug))
))

const payload = {
  schemaVersion: SCHEMA_VERSION,
  sourceSchemaVersion: CMS207M_R1_CONTENT_PROJECTION_SCHEMA,
  projectionRevision: 'CMS-207M-R1',
  entries,
}
const next = stableJson(payload)

if (CHECK) {
  const current = fs.existsSync(OUT_PATH) ? fs.readFileSync(OUT_PATH, 'utf8') : ''
  if (current !== next) fail('[CMS-207M-R1] homeCollections.generated.json is stale')
  console.log('PASS_PUBLIC_ASSET_SSOT_04M_B3_HOME_COLLECTIONS_CHECK')
  console.log('PASS_CMS_207M_R1_HOME_COLLECTIONS_SINGLE_PROJECTION')
} else {
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, next, 'utf8')
  console.log(`WROTE ${path.relative(ROOT, OUT_PATH).replace(/\\/g, '/')} (${entries.length} entries)`)
}
