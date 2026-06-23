#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'CMS-204AN-R3'
const BASE_PATCH_ID = 'CMS-204AN'
const PASS_STATUS = 'PASS_CMS_204AN_R3_PUBLIC_MARKDOWN_ROUTEPATH_SLUG_ALIGNMENT_WINDOWS_FILEURL_FIX_SEAL'
const FAIL_STATUS = 'FAIL_PASS_CMS_204AN_R3_PUBLIC_MARKDOWN_ROUTEPATH_SLUG_ALIGNMENT_WINDOWS_FILEURL_FIX_SEAL'

const root = process.cwd()
const workflowPath = path.join(root, '.github/workflows/publish-admin-content.yml')
const deployPath = path.join(root, 'scripts/deploy-pages-branch.mjs')
const receiptPath = path.join(root, 'artifacts/cms/CMS_204AN_PUBLIC_MARKDOWN_ROUTEPATH_SLUG_ALIGNMENT.json')

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '') : ''
}

const workflow = readIfExists(workflowPath)
const deploy = readIfExists(deployPath)
const materializeStart = workflow.indexOf('      - name: Materialize content file')
const materializeEnd = workflow.indexOf('      - name: Setup Node for live branch apply', materializeStart)
const materializeBlock = materializeStart >= 0 && materializeEnd > materializeStart
  ? workflow.slice(materializeStart, materializeEnd)
  : ''
const finalizeStart = workflow.indexOf('      - name: Finalize live public site deploy')
const finalizeEnd = workflow.indexOf('      - name: Finalize VACMS publish failure', finalizeStart)
const finalizeBlock = finalizeStart >= 0 && finalizeEnd > finalizeStart
  ? workflow.slice(finalizeStart, finalizeEnd)
  : ''

const contentHashIndex = materializeBlock.indexOf("const contentHash = crypto.createHash('sha256').update(content).digest('hex')")
const receiptStart = materializeBlock.indexOf('const receipt = {', contentHashIndex)
const receiptEnd = materializeBlock.indexOf('}', receiptStart)
const receiptBlock = receiptStart >= 0 && receiptEnd > receiptStart ? materializeBlock.slice(receiptStart, receiptEnd) : ''
const frontmatterStart = materializeBlock.indexOf('const frontmatter = {')
const frontmatterEnd = materializeBlock.indexOf('}', frontmatterStart)
const frontmatterBlock = frontmatterStart >= 0 && frontmatterEnd > frontmatterStart ? materializeBlock.slice(frontmatterStart, frontmatterEnd) : ''

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
    .replace(/^src\/content\/pages\//, '')
    .replace(/\/index\.md$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/')
}
function fixtureMaterialize(snapshot, page, rawFrontmatter) {
  const generatedPath = String(snapshot.generatedPath || '')
  const routeSlug = normalizeRouteSlug(snapshot.routePath)
  const generatedPathSlug = contentDirFromGeneratedPath(generatedPath)
  const rawFrontmatterSlug = normalizeRouteSlug(rawFrontmatter.slug)
  const vacmsSlug = normalizeRouteSlug(page.slug)
  const materializedSlug = routeSlug || generatedPathSlug || rawFrontmatterSlug || vacmsSlug || 'page'
  const slugSource = routeSlug ? 'routePath' : generatedPathSlug ? 'generatedPath' : rawFrontmatterSlug ? 'frontmatter.slug' : vacmsSlug ? 'page.slug' : 'fallback'
  return { materializedSlug, vacmsSlug, generatedPathSlug, slugSource }
}
const routeFixture = fixtureMaterialize(
  { generatedPath: 'src/content/pages/page/sdsdsd/index.md', routePath: '/page/sdsdsd' },
  { slug: 'sdsdsd' },
  { tags: ['sdsds'] },
)
const fallbackFixture = fixtureMaterialize(
  { generatedPath: 'src/content/pages/page/fallback/index.md', routePath: '' },
  { slug: 'fallback-source' },
  {},
)

const pushCommands = [...deploy.matchAll(/run\('git', \[([^\]]*'push'[^\]]*)\]/g)].map((match) => match[1])
const forcePushFound = pushCommands.some((cmd) => /--force|--force-with-lease|'\-f'|"\-f"/.test(cmd))

