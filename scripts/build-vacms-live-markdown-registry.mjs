#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const PATCH_ID = 'CMS-204AP'
const PASS_STATUS = 'PASS_CMS_204AP_LIVE_MATERIALIZED_MARKDOWN_REGISTRY_SOURCE_REBIND_SOURCE_WRITTEN'
const REGISTRY_MODULE = 'src/markdown/vacmsLivePages.generated.ts'

function fail(code, message) {
  const error = new Error(message)
  error.code = code
  throw error
}

function normalizeRouteSlug(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/[?#].*$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/')
}

function contentDirFromGeneratedPath(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/^src\/content\/pages\//, '')
    .replace(/\/index\.md$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/')
}

function readJson(file, code) {
  if (!fs.existsSync(file)) fail(code, `${file} is missing`)
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function registryModuleContent(entries) {
  return `export type VacmsLiveMarkdownPageSource = {\n` +
    `  sourcePath: string\n` +
    `  contentDir: string\n` +
    `  materializedSlug: string\n` +
    `  routePath: string\n` +
    `  raw: string\n` +
    `}\n\n` +
    `export const vacmsLiveMarkdownPageSources: VacmsLiveMarkdownPageSource[] = ${JSON.stringify(entries, null, 2)}\n`
}

function buildFromReceipt() {
  const receipt = readJson('vacms-materialization-receipt.json', 'CMS_204AP_MATERIALIZATION_RECEIPT_MISSING')
  const generatedPath = String(receipt.generatedPath || '')
  if (!generatedPath) fail('CMS_204AP_GENERATED_PATH_MISSING', 'generatedPath is missing from vacms-materialization-receipt.json')
  if (!fs.existsSync(generatedPath)) fail('CMS_204AP_GENERATED_MARKDOWN_MISSING', `generated markdown does not exist: ${generatedPath}`)

  const routePath = String(receipt.routePath || '')
  const materializedSlug = normalizeRouteSlug(receipt.materializedSlug) || normalizeRouteSlug(routePath) || contentDirFromGeneratedPath(generatedPath)
  if (!materializedSlug) fail('CMS_204AP_MATERIALIZED_SLUG_MISSING', 'materialized slug could not be resolved')

  const raw = fs.readFileSync(generatedPath, 'utf8')
  const contentDir = contentDirFromGeneratedPath(generatedPath) || materializedSlug
  const entries = [{
    sourcePath: generatedPath.replace(/\\/g, '/'),
    contentDir,
    materializedSlug,
    routePath,
    raw,
  }]

  fs.mkdirSync(path.dirname(REGISTRY_MODULE), { recursive: true })
  fs.writeFileSync(REGISTRY_MODULE, registryModuleContent(entries), 'utf8')

  const runtimeReceipt = {
    ok: true,
    patchId: PATCH_ID,
    status: PASS_STATUS,
    generatedPath,
    routePath,
    materializedSlug,
    contentDir,
    registryModule: REGISTRY_MODULE,
    rawLength: raw.length,
    generatedAt: new Date().toISOString(),
  }
  fs.writeFileSync('vacms-live-markdown-registry-source-rebind.json', JSON.stringify(runtimeReceipt, null, 2))
  console.log(PASS_STATUS)
}

function runFixture() {
  const fixtureDir = path.join(process.cwd(), 'tmp', 'cms-204ap-fixture')
  fs.rmSync(fixtureDir, { recursive: true, force: true })
  fs.mkdirSync(path.join(fixtureDir, 'src/content/pages/page/sdsdsd'), { recursive: true })
  fs.mkdirSync(path.join(fixtureDir, 'src/markdown'), { recursive: true })
  fs.writeFileSync(path.join(fixtureDir, 'src/content/pages/page/sdsdsd/index.md'), `---\ntitle: "sdsdsd"\nslug: "page/sdsdsd"\nsource: "vacms"\n---\n\nhello\n`, 'utf8')
  fs.writeFileSync(path.join(fixtureDir, 'vacms-materialization-receipt.json'), JSON.stringify({
    generatedPath: 'src/content/pages/page/sdsdsd/index.md',
    routePath: '/page/sdsdsd',
    materializedSlug: 'page/sdsdsd',
    slugSource: 'routePath',
  }, null, 2), 'utf8')

  const old = process.cwd()
  process.chdir(fixtureDir)
  try {
    buildFromReceipt()
    const out = fs.readFileSync(REGISTRY_MODULE, 'utf8')
    if (!out.includes('page/sdsdsd')) fail('CMS_204AP_FIXTURE_OUTPUT_MISSING_SLUG', 'fixture registry module did not include page/sdsdsd')
  } finally {
    process.chdir(old)
    fs.rmSync(fixtureDir, { recursive: true, force: true })
  }
}

try {
  if (process.argv.includes('--fixture')) {
    runFixture()
  } else {
    buildFromReceipt()
  }
} catch (error) {
  const code = error?.code || 'CMS_204AP_GENERATED_REGISTRY_WRITE_FAILED'
  console.error(code + ': ' + (error instanceof Error ? error.message : String(error)))
  process.exit(1)
}
