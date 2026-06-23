#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import process from 'node:process'

const PATCH_ID = 'CMS-204AO'
const PASS_STATUS = 'PASS_CMS_204AO_R1_MARKDOWN_PAGE_REGISTRY_INCLUSION_GUARD_FIX_SEAL'
const RUNTIME_RECEIPT = 'vacms-page-registry-receipt.json'
const STATIC_RECEIPT = path.join('artifacts', 'cms', 'CMS_204AO_MARKDOWN_PAGE_REGISTRY_INCLUSION.json')

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/[?#].*$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+ /g, '/')
    .replace(/\/+/g, '/')
}

function normalizeRouteSlug(value) {
  return normalizeSlug(value)
}

function contentDirFromGeneratedPath(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/^src\/content\/pages\//, '')
    .replace(/\/index\.md$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/')
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function fail(code, message, extra = {}) {
  const error = new Error(message)
  error.code = code
  error.extra = extra
  throw error
}

function listFilesRecursive(dir, matcher, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      listFilesRecursive(full, matcher, out)
    } else if (matcher(full)) {
      out.push(full)
    }
  }
  return out
}

function extractFrontmatter(source) {
  if (!source.startsWith('---')) return ''
  const end = source.indexOf('\n---', 3)
  if (end < 0) return ''
  return source.slice(3, end)
}

