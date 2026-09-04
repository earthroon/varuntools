#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const PASS = 'PASS_CMS_207M_R3_DEPENDENCY_FREE_PAGE_ADMISSION'
const RECEIPT = 'vacms-page-admission-receipt.json'

function writeReceipt(value) { fs.writeFileSync(RECEIPT, JSON.stringify(value, null, 2) + '\n', 'utf8') }
function fail(code, message, extra = {}) {
  writeReceipt({ ok: false, status: 'FAIL_' + PASS, code, message, mainMutationAllowed: false, ...extra, generatedAt: new Date().toISOString() })
  console.error(code + ': ' + message)
  process.exit(1)
}
function readJson(file, code) {
  if (!fs.existsSync(file)) fail(code, file + ' is missing')
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) }
  catch (error) { fail(code, file + ' is invalid JSON', { detail: error instanceof Error ? error.message : String(error) }) }
}
const safePagePath = (value) => /^src\/content\/pages\/.+\/index\.md$/.test(value) && !value.includes('..') && !value.startsWith('/') && !value.includes('\\')
const safeSidecarPath = (value) => /^src\/content\/generated\/vacms-pages\/[^/]+\.projection\.json$/.test(value) && !value.includes('..') && !value.startsWith('/') && !value.includes('\\')

function parseScalar(raw) {
  const value = raw.trim()
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null' || value === '~') return null
  if (value === '[]') return []
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) return Number(value)
  if (value.startsWith('"') && value.endsWith('"')) {
    try { return JSON.parse(value) } catch { return value.slice(1, -1) }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'")
  return value
}

function parseTopLevelFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) fail('E_CMS207M_R3_FRONTMATTER_OPEN_MISSING', 'materialized page does not start with YAML frontmatter')
  const end = normalized.indexOf('\n---\n', 4)
  if (end < 0) fail('E_CMS207M_R3_FRONTMATTER_CLOSE_MISSING', 'materialized page frontmatter does not close')
  const values = {}
  for (const line of normalized.slice(4, end).split('\n')) {
    if (!line || /^\s/.test(line)) continue
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/)
    if (match) values[match[1]] = parseScalar(match[2])
  }
  return values
}

function splitEditorialColumns(body) {
  const normalized = String(body || '').replace(/\r\n/g, '\n').trim()
  if (!normalized) return []
  const canonical = normalized.split(/^---\s*$/m).map((chunk) => chunk.trim()).filter(Boolean)
  if (canonical.length >= 2) return canonical
  const legacy = []
  let current = []
  for (const line of normalized.split('\n')) {
    if (/^###\s+/.test(line) && current.some((item) => item.trim())) {
      legacy.push(current.join('\n').trim())
      current = []
    }
    current.push(line)
  }
  if (current.some((item) => item.trim())) legacy.push(current.join('\n').trim())
  return legacy.length >= 2 ? legacy : canonical
}

function parseColumnCount(value) {
  const normalized = String(value ?? '').trim()
  if (normalized === '2') return 2
  if (normalized === '3') return 3
  if (normalized === '4') return 4
  return null
}

function validateEditorialColumns(raw) {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index]?.trim() !== '::editorial-columns') continue
    const attrs = {}
    let separator = -1
    let closing = -1
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor] ?? ''
      if (line.trim() === '::') { separator = cursor; break }
      const attr = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/)
      if (attr) attrs[attr[1]] = attr[2].trim()
    }
    if (separator < 0) fail('E_CMS51_R1_EDITORIAL_COLUMNS_SEPARATOR_MISSING', 'editorial-columns body separator is missing')
    for (let cursor = separator + 1; cursor < lines.length; cursor += 1) {
      if (lines[cursor]?.trim() === '::') { closing = cursor; break }
    }
    if (closing < 0) fail('E_CMS51_R1_EDITORIAL_COLUMNS_CLOSE_MISSING', 'editorial-columns close marker is missing')
    const chunks = splitEditorialColumns(lines.slice(separator + 1, closing).join('\n'))
    if (chunks.length < 2) fail('E_CMS51_R1_EDITORIAL_COLUMNS_MISSING_COLUMNS', 'editorial-columns requires at least two columns')
    if (chunks.length > 4) fail('E_CMS51_R1_EDITORIAL_COLUMNS_TOO_MANY_COLUMNS', 'editorial-columns allows at most four columns', { actualColumns: chunks.length })
    const rawCols = attrs.cols ?? attrs.columns ?? ''
    const explicit = rawCols ? parseColumnCount(rawCols) : null
    if (rawCols && explicit === null) fail('E_CMS51_R1_EDITORIAL_COLUMNS_INVALID_COUNT', 'cols must be 2, 3, or 4', { value: rawCols })
    const resolved = explicit ?? chunks.length
    if (resolved !== chunks.length) fail('E_CMS51_R1_EDITORIAL_COLUMNS_COUNT_MISMATCH', 'explicit cols does not match actual column chunks', { explicitCols: resolved, actualColumns: chunks.length })
    index = closing
  }
}

