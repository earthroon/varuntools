#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const PATCH_ID = 'CMS-204AS'
const PASS_STATUS = 'PASS_CMS_204AS_LIVE_MATERIALIZED_SOURCE_COMMIT_BACK_MAIN_BRANCH_CONTENT_PERSISTENCE_SEAL'
const RECEIPT_FILE = 'vacms-source-commit-receipt.json'

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

function commitMaterializedSource() {
  const materializationPath = 'vacms-materialization-receipt.json'
  if (!fs.existsSync(materializationPath)) {
    fail('CMS_204AS_MATERIALIZATION_RECEIPT_MISSING', 'vacms-materialization-receipt.json is missing')
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
    blockedReasonCode: null,
    blockedReason: null,
    generatedAt: new Date().toISOString(),
  }

  try {
    if (!generatedPath) fail('CMS_204AS_GENERATED_PATH_MISSING', 'generatedPath is missing')
    if (!isSafeGeneratedPath(generatedPath)) fail('CMS_204AS_GENERATED_PATH_UNSAFE', 'generatedPath is unsafe or outside src/content/pages/**/index.md: ' + generatedPath)
    if (!fs.existsSync(generatedPath)) fail('CMS_204AS_GENERATED_SOURCE_MISSING', 'generated source is missing: ' + generatedPath)
    if (!generatedPath.endsWith('/index.md')) fail('CMS_204AS_GENERATED_SOURCE_NOT_MARKDOWN_INDEX', 'generated source is not an index.md file: ' + generatedPath)

    const branch = currentBranch()
    if (branch !== 'main') fail('CMS_204AS_NOT_ON_MAIN', 'current branch must be main; got ' + branch)

    ensureGitAuthor()
    const beforeSha = headSha()
    receipt.sourceCommitSha = beforeSha

    if (!exactGeneratedDiff(generatedPath)) {
      receipt.ok = true
      receipt.status = PASS_STATUS
      receipt.sourceCommitted = false
      receipt.sourceCommitSkippedReason = 'no_diff'
      receipt.sourcePushSucceeded = true
      receipt.blockedReasonCode = null
      receipt.blockedReason = null
      writeReceipt(receipt)
      console.log(PASS_STATUS)
      console.log('sourceCommitted=false')
      console.log('sourceCommitSha=' + beforeSha)
      return receipt
    }

    run('git', ['add', generatedPath])
    const staged = run('git', ['diff', '--cached', '--name-only', '--', generatedPath])
    if (!staged.trim()) fail('CMS_204AS_SOURCE_GIT_ADD_FAILED', 'generated source did not stage: ' + generatedPath)

    const safeSlugForMessage = materializedSlug || generatedPath.replace(/^src\/content\/pages\//, '').replace(/\/index\.md$/, '')
    run('git', ['commit', '-m', `publish: persist VACMS page ${safeSlugForMessage}`], { stdio: 'inherit' })
    const afterSha = headSha()
    if (!afterSha || afterSha === beforeSha) fail('CMS_204AS_SOURCE_COMMIT_SHA_MISSING', 'source commit sha missing or unchanged')

    try {
      run('git', ['push', 'origin', 'main'], { stdio: 'inherit' })
    } catch (error) {
      fail('CMS_204AS_SOURCE_PUSH_FAILED', error.message || String(error))
    }

    receipt.ok = true
    receipt.status = PASS_STATUS
    receipt.sourceCommitted = true
    receipt.sourceCommitSha = afterSha
    receipt.sourcePushSucceeded = true
    receipt.sourceCommitSkippedReason = null
    receipt.blockedReasonCode = null
    receipt.blockedReason = null
    writeReceipt(receipt)
    console.log(PASS_STATUS)
    console.log('sourceCommitted=true')
    console.log('sourceCommitSha=' + afterSha)
    return receipt
  } catch (error) {
    receipt.ok = false
    receipt.blockedReasonCode = error.code || 'CMS_204AS_UNKNOWN_FAILURE'
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
