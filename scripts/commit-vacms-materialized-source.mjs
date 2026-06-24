#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const PATCH_ID = 'CMS-207A-R1'
const PASS_STATUS = 'PASS_CMS_207A_R1_VACMS_PUBLISH_INCREMENTAL_SOURCE_COMMIT_RUNTIME_RECEIPT_DIRTY_ALLOWED_SEAL'
const RECEIPT_FILE = 'vacms-source-commit-receipt.json'
const HOME_MARKDOWN = 'src/content/pages/home/index.md'
const ONE_SHOT_LIVE_REGISTRY = 'src/markdown/vacmsLivePages.generated.ts'
const MATERIALIZATION_RECEIPT = 'vacms-materialization-receipt.json'
const LIVE_MARKDOWN_REGISTRY_RECEIPT = 'vacms-live-markdown-registry-source-rebind.json'
const PAGE_REGISTRY_RECEIPT = 'vacms-page-registry-receipt.json'
const PAGES_DEPLOY_EVIDENCE = 'vacms-pages-deploy-evidence.json'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: options.encoding ?? 'utf8',
    stdio: options.stdio ?? 'pipe',
    shell: process.platform === 'win32',
    ...options,
  })
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    const error = new Error(`command failed: ${command} ${args.join(' ')}${detail ? `\n${detail}` : ''}`)
    error.exitCode = result.status
    throw error
  }
  return result.stdout?.trim?.() ?? ''
}

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/')
}

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/[?#].*$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+ /g, '/')
    .replace(/\/+$/g, '')
    .replace(/\/+/g, '/')
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

function writeReceipt(receipt) {
  fs.writeFileSync(RECEIPT_FILE, JSON.stringify(receipt, null, 2) + '\n', 'utf8')
}

function isSafeGeneratedPath(value) {
  const generatedPath = normalizeSlash(value)
  if (!generatedPath) return false
  if (path.isAbsolute(generatedPath)) return false
  if (generatedPath.includes('..')) return false
  if (generatedPath.includes('\\')) return false
  if (!generatedPath.startsWith('src/content/pages/')) return false
  if (!generatedPath.endsWith('/index.md')) return false
  const segments = generatedPath.split('/')
  if (segments.some((segment) => segment.startsWith('.') || segment === '')) return false
  return true
}

function currentBranch() {
  return run('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
}

function headSha() {
  return run('git', ['rev-parse', 'HEAD'])
}

function ensureGitAuthor() {
  const name = spawnSync('git', ['config', 'user.name'], { encoding: 'utf8', shell: process.platform === 'win32' })
  if (name.status !== 0 || !String(name.stdout || '').trim()) {
    run('git', ['config', 'user.name', 'github-actions[bot]'])
  }
  const email = spawnSync('git', ['config', 'user.email'], { encoding: 'utf8', shell: process.platform === 'win32' })
  if (email.status !== 0 || !String(email.stdout || '').trim()) {
    run('git', ['config', 'user.email', 'github-actions[bot]@users.noreply.github.com'])
  }
}

function exactGeneratedDiff(generatedPath) {
  const status = run('git', ['status', '--porcelain', '--', generatedPath])
  return Boolean(status.trim())
}

function stagedFiles() {
  return run('git', ['diff', '--cached', '--name-only'])
    .split(/\r?\n/)
    .map((item) => normalizeSlash(item.trim()))
    .filter(Boolean)
}

function statusFiles(paths) {
  const result = run('git', ['status', '--porcelain', '--', ...paths])
  return result
    .split(/\r?\n/)
    .map((line) => normalizeSlash(line.slice(3).trim()))
    .filter(Boolean)
}

function runtimeReceiptFiles() {
  return [
    RECEIPT_FILE,
    MATERIALIZATION_RECEIPT,
    LIVE_MARKDOWN_REGISTRY_RECEIPT,
    PAGE_REGISTRY_RECEIPT,
    PAGES_DEPLOY_EVIDENCE,
  ]
}

function dirtyRuntimeReceiptFiles() {
  return statusFiles(runtimeReceiptFiles()).filter(isReceiptOrRuntimeEvidence)
}

function sourceDirtyGuardFiles() {
  return [HOME_MARKDOWN, 'dist', ONE_SHOT_LIVE_REGISTRY]
}

function isDistPath(file) {
  return file === 'dist' || file.startsWith('dist/')
}

function isReceiptOrRuntimeEvidence(file) {
  return runtimeReceiptFiles().includes(normalizeSlash(file))
}

function forbiddenFilesForSourceCommit(files, generatedPath) {
  const allowed = new Set([normalizeSlash(generatedPath)])
  return files.filter((file) => {
    const normalized = normalizeSlash(file)
    if (!normalized) return false
    if (allowed.has(normalized)) return false
    return true
  })
}

function computeForbiddenFlags(files) {
  return {
    homepageRewritten: files.includes(HOME_MARKDOWN),
    distCommittedToMain: files.some(isDistPath),
    registrySourceCommitted: files.includes(ONE_SHOT_LIVE_REGISTRY),
    receiptCommittedToMain: files.some(isReceiptOrRuntimeEvidence),
  }
}

function blockForbiddenFiles(files, generatedPath) {
  const normalized = files.map(normalizeSlash).filter(Boolean)
  const forbidden = forbiddenFilesForSourceCommit(normalized, generatedPath)
  const flags = computeForbiddenFlags(normalized)

  if (flags.homepageRewritten) {
    fail('CMS_207A_HOME_MARKDOWN_REWRITE_BLOCKED', 'VACMS publish must not rewrite home markdown.', { files: normalized })
  }
  if (flags.distCommittedToMain) {
    fail('CMS_207A_DIST_COMMIT_TO_MAIN_BLOCKED', 'VACMS publish must not commit dist/** to main.', { files: normalized })
  }
  if (flags.registrySourceCommitted) {
    fail('CMS_207A_ONE_SHOT_REGISTRY_SOURCE_COMMIT_BLOCKED', 'VACMS publish must not commit one-shot live registry source.', { files: normalized })
  }
  if (flags.receiptCommittedToMain) {
    fail('CMS_207A_RUNTIME_RECEIPT_COMMIT_BLOCKED', 'VACMS publish runtime receipts must remain workflow artifacts, not main source commits.', { files: normalized })
  }
  if (forbidden.length) {
    fail('CMS_207A_FORBIDDEN_SOURCE_COMMIT_FILES', 'Forbidden files staged for VACMS source commit: ' + forbidden.join(', '), { forbidden })
  }

  return { forbidden, flags }
}

function commitMaterializedSource() {
  const materializationPath = MATERIALIZATION_RECEIPT
  if (!fs.existsSync(materializationPath)) {
    fail('CMS_207A_MATERIALIZATION_RECEIPT_MISSING', 'vacms-materialization-receipt.json is missing')
  }

  const materialization = readJson(materializationPath)
  const generatedPath = normalizeSlash(materialization.generatedPath || (fs.existsSync('vacms-generated-path.txt') ? fs.readFileSync('vacms-generated-path.txt', 'utf8').trim() : ''))
  const materializedSlug = normalizeSlug(materialization.materializedSlug || materialization.routePath || generatedPath.replace(/^src\/content\/pages\//, '').replace(/\/index\.md$/, ''))
  const jobId = String(materialization.jobId || process.env.JOB_ID || '')

  const receipt = {
    ok: false,
    patchId: PATCH_ID,
    status: 'FAIL_' + PASS_STATUS,
    jobId,
    sourceBranch: 'main',
    generatedPath,
    routePath: materialization.routePath || null,
    materializedSlug,
    contentHash: materialization.contentHash || null,
    sourceCommitted: false,
    sourceCommitSha: null,
    sourcePushSucceeded: false,
    sourceCommitSkippedReason: null,
    committedFiles: [],
    forbiddenCommittedFiles: [],
    workflowArtifactReceiptFiles: [],
    homepageRewritten: false,
    distCommittedToMain: false,
    registrySourceCommitted: false,
    receiptCommittedToMain: false,
    publicListingInclusionExpected: true,
    blockedReasonCode: null,
    blockedReason: null,
    generatedAt: new Date().toISOString(),
  }

  try {
    if (!generatedPath) fail('CMS_207A_GENERATED_PATH_MISSING', 'generatedPath is missing')
    if (!isSafeGeneratedPath(generatedPath)) fail('CMS_207A_GENERATED_PATH_UNSAFE', 'generatedPath is unsafe or outside src/content/pages/**/index.md: ' + generatedPath)
    if (!fs.existsSync(generatedPath)) fail('CMS_207A_GENERATED_SOURCE_MISSING', 'generated source is missing: ' + generatedPath)
    if (!generatedPath.endsWith('/index.md')) fail('CMS_207A_GENERATED_SOURCE_NOT_MARKDOWN_INDEX', 'generated source is not an index.md file: ' + generatedPath)

    const branch = currentBranch()
    if (branch !== 'main') fail('CMS_207A_NOT_ON_MAIN', 'current branch must be main; got ' + branch)

    ensureGitAuthor()
    const beforeSha = headSha()
    receipt.sourceCommitSha = beforeSha

    const preStagedFiles = stagedFiles()
    const dirtySourceFiles = statusFiles(sourceDirtyGuardFiles())
    const preflightFiles = [...new Set([...preStagedFiles, ...dirtySourceFiles])]
    const preflight = blockForbiddenFiles(preflightFiles, generatedPath)
    receipt.workflowArtifactReceiptFiles = dirtyRuntimeReceiptFiles()
    receipt.homepageRewritten = preflight.flags.homepageRewritten
    receipt.distCommittedToMain = preflight.flags.distCommittedToMain
    receipt.registrySourceCommitted = preflight.flags.registrySourceCommitted
    receipt.receiptCommittedToMain = preflight.flags.receiptCommittedToMain

    if (!exactGeneratedDiff(generatedPath)) {
      receipt.ok = true
      receipt.status = PASS_STATUS
      receipt.sourceCommitted = false
      receipt.sourceCommitSkippedReason = 'no_diff'
      receipt.sourcePushSucceeded = true
      receipt.forbiddenCommittedFiles = []
      receipt.blockedReasonCode = null
      receipt.blockedReason = null
      writeReceipt(receipt)
      console.log(PASS_STATUS)
      console.log('sourceCommitted=false')
      console.log('sourceCommitSha=' + beforeSha)
      console.log('committedFiles=')
      console.log('workflowArtifactReceiptFiles=' + receipt.workflowArtifactReceiptFiles.join(','))
      return receipt
    }

    run('git', ['add', generatedPath])
    const staged = stagedFiles()
    if (!staged.includes(generatedPath)) fail('CMS_207A_SOURCE_GIT_ADD_FAILED', 'generated source did not stage: ' + generatedPath)

    const stageGuard = blockForbiddenFiles(staged, generatedPath)
    receipt.committedFiles = staged
    receipt.forbiddenCommittedFiles = stageGuard.forbidden
    receipt.homepageRewritten = stageGuard.flags.homepageRewritten
    receipt.distCommittedToMain = stageGuard.flags.distCommittedToMain
    receipt.registrySourceCommitted = stageGuard.flags.registrySourceCommitted
    receipt.receiptCommittedToMain = stageGuard.flags.receiptCommittedToMain

    const safeSlugForMessage = materializedSlug || generatedPath.replace(/^src\/content\/pages\//, '').replace(/\/index\.md$/, '')
    run('git', ['commit', '-m', `publish: persist VACMS page ${safeSlugForMessage}`], { stdio: 'inherit' })
    const afterSha = headSha()
    if (!afterSha || afterSha === beforeSha) fail('CMS_207A_SOURCE_COMMIT_SHA_MISSING', 'source commit sha missing or unchanged')

    try {
      run('git', ['push', 'origin', 'main'], { stdio: 'inherit' })
    } catch (error) {
      fail('CMS_207A_SOURCE_PUSH_FAILED', error.message || String(error))
    }

    receipt.ok = true
    receipt.status = PASS_STATUS
    receipt.sourceCommitted = true
    receipt.sourceCommitSha = afterSha
    receipt.sourcePushSucceeded = true
    receipt.sourceCommitSkippedReason = null
    receipt.forbiddenCommittedFiles = []
    receipt.workflowArtifactReceiptFiles = dirtyRuntimeReceiptFiles()
    receipt.blockedReasonCode = null
    receipt.blockedReason = null
    writeReceipt(receipt)
    console.log(PASS_STATUS)
    console.log('sourceCommitted=true')
    console.log('sourceCommitSha=' + afterSha)
    console.log('committedFiles=' + receipt.committedFiles.join(','))
    console.log('workflowArtifactReceiptFiles=' + receipt.workflowArtifactReceiptFiles.join(','))
    return receipt
  } catch (error) {
    receipt.ok = false
    receipt.blockedReasonCode = error.code || 'CMS_207A_UNKNOWN_FAILURE'
    receipt.blockedReason = error.message || String(error)
    if (error.extra) receipt.extra = error.extra
    writeReceipt(receipt)
    throw error
  }
}

if (process.argv.includes('--workflow')) {
  commitMaterializedSource()
} else {
  commitMaterializedSource()
}
