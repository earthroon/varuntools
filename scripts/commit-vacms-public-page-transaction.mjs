#!/usr/bin/env node
import fs from 'node:fs'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

const PASS = 'PASS_CMS_207M_R3_ATOMIC_PUBLIC_PAGE_TRANSACTION'
const RECEIPT = 'vacms-source-commit-receipt.json'
const COMMIT_IDENTITY_NAME = 'vacms-publish-bot'
const COMMIT_IDENTITY_EMAIL = 'actions@users.noreply.github.com'
const ROUTE_INDEX_PATH = 'src/markdown/markdownRouteIndex.generated.ts'

function writeReceipt(value) { fs.writeFileSync(RECEIPT, JSON.stringify(value, null, 2) + '\n', 'utf8') }
function fail(code, message, extra = {}) {
  writeReceipt({ ok: false, status: 'FAIL_' + PASS, blockedReasonCode: code, blockedReason: message, sourceCommitted: false, sourcePushSucceeded: false, ...extra, generatedAt: new Date().toISOString() })
  console.error(code + ': ' + message)
  process.exit(1)
}
function readJson(file, code) {
  if (!fs.existsSync(file)) fail(code, file + ' is missing')
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) }
  catch (error) { fail(code, file + ' is invalid JSON', { detail: error instanceof Error ? error.message : String(error) }) }
}
function runGit(args, code, inherit = false) {
  const result = spawnSync('git', args, { cwd: process.cwd(), encoding: 'utf8', stdio: inherit ? 'inherit' : 'pipe', shell: false })
  if (result.status !== 0) {
    const detail = inherit ? '' : [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    fail(code, `git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`)
  }
  return inherit ? '' : String(result.stdout || '').trim()
}
const normalize = (value) => String(value || '').replace(/\\/g, '/').trim()
const safePagePath = (value) => /^src\/content\/pages\/.+\/index\.md$/.test(value) && !value.includes('..') && !value.startsWith('/') && !value.includes('\\')
const safeSidecarPath = (value) => /^src\/content\/generated\/vacms-pages\/[^/]+\.projection\.json$/.test(value) && !value.includes('..') && !value.startsWith('/') && !value.includes('\\')
const listStaged = () => runGit(['diff', '--cached', '--name-only'], 'E_CMS207M_R3_STAGED_READ_FAILED').split(/\r?\n/).map(normalize).filter(Boolean)
const currentHead = () => runGit(['rev-parse', 'HEAD'], 'E_CMS207M_R3_HEAD_READ_FAILED')

const admission = readJson('vacms-page-admission-receipt.json', 'E_CMS207M_R3_ADMISSION_RECEIPT_MISSING')
const materialization = readJson('vacms-materialization-receipt.json', 'E_CMS207M_R3_MATERIALIZATION_RECEIPT_MISSING')

if (admission.ok !== true || admission.status !== 'PASS_CMS_207M_R3_DEPENDENCY_FREE_PAGE_ADMISSION' || admission.mainMutationAllowed !== true) {
  fail('E_CMS207M_R3_COMMIT_WITHOUT_ADMISSION', 'atomic source commit requires passing page admission')
}

const generatedPath = normalize(materialization.generatedPath)
const sidecarPath = normalize(materialization.projectionSidecarPath)
const retiredPaths = Array.isArray(materialization.retiredPaths) ? [...new Set(materialization.retiredPaths.map(normalize).filter(Boolean))] : []

if (!safePagePath(generatedPath)) fail('E_CMS207M_R3_GENERATED_PATH_UNSAFE', generatedPath)
if (!safeSidecarPath(sidecarPath)) fail('E_CMS207M_R3_SIDECAR_PATH_UNSAFE', sidecarPath)
for (const retiredPath of retiredPaths) {
  if (!safePagePath(retiredPath) || retiredPath === generatedPath) fail('E_CMS207M_R3_RETIRED_PATH_UNSAFE', retiredPath)
}

const materializationPaths = [generatedPath, sidecarPath, ...retiredPaths]
const authorizedPaths = [...materializationPaths, ROUTE_INDEX_PATH]
const admissionPaths = Array.isArray(admission.authorizedPaths) ? admission.authorizedPaths.map(normalize) : []
if (admissionPaths.length !== materializationPaths.length || materializationPaths.some((item) => !admissionPaths.includes(item))) {
  fail('E_CMS207M_R3_ADMISSION_PATH_SET_MISMATCH', 'admission path set differs from materialization path set', { materializationPaths, admissionPaths })
}

const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD'], 'E_CMS207M_R3_BRANCH_READ_FAILED')
if (branch !== 'main') fail('E_CMS207M_R3_NOT_ON_MAIN', `current branch must be main; got ${branch}`)

const preStaged = listStaged()
if (preStaged.length) fail('E_CMS207M_R3_PRESTAGED_FILES_FORBIDDEN', 'atomic transaction requires an empty Git index', { preStaged })

runGit(
  ['config', '--local', 'user.name', COMMIT_IDENTITY_NAME],
  'E_CMS207M_R3_R1_GIT_IDENTITY_NAME_CONFIG_FAILED',
)
runGit(
  ['config', '--local', 'user.email', COMMIT_IDENTITY_EMAIL],
  'E_CMS207M_R3_R1_GIT_IDENTITY_EMAIL_CONFIG_FAILED',
)

const effectiveCommitIdentityName = runGit(
  ['config', '--local', '--get', 'user.name'],
  'E_CMS207M_R3_R1_GIT_IDENTITY_NAME_READBACK_FAILED',
)
const effectiveCommitIdentityEmail = runGit(
  ['config', '--local', '--get', 'user.email'],
  'E_CMS207M_R3_R1_GIT_IDENTITY_EMAIL_READBACK_FAILED',
)

if (
  effectiveCommitIdentityName !== COMMIT_IDENTITY_NAME
  || effectiveCommitIdentityEmail !== COMMIT_IDENTITY_EMAIL
) {
  fail(
    'E_CMS207M_R3_R1_GIT_IDENTITY_READBACK_MISMATCH',
    `expected=${COMMIT_IDENTITY_NAME}<${COMMIT_IDENTITY_EMAIL}> actual=${effectiveCommitIdentityName}<${effectiveCommitIdentityEmail}>`,
  )
}

const routeIndexBuild = spawnSync(process.execPath, ['scripts/build-markdown-route-index.mjs'], { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe', shell: false })
if (routeIndexBuild.status !== 0) {
  fail('E_CMS118_R1A_R2_ROUTE_INDEX_BUILD_FAILED', 'route index regeneration failed', { detail: [routeIndexBuild.stdout, routeIndexBuild.stderr].filter(Boolean).join('\n').trim() })
}
const routeIndexCheck = spawnSync(process.execPath, ['scripts/build-markdown-route-index.mjs', '--check'], { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe', shell: false })
if (routeIndexCheck.status !== 0) {
  fail('E_CMS118_R1A_R2_ROUTE_INDEX_STALE_AFTER_BUILD', 'route index freshness check failed', { detail: [routeIndexCheck.stdout, routeIndexCheck.stderr].filter(Boolean).join('\n').trim() })
}

const beforeSha = currentHead()
runGit(['add', '--', ...authorizedPaths], 'E_CMS207M_R3_EXACT_GIT_ADD_FAILED')

const staged = listStaged()
const unauthorized = staged.filter((file) => !authorizedPaths.includes(file))
if (unauthorized.length) fail('E_CMS207M_R3_UNAUTHORIZED_STAGED_FILES', 'staged files escaped authorized transaction set', { staged, unauthorized })

if (!staged.length) {
  writeReceipt({
    ok: true, status: PASS, sourceBranch: 'main', generatedPath, projectionSidecarPath: sidecarPath,
    retiredPaths, authorizedPaths, committedFiles: [], sourceCommitted: false, sourceCommitSha: beforeSha,
    sourcePushSucceeded: true, remoteMainVerified: true, generatedAt: new Date().toISOString(),
  })
  console.log(PASS)
  console.log('sourceCommitted=false')
  process.exit(0)
}

const safeSlug = normalize(materialization.materializedSlug) || generatedPath.replace(/^src\/content\/pages\//, '').replace(/\/index\.md$/, '')
runGit(['commit', '-m', `publish: persist VACMS page ${safeSlug}`], 'E_CMS207M_R3_SOURCE_COMMIT_FAILED', true)

const afterSha = currentHead()
if (!afterSha || afterSha === beforeSha) fail('E_CMS207M_R3_SOURCE_COMMIT_SHA_UNCHANGED', 'source commit SHA did not advance')

runGit(['push', 'origin', 'main'], 'E_CMS207M_R3_SOURCE_PUSH_FAILED', true)

const remote = runGit(['ls-remote', 'origin', 'refs/heads/main'], 'E_CMS207M_R3_REMOTE_MAIN_READBACK_FAILED')
const remoteSha = remote.split(/\s+/)[0] || ''
if (remoteSha !== afterSha) fail('E_CMS207M_R3_REMOTE_MAIN_SHA_MISMATCH', 'origin/main does not point at the atomic source commit', { afterSha, remoteSha })

writeReceipt({
  ok: true, status: PASS, sourceBranch: 'main', generatedPath, projectionSidecarPath: sidecarPath,
  retiredPaths, authorizedPaths, committedFiles: staged, sourceCommitted: true, sourceCommitSha: afterSha,
  sourcePushSucceeded: true, remoteMainVerified: true, generatedAt: new Date().toISOString(),
})

console.log(PASS)
console.log('sourceCommitted=true')
console.log('sourceCommitSha=' + afterSha)
console.log('committedFiles=' + staged.join(','))
