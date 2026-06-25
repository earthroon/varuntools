import fs from 'node:fs'

const PATCH_ID = 'CMS-207K'
const PASS_STATUS = 'PASS_CMS_207K_NO_BRANCH_ONLY_SUCCESS_CONTRACT'

function fail(code, message) {
  console.error(`FAIL_${PATCH_ID}: ${code}`)
  console.error(message)
  process.exit(1)
}

function requireFile(path) {
  if (!fs.existsSync(path)) fail('CMS_207K_FILE_MISSING', `${path} is missing`)
  return fs.readFileSync(path, 'utf8')
}

function requireIncludes(source, needle, code) {
  if (!source.includes(needle)) fail(code, `Missing marker: ${needle}`)
}

const workflow = requireFile('.github/workflows/publish-admin-content.yml')
const packageJson = JSON.parse(requireFile('package.json'))
const script = requireFile('scripts/cms207k-live-pages-readback-smoke.mjs')

requireIncludes(workflow, 'node scripts/cms207k-live-pages-readback-smoke.mjs --workflow', 'CMS_207K_WORKFLOW_LIVE_READBACK_STEP_MISSING')
requireIncludes(workflow, 'echo "live_pages_readback" > vacms-last-success-stage.txt', 'CMS_207K_WORKFLOW_STAGE_MISSING')
requireIncludes(workflow, 'vacms-live-pages-readback-receipt.json', 'CMS_207K_WORKFLOW_RECEIPT_GATE_MISSING')
requireIncludes(workflow, 'CMS-207K live pages readback receipt is missing', 'CMS_207K_WORKFLOW_MISSING_ERROR_MISSING')
requireIncludes(workflow, 'CMS-207K live pages readback receipt is not sealed', 'CMS_207K_WORKFLOW_NOT_SEALED_ERROR_MISSING')
requireIncludes(workflow, 'livePagesReadbackVerified', 'CMS_207K_FINALIZE_RECEIPT_FLAG_MISSING')
requireIncludes(workflow, 'liveHostReadback', 'CMS_207K_FINALIZE_LIVE_HOST_FLAG_MISSING')

if (packageJson.scripts?.['smoke:cms207k'] !== 'node scripts/cms207k-no-branch-only-success-contract-smoke.mjs') {
  fail('CMS_207K_PACKAGE_SMOKE_SCRIPT_MISSING', 'package.json smoke:cms207k script is missing or incorrect')
}
if (packageJson.scripts?.['smoke:cms207k:live'] !== 'node scripts/cms207k-live-pages-readback-smoke.mjs') {
  fail('CMS_207K_PACKAGE_LIVE_SMOKE_SCRIPT_MISSING', 'package.json smoke:cms207k:live script is missing or incorrect')
}

for (const marker of [
  'CMS_207K_LIVE_PUBLIC_INDEX_HTML_FALLBACK',
  'CMS_207K_LIVE_LATEST_ASSET_404',
  'CMS_207K_LIVE_ROUTE_HTML_FALLBACK',
  'branchOnlySuccessBlocked',
  'finalizeAllowed',
  'PASS_CMS_207K_LIVE_PAGES_READBACK',
]) {
  requireIncludes(script, marker, `CMS_207K_SCRIPT_MARKER_MISSING_${marker}`)
}

console.log(PASS_STATUS)
