#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import process from 'node:process'

const PATCH_ID = 'CMS-204AO'
const EVIDENCE_PATCH_ID = 'CMS-204AQ'
const PASS_STATUS = 'PASS_CMS_204AQ_LIVE_REGISTRY_REBIND_EVIDENCE_EXPANSION_POST_BUILD_BUNDLE_CANDIDATE_AUDIT_SEAL'
const PAGE_REGISTRY_RECEIPT = 'vacms-page-registry-receipt.json'
const AP_REBIND_RECEIPT = 'vacms-live-markdown-registry-source-rebind.json'
const REGISTRY_OWNER_TOKENS = ['vacmsLiveMarkdownPageSources', 'loadMarkdownPages', 'createRouteManifest', 'markdownSlugs']

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/')
}

function normalizeSlug(value) {
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

function listFilesRecursive(dir, matcher, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) listFilesRecursive(full, matcher, out)
    else if (matcher(full)) out.push(full)
  }
  return out
}

function extractFrontmatter(source) {
  const text = String(source || '')
  if (!text.startsWith('---')) return ''
  const end = text.indexOf('\n---', 3)
  if (end < 0) return ''
  return text.slice(3, end)
}

function parseYamlSlug(frontmatterSource) {
  const match = String(frontmatterSource || '').match(/(?:^|\n)slug:\s*(.+?)\s*(?:\n|$)/)
  if (!match) return ''
  return String(match[1] || '').trim().replace(/^['"]|['"]$/g, '')
}

function classifyJsFile(file, content) {
  const base = path.basename(file)
  const namedRegistryCandidate = /^(useRouteManifest|pageLookup|MarkdownPage|index)-.*\.js$/.test(base)
  const searchOnly = /^SearchPage-.*\.js$/.test(base)
  const ownerTokens = REGISTRY_OWNER_TOKENS.filter((token) => content.includes(token))
  const ownerTokenCandidate = ownerTokens.length > 0
  const registryCandidate = !searchOnly && (namedRegistryCandidate || ownerTokenCandidate)
  const unknownRuntime = !searchOnly && !namedRegistryCandidate
  return { base, namedRegistryCandidate, searchOnly, ownerTokens, ownerTokenCandidate, registryCandidate, unknownRuntime }
}

function auditBundles(cwd, materializedSlug, routePath, vacmsSlug) {
  const assetsDir = path.join(cwd, 'dist', 'assets')
  const jsFiles = listFilesRecursive(assetsDir, (file) => /\.js$/.test(path.basename(file)))
    .sort((a, b) => normalizeSlash(a).localeCompare(normalizeSlash(b)))

  const hits = []
  const registryCandidateFiles = []
  const searchOnlyFiles = []
  const unknownRuntimeFiles = []

  for (const absolute of jsFiles) {
    const rel = normalizeSlash(path.relative(cwd, absolute))
    const content = fs.readFileSync(absolute, 'utf8')
    const classification = classifyJsFile(absolute, content)
    if (classification.registryCandidate) registryCandidateFiles.push(rel)
    if (classification.searchOnly) searchOnlyFiles.push(rel)
    if (classification.unknownRuntime) unknownRuntimeFiles.push(rel)

    const containsMaterializedSlug = content.includes(materializedSlug)
    const containsRoutePath = routePath ? content.includes(routePath) : false
    const containsVacmsSlug = vacmsSlug ? content.includes(vacmsSlug) : false
    if (containsMaterializedSlug || containsRoutePath || containsVacmsSlug) {
      hits.push({
        file: rel,
        base: classification.base,
        kind: classification.searchOnly
          ? 'search-only'
          : classification.registryCandidate
            ? 'registry-candidate'
            : 'unknown-runtime',
        namedRegistryCandidate: classification.namedRegistryCandidate,
        ownerTokenCandidate: classification.ownerTokenCandidate,
        ownerTokens: classification.ownerTokens,
        containsMaterializedSlug,
        containsRoutePath,
        containsVacmsSlug,
        byteLength: Buffer.byteLength(content),
        sha256: sha256(content),
      })
    }
  }

  const searchIndexPath = path.join(cwd, 'dist', 'search-index.json')
  const sitemapPath = path.join(cwd, 'dist', 'sitemap.xml')
  for (const absolute of [searchIndexPath, sitemapPath]) {
    if (!fs.existsSync(absolute)) continue
    const rel = normalizeSlash(path.relative(cwd, absolute))
    const content = fs.readFileSync(absolute, 'utf8')
    const containsMaterializedSlug = content.includes(materializedSlug)
    const containsRoutePath = routePath ? content.includes(routePath) : false
    if (containsMaterializedSlug || containsRoutePath) {
      hits.push({
        file: rel,
        base: path.basename(absolute),
        kind: 'search-only',
        namedRegistryCandidate: false,
        ownerTokenCandidate: false,
        ownerTokens: [],
        containsMaterializedSlug,
        containsRoutePath,
        containsVacmsSlug: false,
        byteLength: Buffer.byteLength(content),
        sha256: sha256(content),
      })
    }
  }

  const registryHits = hits.filter((hit) => hit.kind === 'registry-candidate' && hit.containsMaterializedSlug)
  const searchOnlyHits = hits.filter((hit) => hit.kind === 'search-only' && (hit.containsMaterializedSlug || hit.containsRoutePath))
  const unknownRuntimeHits = hits.filter((hit) => hit.kind === 'unknown-runtime' && hit.containsMaterializedSlug)
  const unknownRuntimeWithOwnerHits = unknownRuntimeHits.filter((hit) => hit.ownerTokens.length > 0)
  const unknownRuntimeWithoutOwnerHits = unknownRuntimeHits.filter((hit) => hit.ownerTokens.length === 0)

  return {
    distAssetsDir: 'dist/assets',
    materializedSlug,
    allJsFileCount: jsFiles.length,
    allJsFiles: jsFiles.map((file) => normalizeSlash(path.relative(cwd, file))),
    registryCandidateFiles,
    searchOnlyFiles,
    unknownRuntimeFiles,
    hits,
    registryHits,
    searchOnlyHits,
    unknownRuntimeHits,
    unknownRuntimeWithOwnerHits,
    unknownRuntimeWithoutOwnerHits,
  }
}

function loadApEvidence(cwd) {
  const file = path.join(cwd, AP_REBIND_RECEIPT)
  if (!fs.existsSync(file)) return null
  return readJson(file)
}

function checkWorkflowMode(cwd = process.cwd()) {
  const receiptPath = path.join(cwd, 'vacms-materialization-receipt.json')
  if (!fs.existsSync(receiptPath)) fail('CMS_204AO_MATERIALIZATION_RECEIPT_MISSING', 'vacms-materialization-receipt.json is missing')
  const materialization = readJson(receiptPath)
  const generatedPath = normalizeSlash(materialization.generatedPath || '')
  const routePath = String(materialization.routePath || '')
  const materializedSlug = normalizeSlug(materialization.materializedSlug) || normalizeSlug(routePath) || contentDirFromGeneratedPath(generatedPath)
  const vacmsSlug = normalizeSlug(materialization.vacmsSlug)
  const jobId = String(materialization.jobId || process.env.JOB_ID || '')

  const runtimeReceipt = {
    ok: false,
    patchId: PATCH_ID,
    evidencePatchId: EVIDENCE_PATCH_ID,
    status: 'FAIL_' + PASS_STATUS,
    jobId,
    generatedPath,
    routePath,
    materializedSlug,
    vacmsSlug,
    sourceFileExists: false,
    sourceSlugAligned: false,
    distIndexExists: false,
    pageLookupFiles: [],
    routeManifestFiles: [],
    pageLookupBundleIncludesSlug: false,
    registryBundleIncludesSlug: false,
    searchOrSitemapOnly: false,
    apRebindEvidence: null,
    bundleAudit: null,
    blockedReasonCode: null,
    blockedReason: null,
    generatedAt: new Date().toISOString(),
  }

  try {
    if (!generatedPath) fail('CMS_204AO_GENERATED_PATH_MISSING', 'generatedPath is missing')
    if (!materializedSlug) fail('CMS_204AO_MATERIALIZED_SLUG_MISSING', 'materializedSlug is missing')

    const sourcePath = path.join(cwd, generatedPath)
    if (!fs.existsSync(sourcePath)) fail('CMS_204AO_GENERATED_SOURCE_MISSING', 'generated source is missing: ' + generatedPath)
    runtimeReceipt.sourceFileExists = true
    const source = fs.readFileSync(sourcePath, 'utf8')
    const sourceSlug = normalizeSlug(parseYamlSlug(extractFrontmatter(source)))
    runtimeReceipt.sourceSlug = sourceSlug
    if (sourceSlug !== materializedSlug) {
      fail('CMS_204AO_SOURCE_SLUG_MISMATCH', 'source slug mismatch: expected ' + materializedSlug + ', got ' + sourceSlug, { sourceSlug })
    }
    runtimeReceipt.sourceSlugAligned = true

    const apEvidence = loadApEvidence(cwd)
    runtimeReceipt.apRebindEvidence = apEvidence
    if (!apEvidence) fail('CMS_204AQ_AP_REBIND_RECEIPT_MISSING', 'AP rebind receipt is missing')
    if (!Number.isFinite(Number(apEvidence.entryCount)) || Number(apEvidence.entryCount) < 1) {
      fail('CMS_204AQ_AP_REBIND_ENTRY_MISSING', 'AP rebind receipt has no entries')
    }
    if (!Number.isFinite(Number(apEvidence.generatedModuleLength)) || Number(apEvidence.generatedModuleLength) <= 0) {
      fail('CMS_204AQ_GENERATED_MODULE_EMPTY', 'generated registry module is empty')
    }
    const modulePath = path.join(cwd, String(apEvidence.generatedModulePath || 'src/markdown/vacmsLivePages.generated.ts'))
    if (!fs.existsSync(modulePath)) fail('CMS_204AQ_GENERATED_MODULE_EMPTY', 'generated registry module file is missing')
    const generatedModule = fs.readFileSync(modulePath, 'utf8')
    if (!generatedModule.includes(materializedSlug)) {
      fail('CMS_204AQ_GENERATED_MODULE_SLUG_MISSING', 'generated registry module does not include ' + materializedSlug)
    }

    const distIndex = path.join(cwd, 'dist', 'index.html')
    if (!fs.existsSync(distIndex)) fail('CMS_204AO_DIST_OUTPUT_MISSING', 'dist/index.html is missing')
    runtimeReceipt.distIndexExists = true

    const assetsDir = path.join(cwd, 'dist', 'assets')
    const audit = auditBundles(cwd, materializedSlug, routePath, vacmsSlug)
    runtimeReceipt.bundleAudit = audit
    runtimeReceipt.pageLookupFiles = audit.allJsFiles.filter((file) => /^dist\/assets\/pageLookup-.*\.js$/.test(file))
    runtimeReceipt.routeManifestFiles = audit.registryCandidateFiles
    runtimeReceipt.pageLookupBundleIncludesSlug = audit.hits.some((hit) => /^pageLookup-.*\.js$/.test(hit.base) && hit.containsMaterializedSlug)
    runtimeReceipt.registryBundleIncludesSlug = audit.registryHits.length > 0 || audit.unknownRuntimeWithOwnerHits.length > 0
    runtimeReceipt.searchOrSitemapOnly = !runtimeReceipt.registryBundleIncludesSlug && audit.searchOnlyHits.length > 0

    if (!fs.existsSync(assetsDir)) fail('CMS_204AO_PAGE_LOOKUP_ASSET_MISSING', 'dist/assets is missing')
    if (audit.allJsFileCount < 1) fail('CMS_204AO_PAGE_LOOKUP_ASSET_MISSING', 'dist/assets/*.js is missing')

    if (runtimeReceipt.registryBundleIncludesSlug) {
      runtimeReceipt.ok = true
      runtimeReceipt.status = PASS_STATUS
      runtimeReceipt.blockedReasonCode = null
      runtimeReceipt.blockedReason = null
      writeJson(path.join(cwd, PAGE_REGISTRY_RECEIPT), runtimeReceipt)
      console.log(PASS_STATUS)
      console.log('materializedSlug=' + materializedSlug)
      console.log('registryHits=' + audit.registryHits.map((hit) => hit.file).join(','))
      return runtimeReceipt
    }

    if (audit.unknownRuntimeWithoutOwnerHits.length > 0) {
      fail('CMS_204AQ_UNKNOWN_RUNTIME_HIT_WITHOUT_REGISTRY_OWNERSHIP', 'slug appears in unknown runtime chunk without registry ownership token')
    }

    if (runtimeReceipt.searchOrSitemapOnly) {
      fail('CMS_204AO_SEARCH_OR_SITEMAP_ONLY', 'slug is present in search/sitemap but missing from runtime registry bundle')
    }

    fail('CMS_204AO_PAGE_LOOKUP_SLUG_MISSING', 'materialized slug is missing from runtime registry bundle: ' + materializedSlug)
  } catch (error) {
    runtimeReceipt.blockedReasonCode = error.code || 'CMS_204AO_UNKNOWN_FAILURE'
    runtimeReceipt.blockedReason = error.message || String(error)
    if (error.extra) runtimeReceipt.extra = error.extra
    writeJson(path.join(cwd, PAGE_REGISTRY_RECEIPT), runtimeReceipt)
    throw error
  }
}

function writeMaterializationFixture(root) {
  fs.mkdirSync(path.join(root, 'src/content/pages/page/sdsdsd'), { recursive: true })
  fs.mkdirSync(path.join(root, 'src/markdown'), { recursive: true })
  fs.mkdirSync(path.join(root, 'dist/assets'), { recursive: true })
  writeJson(path.join(root, 'vacms-materialization-receipt.json'), {
    jobId: 'fixture',
    generatedPath: 'src/content/pages/page/sdsdsd/index.md',
    routePath: '/page/sdsdsd',
    materializedSlug: 'page/sdsdsd',
    vacmsSlug: 'sdsdsd',
    slugSource: 'routePath',
  })
  fs.writeFileSync(path.join(root, 'src/content/pages/page/sdsdsd/index.md'), '---\ntitle: "sdsdsd"\nslug: "page/sdsdsd"\n---\n\nhello\n', 'utf8')
  fs.writeFileSync(path.join(root, 'src/markdown/vacmsLivePages.generated.ts'), 'export const vacmsLiveMarkdownPageSources=[{materializedSlug:`page/sdsdsd`,raw:`hello`}]', 'utf8')
  writeJson(path.join(root, AP_REBIND_RECEIPT), {
    ok: true,
    patchId: 'CMS-204AP',
    evidencePatchId: 'CMS-204AQ',
    entryCount: 1,
    generatedModulePath: 'src/markdown/vacmsLivePages.generated.ts',
    generatedModuleLength: 91,
    entries: [{ materializedSlug: 'page/sdsdsd', rawLength: 5, rawSha256: sha256('hello') }],
  })
  fs.writeFileSync(path.join(root, 'dist/index.html'), '<div id="app"></div>', 'utf8')
}

function expectFailure(code, fn) {
  try {
    fn()
  } catch (error) {
    return error.code === code
  }
  return false
}

function fixtureMode() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cms204aq-ao-fixture-'))
  try {
    writeMaterializationFixture(root)
    fs.writeFileSync(path.join(root, 'dist/assets/useRouteManifest-fixture.js'), 'const x=`vacmsLiveMarkdownPageSources page/sdsdsd`;', 'utf8')
    checkWorkflowMode(root)

    fs.rmSync(path.join(root, 'dist/assets'), { recursive: true, force: true })
    fs.mkdirSync(path.join(root, 'dist/assets'), { recursive: true })
    fs.writeFileSync(path.join(root, 'dist/assets/SearchPage-fixture.js'), 'const search=[`page/sdsdsd`];', 'utf8')
    if (!expectFailure('CMS_204AO_SEARCH_OR_SITEMAP_ONLY', () => checkWorkflowMode(root))) {
      fail('CMS_204AQ_FIXTURE_SEARCH_ONLY_FAILED', 'search-only fixture did not fail as expected')
    }

    fs.rmSync(path.join(root, 'dist/assets'), { recursive: true, force: true })
    fs.mkdirSync(path.join(root, 'dist/assets'), { recursive: true })
    fs.writeFileSync(path.join(root, 'dist/assets/chunk-abc.js'), 'const orphan=`page/sdsdsd`;', 'utf8')
    if (!expectFailure('CMS_204AQ_UNKNOWN_RUNTIME_HIT_WITHOUT_REGISTRY_OWNERSHIP', () => checkWorkflowMode(root))) {
      fail('CMS_204AQ_FIXTURE_UNKNOWN_WITHOUT_OWNER_FAILED', 'unknown runtime without owner fixture did not fail as expected')
    }

    fs.rmSync(path.join(root, 'dist/assets'), { recursive: true, force: true })
    fs.mkdirSync(path.join(root, 'dist/assets'), { recursive: true })
    fs.writeFileSync(path.join(root, 'dist/assets/chunk-def.js'), 'const ok=`page/sdsdsd vacmsLiveMarkdownPageSources`;', 'utf8')
    checkWorkflowMode(root)

    console.log('PASS_CMS_204AQ_AO_BUNDLE_AUDIT_FIXTURES')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

if (process.argv.includes('--fixture')) fixtureMode()
else checkWorkflowMode()
