#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  CMS207M_R1A_PASS,
  CMS207M_R1A_PATCH_ID,
  assertCurrentPageIdentityParity,
  classifyVacmsPageTransition,
  collectWorktreeMarkdownRecords,
  failR1a,
  isSafeVacmsPagePath,
  readVacmsMarkdownIdentity,
  scanVacmsPageIdentity,
  validateTargetPathOwnership,
} from './lib/cms207m-r1a-page-identity.mjs'

const ROOT = process.cwd()
const RECEIPT_FILE = path.join(ROOT, 'vacms-materialization-receipt.json')

function runGit(args, { trim = true } = {}) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', shell: false })
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    failR1a('E_CMS207M_R1A_GIT_READ_FAILED', `git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`)
  }
  const stdout = String(result.stdout || '')
  return trim ? stdout.trim() : stdout
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function baselineRecordsFromHead() {
  const listed = runGit(['ls-files', '--', 'src/content/pages'])
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.endsWith('/index.md'))
  return listed.map((file) => {
    const content = runGit(['show', `HEAD:${file}`], { trim: false })
    return { ...readVacmsMarkdownIdentity(content, file), content }
  })
}

if (!fs.existsSync(RECEIPT_FILE)) {
  failR1a('E_CMS207M_R1A_MATERIALIZATION_RECEIPT_MISSING', 'vacms-materialization-receipt.json is missing.')
}

const receipt = readJson(RECEIPT_FILE)
const pageId = String(receipt.pageId || '').trim()
const incomingRevisionId = String(receipt.revisionId || '').trim()
const incomingPath = String(receipt.generatedPath || '').replace(/\\/g, '/')
const sidecarPath = String(receipt.projectionSidecarPath || '').replace(/\\/g, '/')

if (!pageId) failR1a('E_CMS207M_R1A_PAGE_ID_MISSING', 'Materialization receipt pageId is missing.')
if (!incomingRevisionId) failR1a('E_CMS207M_R1A_REVISION_ID_MISSING', 'Materialization receipt revisionId is missing.')
if (!isSafeVacmsPagePath(incomingPath)) {
  failR1a('E_CMS207M_R1A_CURRENT_PATH_UNSAFE', `Materialization generatedPath is unsafe: ${incomingPath}`)
}
if (!sidecarPath || !fs.existsSync(path.join(ROOT, sidecarPath))) {
  failR1a('E_CMS207M_R1A_PROJECTION_SIDECAR_MISSING', `Projection sidecar is missing: ${sidecarPath}`)
}
if (!fs.existsSync(path.join(ROOT, incomingPath))) {
  failR1a('E_CMS207M_R1A_CURRENT_MARKDOWN_MISSING', `Incoming current Markdown is missing: ${incomingPath}`)
}

const baseline = baselineRecordsFromHead()
const predecessors = scanVacmsPageIdentity(baseline, pageId)
const targetRecord = baseline.find((entry) => entry.path === incomingPath) || null
validateTargetPathOwnership(targetRecord, pageId, incomingPath)

const currentContent = fs.readFileSync(path.join(ROOT, incomingPath), 'utf8')
const classified = classifyVacmsPageTransition({
  predecessors,
  incomingPath,
  incomingRevisionId,
  currentContent,
})

const retiredPaths = classified.retiredPaths
const previousSnapshot = classified.previousSnapshot || null
const incomingSnapshot = classified.incomingSnapshot
for (const retiredPath of retiredPaths) {
  if (!isSafeVacmsPagePath(retiredPath) || retiredPath === incomingPath) {
    failR1a('E_CMS207M_R1A_PREDECESSOR_PATH_UNSAFE', `Predecessor path is unsafe: ${retiredPath}`)
  }
  const full = path.join(ROOT, retiredPath)
  if (!fs.existsSync(full)) {
    failR1a('E_CMS207M_R1A_PREDECESSOR_RETIREMENT_FAILED', `Expected predecessor path is missing before retirement: ${retiredPath}`)
  }
  const liveIdentity = readVacmsMarkdownIdentity(fs.readFileSync(full, 'utf8'), retiredPath)
  if (liveIdentity.source !== 'vacms' || liveIdentity.pageId !== pageId) {
    failR1a(
      'E_CMS207M_R1A_PREDECESSOR_RETIREMENT_FAILED',
      `Refusing to delete predecessor whose live identity no longer matches pageId ${pageId}: ${retiredPath}`,
    )
  }
  fs.rmSync(full)
}

const sidecar = readJson(path.join(ROOT, sidecarPath))
if (sidecar?.schemaVersion !== 'vacms-public-projection@1') {
  failR1a('E_CMS207M_R1A_PROJECTION_SIDECAR_SCHEMA_MISMATCH', 'Projection sidecar schemaVersion is invalid.')
}

const currentRecords = collectWorktreeMarkdownRecords(ROOT)
assertCurrentPageIdentityParity({
  records: currentRecords,
  pageId,
  incomingPath,
  incomingRevisionId,
  sidecar,
})

for (const retiredPath of retiredPaths) {
  if (fs.existsSync(path.join(ROOT, retiredPath))) {
    failR1a('E_CMS207M_R1A_STALE_PATH_STILL_VISIBLE', `Retired predecessor path is still visible: ${retiredPath}`)
  }
}

const nextReceipt = {
  ...receipt,
  samePageRevisionPatchId: CMS207M_R1A_PATCH_ID,
  pageIdentitySsot: 'vacmsPageId',
  transition: classified.transition,
  previousRevisionId: classified.previousRevisionId,
  incomingRevisionId,
  previousPublicSnapshotHash: previousSnapshot?.publicSnapshotHash || null,
  incomingPublicSnapshotHash: incomingSnapshot.publicSnapshotHash,
  previousPageProjectionHash: previousSnapshot?.pageProjectionHash || null,
  incomingPageProjectionHash: incomingSnapshot.pageProjectionHash,
  previousRevisionProjectionHash: previousSnapshot?.revisionProjectionHash || null,
  incomingRevisionProjectionHash: incomingSnapshot.revisionProjectionHash,
  pageProjectionChanged: previousSnapshot ? previousSnapshot.pageProjectionHash !== incomingSnapshot.pageProjectionHash : false,
  revisionProjectionChanged: previousSnapshot ? previousSnapshot.revisionProjectionHash !== incomingSnapshot.revisionProjectionHash : false,
  snapshotIdentityBootstrapped: classified.transition === 'snapshot_identity_bootstrap',
  metadataProjectionUpdate: classified.transition === 'metadata_projection_update',
  currentGeneratedPath: incomingPath,
  predecessors: predecessors.map((entry) => ({
    path: entry.path,
    revisionId: entry.revisionId || null,
    slug: entry.slug || null,
  })),
  retiredPaths,
  inPlaceReplacement: classified.transition === 'in_place_revision_replacement',
  routeMoved: classified.transition === 'route_move',
  currentSnapshotWritten: true,
  predecessorRetirementCompleted: true,
  currentSnapshotParity: true,
  pageIdentityReconciled: true,
}
fs.writeFileSync(RECEIPT_FILE, JSON.stringify(nextReceipt, null, 2) + '\n', 'utf8')

console.log(CMS207M_R1A_PASS)
console.log(`transition=${classified.transition}`)
console.log(`pageId=${pageId}`)
console.log(`previousRevisionId=${classified.previousRevisionId || ''}`)
console.log(`incomingRevisionId=${incomingRevisionId}`)
console.log(`currentGeneratedPath=${incomingPath}`)
console.log(`retiredPaths=${retiredPaths.join(',')}`)
