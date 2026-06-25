#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const PATCH_ID = 'CMS-207H'
const PASS_STATUS = 'PASS_CMS_207H_PUBLIC_CONTENT_INDEX_BUILD'
const CONTENT_ROOT = 'src/content/pages'
const TAXONOMY_FILE = 'config/public-content-taxonomy.json'
const OUT_FILE = 'dist/public-content-index.json'
const RECEIPT_FILE = 'public-content-index-receipt.json'
const BLOCKED_STATUSES = new Set(['draft', 'archived', 'trashed'])
const BLOCKED_VISIBILITIES = new Set(['hidden', 'private', 'draft'])

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/')
}

function trimSlashes(value) {
  return normalizeSlash(value).replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}

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
  error.extra = extra
  throw error
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function parseScalar(raw) {
  let value = String(raw ?? '').trim()
  if (!value) return ''
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value)
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map((item) => parseScalar(item)).filter((item) => String(item || '').trim())
  }
  return value
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith('---')) return {}
  const end = markdown.indexOf('\n---', 3)
  if (end < 0) return {}
  const body = markdown.slice(3, end).replace(/^\r?\n/, '')
  const out = {}
  let pendingArrayKey = ''
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const arrayMatch = line.match(/^-\s+(.+)$/)
    if (arrayMatch && pendingArrayKey) {
      if (!Array.isArray(out[pendingArrayKey])) out[pendingArrayKey] = []
      out[pendingArrayKey].push(parseScalar(arrayMatch[1]))
      continue
    }
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (rawValue === '') {
      out[key] = []
      pendingArrayKey = key
      continue
    }
    pendingArrayKey = ''
    out[key] = parseScalar(rawValue)
  }
  return out
}

function listMarkdownIndexFiles(dir) {
  if (!fs.existsSync(dir)) fail('CMS_207H_CONTENT_ROOT_MISSING', 'src/content/pages is missing')
  const out = []
  const stack = [dir]
  while (stack.length) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
        continue
      }
      if (entry.isFile() && entry.name === 'index.md') out.push(full)
    }
  }
  return out.sort((a, b) => normalizeSlash(a).localeCompare(normalizeSlash(b)))
}

function tagsOf(value) {
  return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : []
}

function boolOf(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true'
  return false
}

function categoryOf(frontmatter, slug) {
  const explicit = String(frontmatter.category || '').trim()
  if (explicit) return explicit
  const first = trimSlashes(slug).split('/')[0] || 'page'
  return first === slug ? 'page' : first
}

function comparableTime(frontmatter, slug) {
  const candidates = [frontmatter.publishedDate, frontmatter.date, frontmatter.updated, frontmatter.created, slug]
  for (const value of candidates) {
    const text = String(value || '').trim()
    if (!text) continue
    const direct = Date.parse(text)
    if (Number.isFinite(direct)) return direct
    const year = text.match(/(?:19|20)\d{2}/)?.[0]
    if (year) {
      const fallback = Date.parse(`${year}-01-01`)
      if (Number.isFinite(fallback)) return fallback
    }
  }
  return 0
}

function extractYear(time, frontmatter, slug) {
  if (Number.isFinite(time) && time > 0) return new Date(time).getUTCFullYear()
  const text = [frontmatter.publishedDate, frontmatter.date, frontmatter.updated, frontmatter.created, slug].map(String).join(' ')
  const year = text.match(/(?:19|20)\d{2}/)?.[0]
  return year ? Number(year) : undefined
}

function loadTaxonomy() {
  const raw = readJson(TAXONOMY_FILE, {}) || {}
  return {
    publicIndexCategories: new Set(Array.isArray(raw.publicIndexCategories) ? raw.publicIndexCategories : []),
    collectionIndexSlugs: new Set((Array.isArray(raw.collectionIndexSlugs) ? raw.collectionIndexSlugs : []).map(trimSlashes)),
    labels: raw.labels && typeof raw.labels === 'object' ? raw.labels : {},
  }
}

