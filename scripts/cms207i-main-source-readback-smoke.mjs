#!/usr/bin/env node
import fs from 'node:fs'
import crypto from 'node:crypto'
import childProcess from 'node:child_process'

const PATCH_ID = 'CMS-207I'
const PASS_STATUS = 'PASS_CMS_207I_MAIN_SOURCE_READBACK'
const RECEIPT_FILE = 'vacms-main-source-readback-receipt.json'

function writeReceipt(receipt) {
  fs.writeFileSync(RECEIPT_FILE, JSON.stringify(receipt, null, 2) + '\n', 'utf8')
}

function fail(code, message, extra = {}) {
  writeReceipt({
    ok: false,
    patchId: PATCH_ID,
    status: 'FAIL_' + PASS_STATUS,
    blockedReasonCode: code,
    blockedReason: message,
    ...extra,
    generatedAt: new Date().toISOString(),
  })
  const error = new Error(message)
  error.code = code
  error.extra = extra
  throw error
}

function readJson(path, code) {
  if (!fs.existsSync(path)) fail(code, `${path} is missing`)
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  } catch (error) {
    fail(code, `${path} is not valid JSON: ` + (error instanceof Error ? error.message : String(error)))
  }
}

function runGit(args, code, extra = {}) {
  try {
    return childProcess.execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    fail(code, `git ${args.join(' ')} failed: ` + (error instanceof Error ? error.message : String(error)), extra)
  }
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex')
}

const materialization = readJson('vacms-materialization-receipt.json', 'CMS_207I_MATERIALIZATION_RECEIPT_MISSING')
const sourceCommit = readJson('vacms-source-commit-receipt.json', 'CMS_207I_SOURCE_COMMIT_RECEIPT_MISSING')

const generatedPath = String(materialization.generatedPath || '').trim()
if (!generatedPath) fail('CMS_207I_GENERATED_PATH_MISSING', 'generatedPath is missing in materialization receipt', { materialization })

const expectedHash = String(materialization.contentHash || '').trim()
if (!expectedHash) fail('CMS_207I_CONTENT_HASH_MISSING', 'contentHash is missing in materialization receipt', { generatedPath })

const sourceCommitSha = String(sourceCommit.sourceCommitSha || sourceCommit.commitSha || sourceCommit.sha || '').trim()
if (sourceCommit.ok !== true || !sourceCommitSha) {
  fail('CMS_207I_SOURCE_COMMIT_NOT_VERIFIED', 'source commit receipt is not ok or sourceCommitSha is missing', { sourceCommit })
}

runGit(['fetch', 'origin', 'main'], 'CMS_207I_MAIN_READBACK_FETCH_FAILED')
const content = runGit(['show', `origin/main:${generatedPath}`], 'CMS_207I_MAIN_GENERATED_PATH_MISSING', { generatedPath })
const actualHash = sha256Text(content)

if (actualHash !== expectedHash) {
  fail('CMS_207I_MAIN_CONTENT_HASH_MISMATCH', 'origin/main generated content hash does not match materialization receipt', {
    generatedPath,
    expectedHash,
    actualHash,
  })
}

const receipt = {
  ok: true,
  patchId: PATCH_ID,
  status: PASS_STATUS,
  generatedPath,
  routePath: materialization.routePath || null,
  sourceCommitSha,
  sourceCommitVerified: true,
  mainReadbackVerified: true,
  contentHash: actualHash,
  generatedAt: new Date().toISOString(),
}

writeReceipt(receipt)
console.log(PASS_STATUS)
console.log('generatedPath=' + generatedPath)
