#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  console.error('[CMS207A_NO_DIST_COMMIT_TO_MAIN_FAIL]', message)
  process.exit(1)
}

const commitScript = fs.readFileSync('scripts/commit-vacms-materialized-source.mjs', 'utf8')
const workflow = fs.readFileSync('.github/workflows/publish-admin-content.yml', 'utf8')

if (!commitScript.includes('distCommittedToMain')) fail('receipt must expose distCommittedToMain')
if (!commitScript.includes('CMS_207A_DIST_COMMIT_TO_MAIN_BLOCKED')) fail('dist commit block code is missing')
if (/git add\s+(?:--\s+)?dist(?:\s|\/|$)/.test(workflow)) fail('workflow must not git add dist')
if (!workflow.includes('node scripts/commit-vacms-materialized-source.mjs --workflow')) fail('source commit step is missing')
if (!workflow.includes('npm run build')) fail('build step is missing')
if (workflow.indexOf('node scripts/commit-vacms-materialized-source.mjs --workflow') > workflow.indexOf('npm run build')) {
  fail('source commit must happen before npm run build')
}
if (!workflow.includes('npm run release:pages')) fail('deploy must use release:pages, not main dist commit')

console.log('CMS207A_NO_DIST_COMMIT_TO_MAIN_PASS')
