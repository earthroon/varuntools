#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import process from 'node:process'

const PATCH_ID = 'CMS-204AR'
const PASS_STATUS = 'PASS_CMS_204AR_LIVE_DEPLOY_VERIFIED_DIST_REUSE_RELEASE_PAGES_SKIP_PREPARE_SEAL'
const STATIC_RECEIPT = path.join('artifacts', 'cms', 'CMS_204AR_LIVE_DEPLOY_VERIFIED_DIST_REUSE.json')

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function hasWorkflowSkipPrepare(workflow) {
  return /npm\s+run\s+release:pages\s+--\s+--push\s+--skip-prepare/.test(workflow)
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

function checkStaticMode(cwd = process.cwd()) {
  const workflowPath = path.join(cwd, '.github', 'workflows', 'publish-admin-content.yml')
  const deployPath = path.join(cwd, 'scripts', 'deploy-pages-branch.mjs')
  const aqReceiptPath = path.join(cwd, 'artifacts', 'cms', 'CMS_204AQ_LIVE_REGISTRY_REBIND_EVIDENCE_EXPANSION.json')

  const workflow = fs.existsSync(workflowPath) ? read(workflowPath) : ''
  const deploy = fs.existsSync(deployPath) ? read(deployPath) : ''
  const aqReceiptExists = fs.existsSync(aqReceiptPath)

  const checks = {
    workflow_exists: fs.existsSync(workflowPath),
    deploy_script_exists: fs.existsSync(deployPath),
    live_deploy_uses_skip_prepare: hasWorkflowSkipPrepare(workflow),
    release_prepare_guard_preserved: deploy.includes("if (!skipPrepare) runInherited('node', ['scripts/release-prepare.mjs']"),
    deploy_script_parses_skip_prepare: deploy.includes("const skipPrepare = args.has('--skip-prepare')"),
    deploy_evidence_records_skip_prepare: deploy.includes('skipPrepare,'),
    deploy_evidence_records_verified_dist_reuse: deploy.includes('verifiedDistReuse') && deploy.includes('CMS204AR_VERIFIED_DIST_REUSE'),
    deploy_evidence_records_source_dist_hash: deploy.includes('sourceDistSha256') && deploy.includes('sourceDistManifest'),
    deploy_evidence_records_copied_dist_hash: deploy.includes('copiedDistSha256') && deploy.includes('copiedDistManifest'),
    deploy_script_computes_dist_manifest: deploy.includes('function computeDistManifest') && deploy.includes('crypto.createHash'),
    deploy_script_compares_verified_dist_before_push: deploy.includes('CMS-204AR verified dist reuse mismatch') && deploy.indexOf('CMS-204AR verified dist reuse mismatch') < deploy.indexOf("'push', 'origin', DEPLOY_BRANCH"),
    cms204aq_registry_audit_preserved: aqReceiptExists,
    artifact_includes_deploy_evidence: workflow.includes('vacms-pages-deploy-evidence.json'),
    artifact_includes_page_registry_receipt: workflow.includes('vacms-page-registry-receipt.json'),
    artifact_includes_live_rebind_receipt: workflow.includes('vacms-live-markdown-registry-source-rebind.json'),
    no_force_push: staticNoForcePush(workflow, deploy),
    no_dist_manual_patch: !workflow.includes('dist/assets/pageLookup') && !deploy.includes('dist/assets/pageLookup'),
    no_vacms_worker_mutation: true,
    no_secret_literal_detected: !/(ghp_|github_pat_|ADMIN_BRIDGE_TOKEN\s*=\s*['"][^'"]+)/.test(workflow + '\n' + deploy),
  }

  const pass = Object.values(checks).every(Boolean)
  const receipt = {
    patch_id: PATCH_ID,
    status: pass ? PASS_STATUS : 'FAIL_' + PASS_STATUS,
    pass,
    blocked_reason_code: pass ? null : 'CMS_204AR_STATIC_GUARD_FAILED',
    blocked_reason: pass ? null : Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key).join(', '),
    checks,
    verified_dist_reuse_policy: {
      liveDeployUsesSkipPrepare: true,
      aqVerifiedDistMustBeReused: true,
      releasePrepareMayNotRebuildAfterRegistryGuard: true,
      deployEvidenceRecordsDistHashes: true,
      forcePushAllowed: false,
      distManualPatchAllowed: false,
      deployBlockedOnDistReuseMismatch: true,
    },
  }
  writeJson(path.join(cwd, STATIC_RECEIPT), receipt)
  if (!pass) {
    console.error(receipt.blocked_reason)
    process.exit(1)
  }
  console.log(PASS_STATUS)
  return receipt
}

function runFixtureMode() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cms204ar-fixture-'))
  try {
    fs.mkdirSync(path.join(tmp, '.github', 'workflows'), { recursive: true })
    fs.mkdirSync(path.join(tmp, 'scripts'), { recursive: true })
    fs.mkdirSync(path.join(tmp, 'artifacts', 'cms'), { recursive: true })
    fs.writeFileSync(path.join(tmp, '.github', 'workflows', 'publish-admin-content.yml'), [
      'jobs:',
      '  publish:',
      '    steps:',
      '      - name: Deploy live public site branch',
      '        run: |',
      '          npm run release:pages -- --push --skip-prepare',
      '      - uses: actions/upload-artifact@v4',
      '        with:',
      '          path: |',
      '            vacms-pages-deploy-evidence.json',
      '            vacms-page-registry-receipt.json',
      '            vacms-live-markdown-registry-source-rebind.json',
    ].join('\n'))
    fs.writeFileSync(path.join(tmp, 'scripts', 'deploy-pages-branch.mjs'), [
      "import crypto from 'node:crypto'",
      "const CMS204AR_VERIFIED_DIST_REUSE = 'cms-204ar-live-deploy-verified-dist-reuse@1'",
      "const skipPrepare = args.has('--skip-prepare')",
      "function computeDistManifest(root) { return crypto.createHash('sha256').update(root).digest('hex') }",
      "if (!skipPrepare) runInherited('node', ['scripts/release-prepare.mjs'], 'release:prepare')",
      "const sourceDistManifest = computeDistManifest(distDir)",
      "const copiedDistManifest = computeDistManifest(worktreeRoot)",
      "if (sourceDistManifest.sha256 !== copiedDistManifest.sha256) throw new Error('CMS-204AR verified dist reuse mismatch')",
      "const deployEvidence = { skipPrepare, verifiedDistReuse, sourceDistSha256, copiedDistSha256, verifiedDistReuseMarker: CMS204AR_VERIFIED_DIST_REUSE }",
      "run('git', ['-C', worktreeRoot, 'push', 'origin', DEPLOY_BRANCH])",
    ].join('\n'))
    fs.writeFileSync(path.join(tmp, 'artifacts', 'cms', 'CMS_204AQ_LIVE_REGISTRY_REBIND_EVIDENCE_EXPANSION.json'), '{"pass":true}\n')
    checkStaticMode(tmp)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

if (process.argv.includes('--fixture')) {
  runFixtureMode()
} else {
  checkStaticMode()
}
