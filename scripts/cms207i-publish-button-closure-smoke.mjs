#!/usr/bin/env node
import fs from 'node:fs'

const PATCH_ID = 'CMS-207I'
const PASS_STATUS = 'PASS_CMS_207I_PUBLISH_BUTTON_REMOTE_COMMIT_DEPLOY_CLOSURE'
const RECEIPT_FILE = 'vacms-publish-button-closure-receipt.json'

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

const jobId = String(process.env.JOB_ID || '').trim()
if (!jobId) fail('CMS_207I_JOB_ID_MISSING', 'JOB_ID env is missing')

const requestId = String(process.env.REQUEST_ID || '').trim()
const publishMode = String(process.env.PUBLISH_MODE || 'cms-live-branch-apply').trim()

const exportPayload = readJson('export-payload.json', 'CMS_207I_EXPORT_PAYLOAD_MISSING')
const data = exportPayload.data || {}
const exportedJobId = String(data.job?.id || data.jobId || '').trim()
if (exportedJobId && exportedJobId !== jobId) {
  fail('CMS_207I_JOB_ID_MISMATCH', 'export payload job id does not match JOB_ID env', { jobId, exportedJobId })
}

const materialization = readJson('vacms-materialization-receipt.json', 'CMS_207I_MATERIALIZATION_RECEIPT_MISSING')
const sourceCommit = readJson('vacms-source-commit-receipt.json', 'CMS_207I_SOURCE_COMMIT_RECEIPT_MISSING')
const deployEvidence = readJson('vacms-pages-deploy-evidence.json', 'CMS_207I_DEPLOY_EVIDENCE_MISSING')
const publicIndex = readJson('public-content-index-receipt.json', 'CMS_207I_PUBLIC_INDEX_RECEIPT_MISSING')
const mainReadback = readJson('vacms-main-source-readback-receipt.json', 'CMS_207I_MAIN_SOURCE_READBACK_RECEIPT_MISSING')
const ghPagesReadback = readJson('vacms-gh-pages-route-index-readback-receipt.json', 'CMS_207I_GH_PAGES_READBACK_RECEIPT_MISSING')

const generatedPath = String(materialization.generatedPath || '').trim()
if (!generatedPath) fail('CMS_207I_GENERATED_PATH_MISSING', 'generatedPath is missing')

const routePath = String(materialization.routePath || data.snapshot?.routePath || '').trim()
if (!routePath) fail('CMS_207I_ROUTE_PATH_MISSING', 'routePath is missing')

const sourceCommitSha = String(sourceCommit.sourceCommitSha || sourceCommit.commitSha || sourceCommit.sha || '').trim()
if (sourceCommit.ok !== true || !sourceCommitSha) {
  fail('CMS_207I_SOURCE_COMMIT_NOT_VERIFIED', 'source commit receipt is not ok or sourceCommitSha is missing', { sourceCommit })
}

if (mainReadback.ok !== true || mainReadback.mainReadbackVerified !== true) {
  fail('CMS_207I_MAIN_READBACK_NOT_VERIFIED', 'main source readback receipt is not verified', { mainReadback })
}

if (deployEvidence.pushed !== true) {
  fail('CMS_207I_DEPLOY_NOT_PUSHED', 'deploy evidence pushed is not true', { deployEvidence })
}

if (publicIndex.ok !== true) {
  fail('CMS_207I_PUBLIC_INDEX_NOT_VERIFIED', 'public content index receipt is not ok', { publicIndex })
}

if (ghPagesReadback.ok !== true || ghPagesReadback.ghPagesRouteReadbackVerified !== true || ghPagesReadback.publicContentIndexReadbackVerified !== true) {
  fail('CMS_207I_GH_PAGES_READBACK_NOT_VERIFIED', 'gh-pages route/public index readback is not verified', { ghPagesReadback })
}

const deploySha = String(deployEvidence.deploySha || ghPagesReadback.deploySha || '').trim()

const receipt = {
  ok: true,
  patchId: PATCH_ID,
  status: PASS_STATUS,
  jobId,
  requestId: requestId || null,
  publishMode,
  generatedPath,
  routePath,
  sourceCommitSha,
  sourceCommitVerified: true,
  mainReadbackVerified: true,
  ghPagesDeploySha: deploySha || null,
  ghPagesRouteReadbackVerified: true,
  publicContentIndexReadbackVerified: true,
  homeRuntimeIndexIncludesRoute: ghPagesReadback.homeRuntimeIndexIncludesRoute === true,
  localPushRequired: false,
  generatedAt: new Date().toISOString(),
}

writeReceipt(receipt)
console.log(PASS_STATUS)
console.log('localPushRequired=false')
