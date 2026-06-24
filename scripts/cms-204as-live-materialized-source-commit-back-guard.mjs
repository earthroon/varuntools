#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'

const PATCH_ID = 'CMS-204AS'
const PASS_STATUS = 'PASS_CMS_204AS_LIVE_MATERIALIZED_SOURCE_COMMIT_BACK_MAIN_BRANCH_CONTENT_PERSISTENCE_SEAL'
const STATIC_RECEIPT = path.join('artifacts', 'cms', 'CMS_204AS_LIVE_MATERIALIZED_SOURCE_COMMIT_BACK.json')

function read(file) { return fs.readFileSync(file, 'utf8') }
function exists(file) { return fs.existsSync(file) }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8') }
function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' })
}
function includesAll(source, values) { return values.every((value) => source.includes(value)) }
function noForcePush(...sources) {
  return sources.join('\n').split(/\n/).filter((line) => /git\s+push/.test(line) || /'push'|"push"/.test(line)).every((line) => !/--force(?:-with-lease)?\b/.test(line) && !/(?:^|[\s'",\[])-f(?:[\s'",\]]|$)/.test(line))
}
function noSecretLiteral(...sources) {
  const joined = sources.join('\n')
  return !/(ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|Bearer\s+[A-Za-z0-9._-]{20,})/.test(joined)
}
function checkFixture() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cms204as-fixture-'))
  try {
    fs.mkdirSync(path.join(tmp, 'src/content/pages/post/demo'), { recursive: true })
    fs.mkdirSync(path.join(tmp, 'scripts'), { recursive: true })
    fs.cpSync(path.resolve('scripts/commit-vacms-materialized-source.mjs'), path.join(tmp, 'scripts/commit-vacms-materialized-source.mjs'))
    fs.writeFileSync(path.join(tmp, 'src/content/pages/post/demo/index.md'), '---\ntitle: Demo\nslug: post/demo\n---\n\nHello\n', 'utf8')
    fs.writeFileSync(path.join(tmp, 'vacms-materialization-receipt.json'), JSON.stringify({
      jobId: 'fixture', generatedPath: 'src/content/pages/post/demo/index.md', routePath: '/post/demo', materializedSlug: 'post/demo', contentHash: 'fixture'
    }, null, 2), 'utf8')
    run('git', ['init', '-b', 'main'], tmp)
    run('git', ['config', 'user.name', 'fixture'], tmp)
    run('git', ['config', 'user.email', 'fixture@example.invalid'], tmp)
    run('git', ['add', 'src/content/pages/post/demo/index.md'], tmp)
    run('git', ['commit', '-m', 'seed'], tmp)
    const result = run('node', ['scripts/commit-vacms-materialized-source.mjs', '--workflow'], tmp)
    const receipt = JSON.parse(read(path.join(tmp, 'vacms-source-commit-receipt.json')))
    return result.status === 0 && receipt.ok === true && receipt.sourceCommitSha
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

function main() {
  const workflowPath = path.join('.github', 'workflows', 'publish-admin-content.yml')
  const commitScriptPath = path.join('scripts', 'commit-vacms-materialized-source.mjs')
  const deployPath = path.join('scripts', 'deploy-pages-branch.mjs')
  const guardPath = path.join('scripts', 'cms-204as-live-materialized-source-commit-back-guard.mjs')
  const apPath = path.join('scripts', 'build-vacms-live-markdown-registry.mjs')
  const aoPath = path.join('scripts', 'cms-204ao-markdown-page-registry-inclusion-guard.mjs')

  const workflow = exists(workflowPath) ? read(workflowPath) : ''
  const commitScript = exists(commitScriptPath) ? read(commitScriptPath) : ''
  const deploy = exists(deployPath) ? read(deployPath) : ''
  const guard = exists(guardPath) ? read(guardPath) : ''
  const ap = exists(apPath) ? read(apPath) : ''
  const ao = exists(aoPath) ? read(aoPath) : ''

  const materializeIndex = workflow.indexOf('echo "materialize" > vacms-last-success-stage.txt')
  const sourceCommitIndex = workflow.indexOf('Commit materialized source back to main')
  const registryIndex = workflow.indexOf('Build VACMS live markdown registry source')
  const buildIndex = workflow.indexOf('Validate and build live branch apply content')
  const deployIndex = workflow.indexOf('Deploy live public site branch')
  const finalizeIndex = workflow.indexOf('Finalize live public site deploy')

  const checks = {
    workflow_exists: exists(workflowPath),
    source_commit_step_exists: workflow.includes('Commit materialized source back to main') && workflow.includes('commit-vacms-materialized-source.mjs --workflow'),
    source_commit_step_after_materialize_before_build: materializeIndex >= 0 && sourceCommitIndex > materializeIndex && registryIndex > sourceCommitIndex && buildIndex > registryIndex,
    source_commit_step_live_only: /name: Commit materialized source back to main[\s\S]*?if: \$\{\{ inputs\.publish_mode == 'cms-live-branch-apply' \}\}/.test(workflow),
    source_commit_script_exists: exists(commitScriptPath),
    source_commit_script_reads_materialization_receipt: commitScript.includes('vacms-materialization-receipt.json') && commitScript.includes('vacms-generated-path.txt'),
    source_commit_script_validates_generated_path_allowlist: commitScript.includes('src/content/pages/') && commitScript.includes('/index.md') && commitScript.includes('CMS_204AS_GENERATED_PATH_UNSAFE'),
    source_commit_script_adds_exact_generated_path_only: commitScript.includes("['add', generatedPath]") || commitScript.includes("['add', generatedPath"),
    source_commit_script_commits_to_main: commitScript.includes('currentBranch') && commitScript.includes("branch !== 'main'") && commitScript.includes('publish: persist VACMS page'),
    source_commit_script_pushes_origin_main: commitScript.includes("['push', 'origin', 'main']"),
    source_commit_script_writes_runtime_receipt: commitScript.includes('vacms-source-commit-receipt.json') && commitScript.includes('sourceCommitSha'),
    deploy_evidence_reads_source_commit_receipt: deploy.includes('vacms-source-commit-receipt.json') && deploy.includes('readSourceCommitReceipt'),
    deploy_evidence_includes_source_commit_sha: deploy.includes('sourceCommitSha') && deploy.includes('sourceGeneratedPath'),
    finalize_requires_source_commit_sha: workflow.includes('vacms-source-commit-receipt.json') && workflow.includes('sourceCommitSha') && workflow.includes('CMS-204AS'),
    finalize_includes_source_commit_sha: workflow.includes('sourceCommitSha') && workflow.includes('sourceCommitted'),
    artifact_includes_source_commit_receipt: workflow.includes('vacms-source-commit-receipt.json'),
    cms204ap_registry_rebind_preserved: ap.includes('vacmsLiveMarkdownPageSources') && workflow.includes('Build VACMS live markdown registry source'),
    cms204aq_bundle_audit_preserved: ao.includes('bundleAudit') || ao.includes('unknownRuntimeHits'),
    cms204ar_skip_prepare_preserved: workflow.includes('npm run release:pages -- --push --skip-prepare') && deploy.includes('skipPrepare'),
    no_git_add_all: !commitScript.includes("['add', '-A']") && !commitScript.includes("['add', '.']") && !commitScript.includes('git add -A') && !commitScript.includes('git add .'),
    no_force_push: noForcePush(workflow, deploy, commitScript),
    no_dist_manual_patch: !workflow.includes('dist/assets/pageLookup') && !commitScript.includes('dist/assets') && !deploy.includes('dist/assets/pageLookup'),
    no_vacms_worker_mutation: !workflow.includes('workers/admin-api') || !workflow.includes('commit-vacms-materialized-source'),
    no_secret_literal_detected: noSecretLiteral(workflow, commitScript, deploy, guard),
    fixture_source_commit_receipt_positive_passes: false,
    fixture_missing_source_commit_receipt_fails_finalize: workflow.includes('CMS-204AS source commit receipt is missing') || workflow.includes('source commit receipt'),
  }

  checks.fixture_source_commit_receipt_positive_passes = checkFixture()

  const pass = Object.values(checks).every(Boolean)
  const receipt = {
    patch_id: PATCH_ID,
    status: pass ? PASS_STATUS : 'FAIL_' + PASS_STATUS,
    pass,
    blocked_reason_code: pass ? null : 'CMS_204AS_STATIC_GUARD_FAILED',
    blocked_reason: pass ? null : 'one or more CMS-204AS checks failed',
    checks,
    source_persistence_policy: {
      sourceBranch: 'main',
      sourceCommitRequiredBeforeDeploy: true,
      sourceCommitShaRequiredForFinalize: true,
      generatedPathAllowlist: 'src/content/pages/**/index.md',
      exactGitAddOnly: true,
      deployBlockedIfSourceCommitFails: true,
      example: {
        generatedPath: 'src/content/pages/post/asdasdsads/index.md',
        materializedSlug: 'post/asdasdsads',
      },
    },
  }
  writeJson(STATIC_RECEIPT, receipt)
  console.log(receipt.status)
  if (!pass) process.exit(1)
}

main()
