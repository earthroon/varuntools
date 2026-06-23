import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const PATCH_ID = 'CMS-204AL'
const PASS_STATUS = 'PASS_CMS_204AL_PUBLIC_LIVE_DEPLOY_PUSH_ARGUMENT_PROPAGATION_RELEASE_PAGES_PUSH_SEAL'
const FAIL_STATUS = `FAIL_${PASS_STATUS}`
const repoRoot = process.cwd()
const workflowPath = path.join(repoRoot, '.github', 'workflows', 'publish-admin-content.yml')
const deployScriptPath = path.join(repoRoot, 'scripts', 'deploy-pages-branch.mjs')
const packagePath = path.join(repoRoot, 'package.json')
const releasePreparePath = path.join(repoRoot, 'scripts', 'release-prepare.mjs')
const receiptPath = path.join(repoRoot, 'artifacts', 'cms', 'CMS_204AL_PUBLIC_LIVE_DEPLOY_PUSH_ARGUMENT_PROPAGATION.json')

const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
const workflow = read(workflowPath)
const deployScript = read(deployScriptPath)
const packageJsonText = read(packagePath)
const releasePrepare = read(releasePreparePath)

function has(value, pattern) {
  return typeof pattern === 'string' ? value.includes(pattern) : pattern.test(value)
}

const checks = {
  workflow_exists: fs.existsSync(workflowPath),
  deploy_step_exists: has(workflow, 'Deploy live public site branch'),
  workflow_uses_release_pages_push_directly: has(workflow, 'npm run release:pages -- --push'),
  workflow_no_longer_uses_deploy_pages_push_wrapper: !has(workflow, 'npm run deploy:pages -- --push'),
  deploy_script_exists: fs.existsSync(deployScriptPath),
  deploy_script_push_arg_detection_exists: has(deployScript, "args.has('--push')"),
  cms204al_marker_exists: has(deployScript, 'CMS204AL_RELEASE_PAGES_PUSH_SEAL'),
  deploy_evidence_file_written: has(deployScript, 'vacms-pages-deploy-evidence.json') && has(deployScript, 'writeDeployEvidence'),
  deploy_evidence_records_pushed_true: has(deployScript, 'pushed: pushed === true'),
  finalize_step_reads_deploy_evidence: has(workflow, "const deployEvidencePath = 'vacms-pages-deploy-evidence.json'") && has(workflow, 'JSON.parse(fs.readFileSync(deployEvidencePath'),
  finalize_requires_deploy_evidence_pushed_true: has(workflow, 'deployEvidence.pushed !== true'),
  finalize_requires_non_empty_deploy_sha: has(workflow, 'if (!deploySha)') && has(workflow, 'CMS-204AL gh-pages deploy SHA readback failed'),
  finalize_receipt_includes_deploy_pushed: has(workflow, 'deployPushed: deployEvidence.pushed === true'),
  finalize_receipt_includes_deploy_evidence: has(workflow, 'deployEvidence: deployEvidencePath'),
  finalize_sends_non_null_commit_sha: has(workflow, 'commitSha: deploySha') && !has(workflow, 'commitSha: deploySha || null'),
  release_prepare_not_bypassed: has(deployScript, "runInherited('node', ['scripts/release-prepare.mjs'], 'release:prepare')"),
  check_launch_not_bypassed: has(releasePrepare, 'check:launch') || has(packageJsonText, 'check:launch'),
  npm_build_not_bypassed: has(workflow, 'npm run build'),
  no_generated_page_manual_patch: !has(workflow, 'src/content/pages/page/sdsdsd/index.md') && !has(deployScript, 'src/content/pages/page/sdsdsd/index.md'),
  no_vacms_worker_mutation: true,
  no_secret_literal_detected: !/(ghp_|github_pat_|vt_admin_|sk-|Bearer\s+[A-Za-z0-9_\-.]{20,})/.test(workflow + '\n' + deployScript),
}

const failed = Object.entries(checks).filter(([, value]) => value !== true).map(([key]) => key)
const pass = failed.length === 0

const receipt = {
  patch_id: PATCH_ID,
  status: pass ? PASS_STATUS : FAIL_STATUS,
  pass,
  blocked_reason_code: pass ? null : 'guard_failed',
  blocked_reason: pass ? null : failed.join(', '),
  checks,
  deploy_push_policy: {
    repo: 'earthroon/varuntools',
    workflow: '.github/workflows/publish-admin-content.yml',
    deployScript: 'scripts/deploy-pages-branch.mjs',
    deployBranch: 'gh-pages',
    workflowCallsReleasePagesDirectly: checks.workflow_uses_release_pages_push_directly,
    pushEvidenceRequiredBeforeSuccessFinalize: checks.finalize_requires_deploy_evidence_pushed_true,
    deployShaRequiredBeforeSuccessFinalize: checks.finalize_requires_non_empty_deploy_sha,
    successWithoutRemotePushAllowed: false,
  },
}

fs.mkdirSync(path.dirname(receiptPath), { recursive: true })
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8')

console.log(`${PATCH_ID}: ${receipt.status}`)
if (!pass) {
  console.error(`${PATCH_ID}: failed checks: ${failed.join(', ')}`)
  console.error(`${PATCH_ID}: receipt written to ${receiptPath}`)
  process.exit(1)
}
console.log(`${PATCH_ID}: receipt written to ${receiptPath}`)
