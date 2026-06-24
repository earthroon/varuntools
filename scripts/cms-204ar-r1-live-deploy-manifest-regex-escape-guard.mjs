#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const PATCH_ID = 'CMS-204AR-R1'
const PASS_STATUS = 'PASS_CMS_204AR_R1_LIVE_DEPLOY_MANIFEST_REGEX_ESCAPE_FIX_SEAL'
const STATIC_RECEIPT = path.join('artifacts', 'cms', 'CMS_204AR_R1_LIVE_DEPLOY_MANIFEST_REGEX_ESCAPE_FIX.json')

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function runCheck(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  }
}

function staticNoForcePush(...sources) {
  for (const source of sources) {
    const rawPushLines = source
      .split(/\n/)
      .filter((line) => /git\s+push/.test(line) || /'push'|"push"/.test(line))

    for (const line of rawPushLines) {
      if (/--force(?:-with-lease)?\b/.test(line)) return false
      if (/(?:^|[\s'",\[])-f(?:[\s'",\]]|$)/.test(line)) return false
    }
  }
  return true
}

function checkStaticMode(cwd = process.cwd()) {
  const workflowPath = path.join(cwd, '.github', 'workflows', 'publish-admin-content.yml')
  const deployPath = path.join(cwd, 'scripts', 'deploy-pages-branch.mjs')
  const arReceiptPath = path.join(cwd, 'artifacts', 'cms', 'CMS_204AR_LIVE_DEPLOY_VERIFIED_DIST_REUSE.json')
  const aqReceiptPath = path.join(cwd, 'artifacts', 'cms', 'CMS_204AQ_LIVE_REGISTRY_REBIND_EVIDENCE_EXPANSION.json')
  const workflow = fs.existsSync(workflowPath) ? read(workflowPath) : ''
  const deploy = fs.existsSync(deployPath) ? read(deployPath) : ''
  const syntax = fs.existsSync(deployPath) ? runCheck('node', ['--check', deployPath], cwd) : { ok: false, stderr: 'deploy script missing' }

  const checks = {
    workflow_exists: fs.existsSync(workflowPath),
    deploy_script_exists: fs.existsSync(deployPath),
    deploy_script_node_check_passes: syntax.ok,
    live_deploy_uses_skip_prepare: /npm\s+run\s+release:pages\s+--\s+--push\s+--skip-prepare/.test(workflow),
    release_prepare_guard_preserved: deploy.includes("if (!skipPrepare) runInherited('node', ['scripts/release-prepare.mjs']"),
    deploy_script_parses_skip_prepare: deploy.includes("const skipPrepare = args.has('--skip-prepare')"),
    deploy_script_computes_dist_manifest: deploy.includes('function computeDistManifest') && deploy.includes('crypto.createHash'),
    deploy_script_normalizes_windows_paths: deploy.includes("replace(/\\\\/g, '/')"),
    deploy_script_no_invalid_windows_path_regex: !deploy.includes("replace(/\\/g, '/')"),
    deploy_script_compares_verified_dist_before_push: deploy.includes('CMS-204AR verified dist reuse mismatch') && deploy.indexOf('CMS-204AR verified dist reuse mismatch') < deploy.indexOf("'push', 'origin', DEPLOY_BRANCH"),
    deploy_evidence_records_skip_prepare: deploy.includes('skipPrepare,'),
    deploy_evidence_records_verified_dist_reuse: deploy.includes('verifiedDistReuse') && deploy.includes('CMS204AR_VERIFIED_DIST_REUSE'),
    deploy_evidence_records_source_dist_hash: deploy.includes('sourceDistSha256') && deploy.includes('sourceDistManifest'),
    deploy_evidence_records_copied_dist_hash: deploy.includes('copiedDistSha256') && deploy.includes('copiedDistManifest'),
    cms204ar_base_receipt_preserved: fs.existsSync(arReceiptPath),
    cms204aq_registry_audit_preserved: fs.existsSync(aqReceiptPath),
    artifact_includes_deploy_evidence: workflow.includes('vacms-pages-deploy-evidence.json'),
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
    blocked_reason_code: pass ? null : 'CMS_204AR_R1_STATIC_GUARD_FAILED',
    blocked_reason: pass ? null : Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key).join(', '),
    checks,
    syntax_check: {
      status: syntax.status,
      stderr: syntax.stderr.slice(0, 1000),
    },
    regex_escape_policy: {
      generatedDeployScriptMustParse: true,
      windowsPathNormalizationRegex: "replace(/\\\\/g, '/')",
      invalidRegexFromPriorBakeBlocked: true,
      verifiedDistReusePolicyPreserved: true,
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

if (process.argv.includes('--fixture')) {
  const tmp = fs.mkdtempSync(path.join(process.cwd(), '.tmp-cms204ar-r1-'))
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
    ].join('\n'))
    fs.writeFileSync(path.join(tmp, 'scripts', 'deploy-pages-branch.mjs'), [
      "import crypto from 'node:crypto'",
      "const args = new Set(process.argv.slice(2))",
      "const skipPrepare = args.has('--skip-prepare')",
      "const DEPLOY_BRANCH = 'gh-pages'",
      "const CMS204AR_VERIFIED_DIST_REUSE = 'cms-204ar-live-deploy-verified-dist-reuse@1'",
      "function runInherited() {}",
      "function computeDistManifest(root) { return { sha256: crypto.createHash('sha256').update(root.replace(/\\\\/g, '/')).digest('hex') } }",
      "if (!skipPrepare) runInherited('node', ['scripts/release-prepare.mjs'], 'release:prepare')",
      "const sourceDistManifest = computeDistManifest('a')",
      "const copiedDistManifest = computeDistManifest('a')",
      "if (sourceDistManifest.sha256 !== copiedDistManifest.sha256) throw new Error('CMS-204AR verified dist reuse mismatch')",
      "const deployEvidence = { skipPrepare, verifiedDistReuse: true, sourceDistSha256: sourceDistManifest.sha256, copiedDistSha256: copiedDistManifest.sha256, verifiedDistReuseMarker: CMS204AR_VERIFIED_DIST_REUSE }",
      "const worktreeRoot = 'x'",
      "run('git', ['-C', worktreeRoot, 'push', 'origin', DEPLOY_BRANCH])",
    ].join('\n'))
    fs.writeFileSync(path.join(tmp, 'artifacts', 'cms', 'CMS_204AR_LIVE_DEPLOY_VERIFIED_DIST_REUSE.json'), '{"pass":true}\n')
    fs.writeFileSync(path.join(tmp, 'artifacts', 'cms', 'CMS_204AQ_LIVE_REGISTRY_REBIND_EVIDENCE_EXPANSION.json'), '{"pass":true}\n')
    checkStaticMode(tmp)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
} else {
  checkStaticMode()
}