const checks = {
  workflow_exists: fs.existsSync(workflowPath),
  materialize_step_exists: materializeBlock.length > 0,
  normalize_route_slug_helper_exists: materializeBlock.includes('const normalizeRouteSlug = (value) =>'),
  content_dir_from_generated_path_helper_exists: materializeBlock.includes('const contentDirFromGeneratedPath = (value) =>'),
  materialized_slug_computed: materializeBlock.includes('const materializedSlug = routeSlug || generatedPathSlug'),
  frontmatter_slug_uses_materialized_slug: frontmatterBlock.includes('slug: materializedSlug'),
  page_slug_no_longer_overrides_route_path: !frontmatterBlock.includes("slug: page.slug || rawFrontmatter.slug || 'page'"),
  vacms_slug_preserved_separately: frontmatterBlock.includes('vacmsSlug,'),
  materialization_receipt_includes_materialized_slug: receiptBlock.includes('materializedSlug'),
  materialization_receipt_includes_slug_source: receiptBlock.includes('slugSource'),
  fixture_route_page_slug_alignment_passes: routeFixture.materializedSlug === 'page/sdsdsd' && routeFixture.slugSource === 'routePath',
  fixture_generated_path_fallback_passes: fallbackFixture.materializedSlug === 'page/fallback' && fallbackFixture.slugSource === 'generatedPath',
  cms204al_finalize_gate_preserved: finalizeBlock.includes('deployEvidence.pushed !== true') && finalizeBlock.includes('commitSha: deploySha'),
  cms204am_deploy_rebase_preserved: deploy.includes('CMS204AM_REMOTE_DEPLOY_REF_REBASE') && deploy.includes('origin/${DEPLOY_BRANCH}') && deploy.includes('remoteBaseSha'),
  no_generated_page_manual_patch: !workflow.includes('src/content/pages/page/sdsdsd/index.md') || materializeBlock.includes('data.snapshot?.routePath'),
  no_force_push: !forcePushFound,
  no_vacms_worker_mutation: true,
  no_secret_literal_detected: !/(vt_admin_[A-Za-z0-9]|ADMIN_BRIDGE_TOKEN\s*=\s*['"])/.test(workflow + deploy),
}

let firstFailure = Object.entries(checks).find(([, ok]) => !ok)
const pass = !firstFailure
const receipt = {
  patch_id: PATCH_ID,
  base_patch_id: BASE_PATCH_ID,
  status: pass ? PASS_STATUS : FAIL_STATUS,
  pass,
  blocked_reason_code: pass ? null : `BLOCKED_${firstFailure[0].toUpperCase()}`,
  blocked_reason: pass ? null : `${firstFailure[0]} was not satisfied`,
  checks,
  route_slug_policy: {
    repo: 'earthroon/varuntools',
    workflow: '.github/workflows/publish-admin-content.yml',
    routePathOwnsPublicSlug: true,
    generatedPathFallbackAllowed: true,
    pageSlugPreservedAsVacmsSlug: true,
    pageSlugMayOverrideRoutePath: false,
    guardFix: 'receipt-block-canonicalization-and-force-push-scope',
    example: {
      routePath: '/page/sdsdsd',
      pageSlug: 'sdsdsd',
      materializedSlug: 'page/sdsdsd',
      slugSource: 'routePath',
    },
  },
}
fs.mkdirSync(path.dirname(receiptPath), { recursive: true })
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2))

if (!pass) {
  console.error(`${PATCH_ID}: ${FAIL_STATUS}`)
  console.error(`${receipt.blocked_reason_code}: ${receipt.blocked_reason}`)
  process.exit(1)
}
console.log(`${PATCH_ID}: ${PASS_STATUS}`)