function entryFromMarkdown(file, taxonomy) {
  const markdown = fs.readFileSync(file, 'utf8')
  const frontmatter = parseFrontmatter(markdown)
  const relative = normalizeSlash(path.relative(CONTENT_ROOT, file))
  const contentDir = relative.replace(/\/index\.md$/, '')
  const slug = trimSlashes(String(frontmatter.slug || contentDir))
  const href = slug === 'home' ? '/' : '/' + slug
  const category = categoryOf(frontmatter, slug)
  const kind = String(frontmatter.kind || category).trim() || category
  const status = String(frontmatter.status || 'active').trim() || 'active'
  const visibility = boolOf(frontmatter.draft) ? 'draft' : String(frontmatter.visibility || 'public').trim() || 'public'
  const title = String(frontmatter.cardTitle || frontmatter.title || slug).trim()
  const description = String(frontmatter.cardDescription || frontmatter.summary || frontmatter.description || '').trim()
  const cover = String(frontmatter.cardCover || frontmatter.thumbnail || frontmatter.cover || frontmatter.ogImage || '').trim()
  const time = comparableTime(frontmatter, slug)
  const year = extractYear(time, frontmatter, slug)
  const source = String(frontmatter.source || '').trim()
  return {
    slug,
    href,
    title,
    description,
    category,
    categoryLabel: taxonomy.labels[category] || category,
    kind,
    collection: String(frontmatter.collection || kind).trim() || kind,
    tags: tagsOf(frontmatter.tags),
    order: Number.isFinite(Number(frontmatter.order)) ? Number(frontmatter.order) : 9999,
    featured: boolOf(frontmatter.featured),
    cover,
    thumbnail: String(frontmatter.thumbnail || cover).trim(),
    contentDir,
    status,
    visibility,
    ...(year ? { year } : {}),
    time,
    source,
    sourcePath: normalizeSlash(file),
  }
}

function isEligible(entry, taxonomy) {
  if (!entry.slug || entry.href === '/') return false
  if (taxonomy.collectionIndexSlugs.has(trimSlashes(entry.slug))) return false
  if (taxonomy.publicIndexCategories.size && !taxonomy.publicIndexCategories.has(entry.category)) return false
  if (BLOCKED_VISIBILITIES.has(entry.visibility)) return false
  if (BLOCKED_STATUSES.has(entry.status)) return false
  return true
}

function compareEntries(a, b) {
  return b.time - a.time || Number(b.featured) - Number(a.featured) || a.order - b.order || a.title.localeCompare(b.title)
}

function validateEntry(entry) {
  const required = ['slug', 'href', 'title', 'category', 'status', 'visibility']
  for (const key of required) {
    if (!String(entry[key] || '').trim()) return key
  }
  return ''
}

function main() {
  const taxonomy = loadTaxonomy()
  const files = listMarkdownIndexFiles(CONTENT_ROOT)
  const entries = files.map((file) => entryFromMarkdown(file, taxonomy)).filter((entry) => isEligible(entry, taxonomy)).sort(compareEntries)
  if (!entries.length) fail('CMS_207H_NO_PUBLIC_INDEX_ENTRIES', 'no public content index entries were generated')
  for (const entry of entries) {
    const missing = validateEntry(entry)
    if (missing) fail('CMS_207H_PUBLIC_INDEX_INVALID_ENTRY', 'public content index entry is missing ' + missing, { entry })
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  const index = {
    schemaVersion: 'cms-public-content-index.v1',
    patchId: PATCH_ID,
    generatedAt: new Date().toISOString(),
    source: 'gh-pages-publish-workflow',
    entries,
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(index, null, 2) + '\n', 'utf8')
  const vacmsEntryCount = entries.filter((entry) => entry.source === 'vacms').length
  const receipt = {
    ok: true,
    patchId: PATCH_ID,
    status: PASS_STATUS,
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
