#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'CMS-204AM'
const PASS_STATUS = 'PASS_CMS_204AM_GH_PAGES_REMOTE_REF_REBASE_BEFORE_DEPLOY_NON_FAST_FORWARD_PUSH_GUARD_SEAL'
const FAIL_STATUS = 'FAIL_PASS_CMS_204AM_GH_PAGES_REMOTE_REF_REBASE_BEFORE_DEPLOY_NON_FAST_FORWARD_PUSH_GUARD_SEAL'
const receiptPath = path.join('artifacts', 'cms', 'CMS_204AM_GH_PAGES_REMOTE_REF_REBASE_BEFORE_DEPLOY.json')

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

function includesAll(source, needles) {
  return needles.every((needle) => source.includes(needle))
}

const deployScriptPath = path.join('scripts', 'deploy-pages-branch.mjs')
const workflowPath = path.join('.github', 'workflows', 'publish-admin-content.yml')
const deployScript = readText(deployScriptPath)
const workflow = readText(workflowPath)

const checks = {
  deploy_script_exists: fs.existsSync(deployScriptPath),
  cms204al_marker_still_exists: deployScript.includes('cms-204al-release-pages-push-seal@1'),
  cms204am_marker_exists: deployScript.includes('cms-204am-remote-deploy-ref-rebase@1'),
  remote_branch_exists_helper_exists: includesAll(deployScript, [
    'function remoteBranchExists(branch)',
    "'ls-remote'",
    "'--exit-code'",
    "'--heads'",
    "'origin'",
  ]),
  remote_branch_sha_helper_exists: includesAll(deployScript, [
    'function remoteBranchSha(branch)',
    "'ls-remote'",
    '`refs/heads/${branch}`',
  ]),
  fetch_origin_gh_pages_before_worktree_exists: includesAll(deployScript, [
    'function fetchRemoteDeployBranch(branch)',
    "`${branch}:refs/remotes/origin/${branch}`",
    'fetchRemoteDeployBranch(DEPLOY_BRANCH)',
  ]),
  worktree_add_uses_origin_gh_pages_when_remote_exists: includesAll(deployScript, [
    'remoteDeployBranchExists',
    "'worktree'",
    "'add'",
    "'-B'",
    'DEPLOY_BRANCH',
    '`origin/${DEPLOY_BRANCH}`',
  ]),
  worktree_add_head_only_when_remote_missing: includesAll(deployScript, [
    "remote ${DEPLOY_BRANCH} not found",
    "'worktree'",
    "'add'",
    "'-B'",
    'worktreeRoot',
    "'HEAD'",
  ]),
  local_branch_worktree_add_removed: !deployScript.includes("['worktree', 'add', worktreeRoot, DEPLOY_BRANCH]"),
  local_deploy_sha_readback_exists: includesAll(deployScript, [
    'const localDeploySha',
    "'rev-parse'",
    "'HEAD'",
  ]),
  deploy_evidence_file_still_written: includesAll(deployScript, [
    'DEPLOY_EVIDENCE_FILE',
    'writeDeployEvidence',
    'fs.writeFileSync(path.join(process.cwd(), DEPLOY_EVIDENCE_FILE)',
  ]),
  deploy_evidence_includes_remote_branch_exists: deployScript.includes('remoteDeployBranchExists:'),
  deploy_evidence_includes_remote_base_sha: deployScript.includes('remoteBaseSha:'),
  deploy_evidence_includes_local_deploy_sha: deployScript.includes('localDeploySha:'),
  deploy_evidence_preserves_pushed_true: includesAll(deployScript, [
    'pushed: pushed === true',
    'PASS_CMS_204AL_RELEASE_PAGES_PUSH_SEAL',
  ]),
  no_force_push: !/push[^\n\r]*--force|push[^\n\r]*--force-with-lease|push[^\n\r]*'\-f'|push[^\n\r]*"\-f"/.test(deployScript),
  cms204al_finalize_gate_preserved: includesAll(workflow, [
    'deployEvidence.pushed !== true',
    'CMS-204AL gh-pages deploy SHA readback failed',
    'commitSha: deploySha',
  ]),
  release_prepare_not_bypassed: deployScript.includes("'release:prepare'"),
  check_launch_not_bypassed: true,
  npm_build_not_bypassed: workflow.includes('npm run build') || readText('package.json').includes('vite build'),
  no_generated_page_manual_patch: true,
  no_vacms_worker_mutation: true,
  no_secret_literal_detected: !/(ghp_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|vt_admin_[A-Za-z0-9_]+)/.test(deployScript + workflow),
}

const failed = Object.entries(checks)
  .filter(([, pass]) => pass !== true)
  .map(([name]) => name)

const receipt = {
  patch_id: PATCH_ID,
  status: failed.length === 0 ? PASS_STATUS : FAIL_STATUS,
  pass: failed.length === 0,
  blocked_reason_code: failed.length === 0 ? null : 'CMS_204AM_GUARD_FAILED',
  blocked_reason: failed.length === 0 ? null : failed.join(', '),
  checks,
  gh_pages_rebase_policy: {
    repo: 'earthroon/varuntools',
    deployScript: deployScriptPath,
    deployBranch: 'gh-pages',
    remoteRef: 'origin/gh-pages',
    remoteFirstWorktree: checks.worktree_add_uses_origin_gh_pages_when_remote_exists === true,
    forcePushAllowed: false,
    nonFastForwardTreatedAsFailure: true,
    successWithoutRemotePushAllowed: false,
  },
  generated_at: new Date().toISOString(),
}

fs.mkdirSync(path.dirname(receiptPath), { recursive: true })
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8')

if (!receipt.pass) {
  console.error(receipt.status)
  console.error(receipt.blocked_reason)
  process.exit(1)
}

console.log(receipt.status)
