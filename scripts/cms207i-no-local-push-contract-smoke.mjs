#!/usr/bin/env node
import fs from 'node:fs'

const WORKFLOW = '.github/workflows/publish-admin-content.yml'
const PACKAGE_JSON = 'package.json'
const PASS_STATUS = 'PASS_CMS_207I_NO_LOCAL_PUSH_CONTRACT'

function fail(message) {
  throw new Error(message)
}

function requireFile(path) {
  if (!fs.existsSync(path)) fail(`${path} is missing`)
  return fs.readFileSync(path, 'utf8')
}

function requireIncludes(text, marker, code) {
  if (!text.includes(marker)) fail(`${code}: missing marker: ${marker}`)
}

const workflow = requireFile(WORKFLOW)
const pkg = JSON.parse(requireFile(PACKAGE_JSON))

requireIncludes(workflow, 'Commit materialized source back to main', 'CMS_207I_SOURCE_COMMIT_STEP_MISSING')
requireIncludes(workflow, 'node scripts/commit-vacms-materialized-source.mjs --workflow', 'CMS_207I_SOURCE_COMMIT_STEP_MISSING')
requireIncludes(workflow, 'node scripts/cms207i-main-source-readback-smoke.mjs --workflow', 'CMS_207I_MAIN_READBACK_STEP_MISSING')
requireIncludes(workflow, 'Build runtime public content index', 'CMS_207I_PUBLIC_INDEX_STEP_MISSING')
requireIncludes(workflow, 'node scripts/build-public-content-index.mjs --workflow', 'CMS_207I_PUBLIC_INDEX_STEP_MISSING')
requireIncludes(workflow, 'Deploy live public site branch', 'CMS_207I_DEPLOY_STEP_MISSING')
requireIncludes(workflow, 'npm run release:pages -- --push --skip-prepare', 'CMS_207I_DEPLOY_STEP_MISSING')
requireIncludes(workflow, 'node scripts/cms207i-gh-pages-route-and-index-readback-smoke.mjs --workflow', 'CMS_207I_GH_PAGES_READBACK_STEP_MISSING')
requireIncludes(workflow, 'node scripts/cms207i-publish-button-closure-smoke.mjs --workflow', 'CMS_207I_REMOTE_CLOSURE_STEP_MISSING')
requireIncludes(workflow, 'vacms-publish-button-closure-receipt.json', 'CMS_207I_FINALIZE_GATE_MISSING')

const scripts = pkg.scripts || {}
if (scripts['smoke:cms207i'] !== 'node scripts/cms207i-no-local-push-contract-smoke.mjs') {
  fail('CMS_207I_PACKAGE_SCRIPT_MISSING: smoke:cms207i is missing or unexpected')
}

const forbidden = [
  /manual\s+git\s+push\s+after\s+publish/i,
  /local\s+git\s+push\s+required/i,
  /run\s+git\s+push\s+to\s+publish\s+content/i,
]

for (const pattern of forbidden) {
  if (pattern.test(workflow)) fail('CMS_207I_LOCAL_PUSH_REQUIREMENT_DETECTED: ' + pattern)
}

console.log(PASS_STATUS)