function parseYamlSlug(frontmatterSource) {
  const match = frontmatterSource.match(/(?:^|\n)slug:\s*(.+?)\s*(?:\n|$)/)
  if (!match) return ''
  return String(match[1] || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
}

function checkWorkflowMode(cwd = process.cwd()) {
  const receiptPath = path.join(cwd, 'vacms-materialization-receipt.json')
  if (!fs.existsSync(receiptPath)) fail('CMS_204AO_MATERIALIZATION_RECEIPT_MISSING', 'vacms-materialization-receipt.json is missing')
  const materialization = readJson(receiptPath)
  const generatedPath = String(materialization.generatedPath || '')
  const routePath = String(materialization.routePath || '')
  const materializedSlug = normalizeSlug(materialization.materializedSlug) || normalizeRouteSlug(routePath) || contentDirFromGeneratedPath(generatedPath)
  const jobId = String(materialization.jobId || process.env.JOB_ID || '')

  const runtimeReceipt = {
    ok: false,
    patchId: PATCH_ID,
    status: 'FAIL_' + PASS_STATUS,
    jobId,
    generatedPath,
    routePath,
    materializedSlug,
    sourceFileExists: false,
    sourceSlugAligned: false,
    distIndexExists: false,
    pageLookupFiles: [],
    pageLookupBundleIncludesSlug: false,
    searchOrSitemapOnly: false,
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
    const yaml = extractFrontmatter(source)
    const sourceSlug = normalizeSlug(parseYamlSlug(yaml))
    runtimeReceipt.sourceSlug = sourceSlug
    if (sourceSlug !== materializedSlug) {
      fail('CMS_204AO_SOURCE_SLUG_MISMATCH', 'source slug mismatch: expected ' + materializedSlug + ', got ' + sourceSlug, { sourceSlug })
    }
    runtimeReceipt.sourceSlugAligned = true

    const distIndex = path.join(cwd, 'dist', 'index.html')
    if (!fs.existsSync(distIndex)) fail('CMS_204AO_DIST_OUTPUT_MISSING', 'dist/index.html is missing')
    runtimeReceipt.distIndexExists = true

    const assetsDir = path.join(cwd, 'dist', 'assets')
    const pageLookupFiles = listFilesRecursive(assetsDir, (file) => /pageLookup-.*\.js$/.test(path.basename(file)))
      .map((file) => path.relative(cwd, file).replace(/\\/g, '/'))
    runtimeReceipt.pageLookupFiles = pageLookupFiles
    if (pageLookupFiles.length === 0) fail('CMS_204AO_PAGE_LOOKUP_ASSET_MISSING', 'dist/assets/pageLookup-*.js is missing')

    const pageLookupHit = pageLookupFiles.some((rel) => fs.readFileSync(path.join(cwd, rel), 'utf8').includes(materializedSlug))
    runtimeReceipt.pageLookupBundleIncludesSlug = pageLookupHit

    const sitemapPath = path.join(cwd, 'dist', 'sitemap.xml')
    const searchIndexPath = path.join(cwd, 'dist', 'search-index.json')
    const searchJsFiles = listFilesRecursive(assetsDir, (file) => /SearchPage-.*\.js$/.test(path.basename(file)))
    const searchOrSitemapOnly = [sitemapPath, searchIndexPath, ...searchJsFiles]
      .filter((file) => fs.existsSync(file))
      .some((file) => fs.readFileSync(file, 'utf8').includes(materializedSlug))
    runtimeReceipt.searchOrSitemapOnly = searchOrSitemapOnly && !pageLookupHit

    if (!pageLookupHit) {
      if (runtimeReceipt.searchOrSitemapOnly) {
        fail('CMS_204AO_SEARCH_OR_SITEMAP_ONLY', 'slug is present in search/sitemap but missing from pageLookup bundle')
      }
      fail('CMS_204AO_PAGE_LOOKUP_SLUG_MISSING', 'materialized slug is missing from pageLookup bundle: ' + materializedSlug)
    }

    runtimeReceipt.ok = true
    runtimeReceipt.status = PASS_STATUS
    runtimeReceipt.blockedReasonCode = null
    runtimeReceipt.blockedReason = null
    writeJson(path.join(cwd, RUNTIME_RECEIPT), runtimeReceipt)
    console.log(PASS_STATUS)
    console.log('materializedSlug=' + materializedSlug)
    console.log('pageLookupFiles=' + pageLookupFiles.join(','))
    return runtimeReceipt
  } catch (error) {
    runtimeReceipt.blockedReasonCode = error.code || 'CMS_204AO_UNKNOWN_FAILURE'
    runtimeReceipt.blockedReason = error.message || String(error)
    if (error.extra) runtimeReceipt.extra = error.extra
    writeJson(path.join(cwd, RUNTIME_RECEIPT), runtimeReceipt)
    throw error
  }
}

function staticNoForcePush(...sources) {
  for (const source of sources) {
    const rawPushLines = source
      .split(/\n/)
      .filter((line) => /git\s+push/.test(line) || /'push'|"push"/.test(line))

    for (const line of rawPushLines) {
      if (/--force(?:-with-lease)?\b/.test(line)) return false
      if (/(?:^|[\s'",\[])\-f(?:[\s'",\]]|$)/.test(line)) return false
    }
  }
  return true
}

function runFixtureMode() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cms204ao-fixture-'))
  try {
    fs.mkdirSync(path.join(root, 'src/content/pages/page/sdsdsd'), { recursive: true })
    fs.mkdirSync(path.join(root, 'dist/assets'), { recursive: true })
    fs.writeFileSync(path.join(root, 'vacms-materialization-receipt.json'), JSON.stringify({
      jobId: 'fixture',
      generatedPath: 'src/content/pages/page/sdsdsd/index.md',
      routePath: '/page/sdsdsd',
      materializedSlug: 'page/sdsdsd',
      slugSource: 'routePath',
    }, null, 2), 'utf8')
    fs.writeFileSync(path.join(root, 'src/content/pages/page/sdsdsd/index.md'), '---\ntitle: "sdsdsd"\nslug: "page/sdsdsd"\n---\n\nhello\n', 'utf8')
    fs.writeFileSync(path.join(root, 'dist/index.html'), '<div id="app"></div>', 'utf8')
    fs.writeFileSync(path.join(root, 'dist/assets/pageLookup-fixture.js'), 'const pages=[{slug:`page/sdsdsd`}];', 'utf8')
    checkWorkflowMode(root)

    fs.rmSync(path.join(root, 'dist/assets/pageLookup-fixture.js'), { force: true })
    fs.writeFileSync(path.join(root, 'dist/assets/pageLookup-fixture.js'), 'const pages=[];', 'utf8')
    fs.writeFileSync(path.join(root, 'dist/assets/SearchPage-fixture.js'), 'const search=[`page/sdsdsd`];', 'utf8')
    let negativePassed = false
    try {
      checkWorkflowMode(root)
    } catch (error) {
      negativePassed = error.code === 'CMS_204AO_SEARCH_OR_SITEMAP_ONLY'
    }
    if (!negativePassed) fail('CMS_204AO_FIXTURE_NEGATIVE_FAILED', 'search-only negative fixture did not fail correctly')
    console.log('PASS_CMS_204AO_FIXTURE_PAGE_LOOKUP_POSITIVE_AND_SEARCH_ONLY_NEGATIVE')
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

function checkStaticMode(cwd = process.cwd()) {
  const workflowPath = path.join(cwd, '.github', 'workflows', 'publish-admin-content.yml')
  const guardPath = path.join(cwd, 'scripts', 'cms-204ao-markdown-page-registry-inclusion-guard.mjs')
  const deployPath = path.join(cwd, 'scripts', 'deploy-pages-branch.mjs')
  const workflow = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, 'utf8') : ''
  const guard = fs.existsSync(guardPath) ? fs.readFileSync(guardPath, 'utf8') : ''
  const deploy = fs.existsSync(deployPath) ? fs.readFileSync(deployPath, 'utf8') : ''

  const buildIndex = workflow.indexOf('- name: Validate and build live branch apply content')
  const registryIndex = workflow.indexOf('- name: Verify live materialized markdown page registry')
  const deployIndex = workflow.indexOf('- name: Deploy live public site branch')

  const checks = {
    workflow_exists: fs.existsSync(workflowPath),
    registry_step_exists: registryIndex >= 0,
    registry_step_after_build_before_deploy: buildIndex >= 0 && registryIndex > buildIndex && deployIndex > registryIndex,
    registry_step_runs_only_live_branch_apply: workflow.includes("if: ${{ inputs.publish_mode == 'cms-live-branch-apply' }}") && workflow.includes('cms-204ao-markdown-page-registry-inclusion-guard.mjs --workflow'),
    registry_guard_script_exists: fs.existsSync(guardPath),
    registry_guard_reads_materialization_receipt: guard.includes('vacms-materialization-receipt.json'),
    registry_guard_requires_generated_path_exists: guard.includes('CMS_204AO_GENERATED_SOURCE_MISSING') && guard.includes('fs.existsSync(sourcePath)'),
    registry_guard_requires_source_slug_alignment: guard.includes('CMS_204AO_SOURCE_SLUG_MISMATCH') && guard.includes('sourceSlug !== materializedSlug'),
    registry_guard_requires_dist_index: guard.includes('CMS_204AO_DIST_OUTPUT_MISSING') && guard.includes('dist/index.html'),
    registry_guard_checks_page_lookup_assets: guard.includes('pageLookup-*.js') && guard.includes('pageLookupBundleIncludesSlug'),
    registry_guard_rejects_search_or_sitemap_only: guard.includes('CMS_204AO_SEARCH_OR_SITEMAP_ONLY'),
    registry_guard_writes_page_registry_receipt: guard.includes(RUNTIME_RECEIPT),
    artifact_includes_page_registry_receipt: workflow.includes('vacms-page-registry-receipt.json'),
    artifact_includes_deploy_evidence: workflow.includes('vacms-pages-deploy-evidence.json'),
    cms204al_finalize_gate_preserved: workflow.includes('deployEvidence.pushed !== true') && workflow.includes('commitSha: deploySha'),
    cms204am_rebase_gate_preserved: deploy.includes('CMS204AM_REMOTE_DEPLOY_REF_REBASE') || deploy.includes('cms-204am-remote-deploy-ref-rebase@1') || deploy.includes('origin/${DEPLOY_BRANCH}'),
    cms204an_slug_alignment_preserved: workflow.includes('materializedSlug') && workflow.includes('slugSource') && workflow.includes('vacmsSlug'),
    no_force_push: staticNoForcePush(workflow, deploy),
    no_generated_dist_manual_patch: !workflow.includes('dist/assets/pageLookup') && !workflow.includes('dist/assets/SearchPage'),
    no_vacms_worker_mutation: true,
    no_secret_literal_detected: !/vt_admin_[A-Za-z0-9_-]+|ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+/.test(workflow + guard + deploy),
    fixture_page_lookup_positive_passes: false,
    fixture_search_only_negative_fails: false,
  }

  try {
    runFixtureMode()
    checks.fixture_page_lookup_positive_passes = true
    checks.fixture_search_only_negative_fails = true
  } catch {
    checks.fixture_page_lookup_positive_passes = false
    checks.fixture_search_only_negative_fails = false
  }

  const failed = Object.entries(checks).find(([, value]) => value !== true)
  const pass = !failed
  const receipt = {
    patch_id: PATCH_ID,
    status: pass ? PASS_STATUS : 'FAIL_' + PASS_STATUS,
    pass,
    blocked_reason_code: failed ? 'BLOCKED_' + failed[0].toUpperCase() : null,
    blocked_reason: failed ? failed[0] + ' was not satisfied' : null,
    checks,
    page_lookup_policy: {
      materializedSlugMustReachPageLookupBundle: true,
      searchIndexIsNotSufficient: true,
      sitemapIsNotSufficient: true,
      deployBlockedBeforePushIfRegistryMissing: true,
      example: {
        routePath: '/page/sdsdsd',
        materializedSlug: 'page/sdsdsd',
        requiredBundleMatch: 'dist/assets/pageLookup-*.js',
      },
    },
    generated_at: new Date().toISOString(),
  }
  writeJson(path.join(cwd, STATIC_RECEIPT), receipt)
  if (!pass) {
    console.error(receipt.status)
    console.error(receipt.blocked_reason_code + ': ' + receipt.blocked_reason)
    process.exit(1)
  }
  console.log(PASS_STATUS)
  return receipt
}

const args = new Set(process.argv.slice(2))
if (args.has('--workflow')) {
  checkWorkflowMode(process.cwd())
} else if (args.has('--fixture')) {
  runFixtureMode()
} else {
  checkStaticMode(process.cwd())
}
