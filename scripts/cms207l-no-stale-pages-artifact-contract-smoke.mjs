#!/usr/bin/env node
import fs from 'node:fs'

const PATCH_ID = 'CMS-207L'
function fail(code, message) {
  console.error(`FAIL_${PATCH_ID}_NO_STALE_PAGES_ARTIFACT_CONTRACT: ${code}`)
  console.error(message)
  process.exit(1)
}
function requireIncludes(text, needle, code) {
  if (!text.includes(needle)) fail(code, `Missing required contract marker: ${needle}`)
}
const workflowPath = '.github/workflows/publish-admin-content.yml'
const packagePath = 'package.json'
if (!fs.existsSync(workflowPath)) fail('CMS_207L_WORKFLOW_MISSING', `${workflowPath} is missing`)
if (!fs.existsSync(packagePath)) fail('CMS_207L_PACKAGE_MISSING', `${packagePath} is missing`)
const workflow = fs.readFileSync(workflowPath, 'utf8')
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
requireIncludes(workflow, 'PAGES_DEPLOY_STRATEGY', 'CMS_207L_STRATEGY_ENV_MISSING')
requireIncludes(workflow, 'pages: write', 'CMS_207L_PAGES_PERMISSION_MISSING')
requireIncludes(workflow, 'id-token: write', 'CMS_207L_ID_TOKEN_PERMISSION_MISSING')
requireIncludes(workflow, 'node scripts/cms207l-pages-deploy-mode-smoke.mjs --workflow', 'CMS_207L_MODE_STEP_MISSING')
requireIncludes(workflow, 'node scripts/cms207l-dist-artifact-readback-smoke.mjs --workflow', 'CMS_207L_DIST_STEP_MISSING')
requireIncludes(workflow, 'actions/upload-pages-artifact', 'CMS_207L_UPLOAD_PAGES_ARTIFACT_MISSING')
requireIncludes(workflow, 'actions/deploy-pages', 'CMS_207L_DEPLOY_PAGES_MISSING')
requireIncludes(workflow, 'node scripts/cms207l-live-published-artifact-smoke.mjs --workflow', 'CMS_207L_LIVE_STEP_MISSING')
requireIncludes(workflow, 'vacms-live-published-artifact-receipt.json', 'CMS_207L_FINALIZE_RECEIPT_GATE_MISSING')
requireIncludes(workflow, 'liveReadbackRequired', 'CMS_207L_LIVE_READBACK_FINALIZE_MARKER_MISSING')
const scripts = pkg.scripts || {}
if (scripts['smoke:cms207l'] !== 'node scripts/cms207l-pages-deploy-mode-smoke.mjs && node scripts/cms207l-dist-artifact-readback-smoke.mjs') {
  fail('CMS_207L_PACKAGE_SMOKE_MISSING', 'package.json smoke:cms207l script is missing or mismatched')
}
if (scripts['smoke:cms207l-live'] !== 'node scripts/cms207l-live-published-artifact-smoke.mjs') {
  fail('CMS_207L_PACKAGE_LIVE_SMOKE_MISSING', 'package.json smoke:cms207l-live script is missing or mismatched')
}
console.log('PASS_CMS_207L_NO_STALE_PAGES_ARTIFACT_CONTRACT')