const materialization = readJson('vacms-materialization-receipt.json', 'E_CMS207M_R3_MATERIALIZATION_RECEIPT_MISSING')
const exported = readJson('export-payload.json', 'E_CMS207M_R3_EXPORT_PAYLOAD_MISSING')
const taxonomy = readJson(path.join('config', 'public-content-taxonomy.json'), 'E_CMS207M_R3_PUBLIC_TAXONOMY_MISSING')

const generatedPath = String(materialization.generatedPath || '')
const sidecarPath = String(materialization.projectionSidecarPath || '')
const retiredPaths = Array.isArray(materialization.retiredPaths)
  ? [...new Set(materialization.retiredPaths.map((item) => String(item || '').replace(/\\/g, '/')).filter(Boolean))]
  : []

if (!safePagePath(generatedPath)) fail('E_CMS207M_R3_GENERATED_PATH_UNSAFE', generatedPath)
if (!safeSidecarPath(sidecarPath)) fail('E_CMS207M_R3_SIDECAR_PATH_UNSAFE', sidecarPath)
if (!fs.existsSync(generatedPath)) fail('E_CMS207M_R3_GENERATED_PAGE_MISSING', generatedPath)
if (!fs.existsSync(sidecarPath)) fail('E_CMS207M_R3_SIDECAR_MISSING', sidecarPath)

for (const retiredPath of retiredPaths) {
  if (!safePagePath(retiredPath) || retiredPath === generatedPath) fail('E_CMS207M_R3_RETIRED_PATH_UNSAFE', retiredPath)
  if (fs.existsSync(retiredPath)) fail('E_CMS207M_R3_RETIRED_PATH_STILL_VISIBLE', retiredPath)
}

const rawPage = fs.readFileSync(generatedPath, 'utf8')
const frontmatter = parseTopLevelFrontmatter(rawPage)
const publicKinds = new Set(Array.isArray(taxonomy.publicKinds) ? taxonomy.publicKinds : [])
const publicCategories = new Set(Array.isArray(taxonomy.publicCategories) ? taxonomy.publicCategories : [])

if (typeof frontmatter.kind !== 'string' || !publicKinds.has(frontmatter.kind)) fail('E_CMS207M_R3_PUBLIC_KIND_INVALID', 'materialized kind is outside public taxonomy', { kind: frontmatter.kind })
if (typeof frontmatter.category !== 'string' || !publicCategories.has(frontmatter.category)) fail('E_CMS207M_R3_PUBLIC_CATEGORY_INVALID', 'materialized category is outside public taxonomy', { category: frontmatter.category })
if (frontmatter.source !== 'vacms') fail('E_CMS207M_R3_SOURCE_AUTHORITY_INVALID', 'materialized source must be vacms')
if (typeof frontmatter.vacmsPageId !== 'string' || !frontmatter.vacmsPageId) fail('E_CMS207M_R3_PAGE_ID_MISSING', 'vacmsPageId is missing')
if (typeof frontmatter.vacmsRevisionId !== 'string' || !frontmatter.vacmsRevisionId) fail('E_CMS207M_R3_REVISION_ID_MISSING', 'vacmsRevisionId is missing')
if (frontmatter.vacmsProjectionSchema !== 'vacms-public-projection@1') fail('E_CMS207M_R3_PROJECTION_SCHEMA_INVALID', 'vacmsProjectionSchema is invalid')

const expected = exported?.data?.revision?.frontmatter && typeof exported.data.revision.frontmatter === 'object' && !Array.isArray(exported.data.revision.frontmatter)
  ? exported.data.revision.frontmatter
  : {}

for (const [key, value] of Object.entries(expected)) {
  if (typeof value === 'boolean' && (typeof frontmatter[key] !== 'boolean' || frontmatter[key] !== value)) {
    fail('E_CMS207M_R3_BOOLEAN_TYPE_LOSS', key + ' lost boolean identity', { field: key, expected: value, actual: frontmatter[key] })
  }
  if (typeof value === 'number' && Number.isFinite(value) && (typeof frontmatter[key] !== 'number' || frontmatter[key] !== value)) {
    fail('E_CMS207M_R3_NUMBER_TYPE_LOSS', key + ' lost numeric identity', { field: key, expected: value, actual: frontmatter[key] })
  }
}

const sidecar = readJson(sidecarPath, 'E_CMS207M_R3_SIDECAR_INVALID')
if (sidecar.schemaVersion !== 'vacms-public-projection@1') fail('E_CMS207M_R3_SIDECAR_SCHEMA_INVALID', 'projection sidecar schema is invalid')

validateEditorialColumns(rawPage)

const authorizedPaths = [generatedPath, sidecarPath, ...retiredPaths]
writeReceipt({
  ok: true,
  status: PASS,
  mainMutationAllowed: true,
  generatedPath,
  projectionSidecarPath: sidecarPath,
  retiredPaths,
  authorizedPaths,
  pageId: materialization.pageId || null,
  revisionId: materialization.revisionId || null,
  generatedAt: new Date().toISOString(),
})

console.log(PASS)
console.log('authorizedPaths=' + authorizedPaths.join(','))
