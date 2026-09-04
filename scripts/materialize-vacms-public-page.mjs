#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const payload = JSON.parse(fs.readFileSync('export-payload.json', 'utf8'))
if (!payload || payload.ok !== true || !payload.data) throw new Error('E_CMS207M_R3_EXPORT_PAYLOAD_NOT_OK')

const data = payload.data
if (data.schemaVersion !== 'vacms-publish-export-payload@r4') throw new Error(`E_CMS207M_R3_EXPORT_SCHEMA:${String(data.schemaVersion || '')}`)
if (!data.publicProjection || data.publicProjection.schemaVersion !== 'vacms-public-projection@1') throw new Error('E_CMS207M_R3_PUBLIC_PROJECTION_MISSING')

const generatedPath = String(data.snapshot?.generatedPath || '')
if (!/^src\/content\/pages\/.+\/index\.md$/.test(generatedPath)) throw new Error(`E_CMS207M_R3_GENERATED_PATH_UNSAFE:${generatedPath}`)
if (generatedPath.includes('..') || generatedPath.startsWith('/') || generatedPath.includes('\\')) throw new Error(`E_CMS207M_R3_GENERATED_PATH_UNSAFE:${generatedPath}`)

const normalizeRouteSlug = (value) => String(value || '').trim().replace(/^https?:\/\/[^/]+/i, '').replace(/[?#].*$/, '').replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
const contentDirFromGeneratedPath = (value) => String(value || '').replace(/^src\/content\/pages\//, '').replace(/\/index\.md$/, '').replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')

function normalizeStringArray(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function yamlScalar(value) {
  if (value === null || value === undefined) return '""'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('E_CMS207M_R3_NON_FINITE_FRONTMATTER_NUMBER')
    return String(value)
  }
  if (typeof value === 'object') return JSON.stringify(JSON.stringify(value))
  return JSON.stringify(String(value))
}

function yamlEntry([key, value]) {
  if (Array.isArray(value)) {
    if (value.length === 0) return key + ': []'
    return key + ':\n' + value.map((item) => '  - ' + yamlScalar(item)).join('\n')
  }
  return key + ': ' + yamlScalar(value)
}

const page = data.page || {}
const revision = data.revision || {}
const rawFrontmatter = revision.frontmatter && typeof revision.frontmatter === 'object' && !Array.isArray(revision.frontmatter) ? revision.frontmatter : {}
const routeSlug = normalizeRouteSlug(data.snapshot?.routePath)
const generatedPathSlug = contentDirFromGeneratedPath(generatedPath)
const rawFrontmatterSlug = normalizeRouteSlug(rawFrontmatter.slug)
const vacmsSlug = normalizeRouteSlug(page.slug)
const materializedSlug = routeSlug || generatedPathSlug || rawFrontmatterSlug || vacmsSlug || 'page'
const slugSource = routeSlug ? 'routePath' : generatedPathSlug ? 'generatedPath' : rawFrontmatterSlug ? 'frontmatter.slug' : vacmsSlug ? 'page.slug' : 'fallback'

const frontmatter = {
  ...rawFrontmatter,
  title: page.title || rawFrontmatter.title || 'Untitled',
  summary: page.summary || rawFrontmatter.summary || '',
  category: page.category || rawFrontmatter.category || 'page',
  slug: materializedSlug,
  source: 'vacms',
  vacmsSlug,
  vacmsPageId: page.id || data.job?.pageId || '',
  vacmsRevisionId: revision.id || data.job?.revisionId || '',
  vacmsProjectionSchema: 'vacms-public-projection@1',
}
frontmatter.tags = normalizeStringArray(frontmatter.tags)

const bodySource = typeof revision.compiledMarkdown === 'string' && revision.compiledMarkdown.trim()
  ? { kind: 'compiledMarkdown', value: revision.compiledMarkdown }
  : { kind: 'sourceBody', value: String(revision.sourceBody || '') }

const yaml = Object.entries(frontmatter).map(yamlEntry).join('\n')
const body = bodySource.value.replace(/^---[\s\S]*?---\s*/, '')
const content = `---\n${yaml}\n---\n\n${body}`

fs.mkdirSync(path.dirname(generatedPath), { recursive: true })
fs.writeFileSync(generatedPath, content, 'utf8')

const safePageId = String(page.id || data.job?.pageId || '').trim().replace(/[^A-Za-z0-9._-]/g, '_')
if (!safePageId) throw new Error('E_CMS207M_R3_PAGE_ID_MISSING_FOR_SIDECAR')

const projectionSidecarPath = `src/content/generated/vacms-pages/${safePageId}.projection.json`
fs.mkdirSync(path.dirname(projectionSidecarPath), { recursive: true })
fs.writeFileSync(projectionSidecarPath, JSON.stringify(data.publicProjection, null, 2) + '\n', 'utf8')

const receipt = {
  jobId: data.job?.id || process.env.JOB_ID,
  pageId: page.id || null,
  revisionId: revision.id || null,
  generatedPath,
  projectionSidecarPath,
  projectionSchemaVersion: data.publicProjection.schemaVersion,
  routePath: data.snapshot?.routePath || null,
  materializedSlug,
  vacmsSlug,
  generatedPathSlug,
  slugSource,
  source: bodySource.kind,
}
fs.writeFileSync('vacms-materialization-receipt.json', JSON.stringify(receipt, null, 2) + '\n', 'utf8')
fs.writeFileSync('vacms-generated-path.txt', generatedPath + '\n', 'utf8')

console.log('PASS_CMS_207M_R3_PUBLIC_PAGE_MATERIALIZED')
console.log('generatedPath=' + generatedPath)
console.log('projectionSidecarPath=' + projectionSidecarPath)
