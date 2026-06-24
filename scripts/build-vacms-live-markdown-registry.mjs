#!/usr/bin/env node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import process from 'node:process'

const PATCH_ID = 'CMS-204AQ'
const BASE_PATCH_ID = 'CMS-204AP'
const REGISTRY_MODULE = path.join('src', 'markdown', 'vacmsLivePages.generated.ts')
const RUNTIME_RECEIPT = 'vacms-live-markdown-registry-source-rebind.json'
const SOURCE_WRITE_STATUS = 'PASS_CMS_204AP_LIVE_MATERIALIZED_MARKDOWN_REGISTRY_SOURCE_REBIND_SOURCE_WRITTEN'
const AQ_EVIDENCE_MARKER = 'cms-204aq-live-registry-rebind-evidence-expansion@1'

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/')
}

function normalizeRouteSlug(value) {
  return normalizeSlash(value)
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/[?#].*$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+ /g, '/')
    .replace(/\/+/g, '/')
}

function contentDirFromGeneratedPath(value) {
  return normalizeSlash(value)
    .replace(/^src\/content\/pages\//, '')
    .replace(/\/index\.md$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/')
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function safePreview(value, max = 500) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '?')
    .slice(0, max)
}

function fail(code, message, extra = {}) {
  const error = new Error(message)
  error.code = code
  error.extra = extra
  throw error
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function extractFrontmatter(source) {
  const text = String(source || '')
  if (!text.startsWith('---')) return ''
  const end = text.indexOf('\n---', 3)
  if (end < 0) return ''
  return text.slice(3, end)
}

function parseYamlScalar(frontmatterSource, key) {
  const re = new RegExp('(?:^|\\n)' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*(.+?)\\s*(?:\\n|$)')
  const match = String(frontmatterSource || '').match(re)
  if (!match) return ''
  return String(match[1] || '').trim().replace(/^['"]|['"]$/g, '')
}

function moduleSource(entries) {
  return [
    'export type VacmsLiveMarkdownPageSource = {',
    '  sourcePath: string',
    '  contentDir: string',
    '  materializedSlug: string',
    '  routePath: string',
    '  raw: string',
    '}',
    '',
    `export const vacmsLiveMarkdownPageSources: VacmsLiveMarkdownPageSource[] = ${JSON.stringify(entries, null, 2)}`,
    '',
  ].join('\n')
}

function writeEmptyGeneratedModule(cwd = process.cwd()) {
  const target = path.join(cwd, REGISTRY_MODULE)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, moduleSource([]), 'utf8')
}

function buildWorkflowMode(cwd = process.cwd()) {
  const receiptPath = path.join(cwd, 'vacms-materialization-receipt.json')
  if (!fs.existsSync(receiptPath)) fail('CMS_204AP_MATERIALIZATION_RECEIPT_MISSING', 'vacms-materialization-receipt.json is missing')

  const receipt = readJson(receiptPath)
  const generatedPath = normalizeSlash(receipt.generatedPath || '')
  if (!generatedPath) fail('CMS_204AP_GENERATED_PATH_MISSING', 'generatedPath is missing')
  const routePath = String(receipt.routePath || '')
  const materializedSlug = normalizeRouteSlug(receipt.materializedSlug) || normalizeRouteSlug(routePath) || contentDirFromGeneratedPath(generatedPath)
  if (!materializedSlug) fail('CMS_204AP_MATERIALIZED_SLUG_MISSING', 'materialized slug could not be resolved')

  const absoluteGeneratedPath = path.join(cwd, generatedPath)
  if (!fs.existsSync(absoluteGeneratedPath)) fail('CMS_204AP_GENERATED_MARKDOWN_MISSING', 'generated markdown is missing: ' + generatedPath)

  const raw = fs.readFileSync(absoluteGeneratedPath, 'utf8')
  const contentDir = contentDirFromGeneratedPath(generatedPath) || materializedSlug
  const frontmatterSlug = normalizeRouteSlug(parseYamlScalar(extractFrontmatter(raw), 'slug'))

  const entries = [{
    sourcePath: generatedPath,
    contentDir,
    materializedSlug,
    routePath,
    raw,
  }]

  const registryModuleSource = moduleSource(entries)
  const registryModulePath = path.join(cwd, REGISTRY_MODULE)
  fs.mkdirSync(path.dirname(registryModulePath), { recursive: true })
  fs.writeFileSync(registryModulePath, registryModuleSource, 'utf8')

  if (!fs.existsSync(registryModulePath)) fail('CMS_204AP_GENERATED_REGISTRY_WRITE_FAILED', 'generated registry module was not written')
  const generatedModuleText = fs.readFileSync(registryModulePath, 'utf8')

  const runtimeReceipt = {
    ok: true,
    patchId: BASE_PATCH_ID,
    evidencePatchId: PATCH_ID,
    status: SOURCE_WRITE_STATUS,
    evidenceExpansionMarker: AQ_EVIDENCE_MARKER,
    jobId: receipt.jobId || process.env.JOB_ID || null,
    generatedPath,
    routePath,
    materializedSlug,
    contentDir,
    registryModule: REGISTRY_MODULE,
    generatedModuleExistsAfterWrite: true,
    generatedModulePath: REGISTRY_MODULE,
    generatedModuleLength: generatedModuleText.length,
    generatedModuleSha256: sha256(generatedModuleText),
    generatedModulePreview: safePreview(generatedModuleText),
    entryCount: entries.length,
    entries: [{
      sourcePath: generatedPath,
      contentDir,
      materializedSlug,
      routePath,
      rawLength: raw.length,
      rawSha256: sha256(raw),
      frontmatterSlug,
    }],
    rawLength: raw.length,
    rawSha256: sha256(raw),
    generatedAt: new Date().toISOString(),
  }
  writeJson(path.join(cwd, RUNTIME_RECEIPT), runtimeReceipt)
  console.log(SOURCE_WRITE_STATUS)
  console.log('materializedSlug=' + materializedSlug)
  console.log('generatedModuleLength=' + generatedModuleText.length)
  return runtimeReceipt
}

function fixtureMode() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cms204aq-ap-fixture-'))
  try {
    fs.mkdirSync(path.join(root, 'src/content/pages/page/sdsdsd'), { recursive: true })
    fs.writeFileSync(path.join(root, 'src/content/pages/page/sdsdsd/index.md'), '---\ntitle: "sdsdsd"\nslug: "page/sdsdsd"\n---\n\nhello\n', 'utf8')
    writeJson(path.join(root, 'vacms-materialization-receipt.json'), {
      jobId: 'fixture',
      generatedPath: 'src/content/pages/page/sdsdsd/index.md',
      routePath: '/page/sdsdsd',
      materializedSlug: 'page/sdsdsd',
      slugSource: 'routePath',
    })
    const receipt = buildWorkflowMode(root)
    if (receipt.entryCount !== 1) fail('CMS_204AQ_FIXTURE_ENTRY_COUNT_FAILED', 'fixture entry count failed')
    if (!fs.readFileSync(path.join(root, REGISTRY_MODULE), 'utf8').includes('page/sdsdsd')) fail('CMS_204AQ_FIXTURE_MODULE_SLUG_FAILED', 'fixture module missing slug')
    console.log('PASS_CMS_204AQ_AP_BUILDER_FIXTURE')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

const mode = process.argv.includes('--fixture') ? 'fixture' : 'workflow'
if (mode === 'fixture') fixtureMode()
else buildWorkflowMode()
