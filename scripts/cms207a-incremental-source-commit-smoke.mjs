#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  console.error('[CMS207A_INCREMENTAL_SOURCE_COMMIT_FAIL]', message)
  process.exit(1)
}

const script = fs.readFileSync('scripts/commit-vacms-materialized-source.mjs', 'utf8')

if (!script.includes("const PATCH_ID = 'CMS-207A'")) fail('commit script patch id must be CMS-207A')
if (!script.includes('PASS_CMS_207A_VACMS_PUBLISH_INCREMENTAL_SOURCE_COMMIT_SEAL')) fail('missing CMS-207A pass status')
if (!script.includes("run('git', ['add', generatedPath])")) fail('source commit must stage generatedPath only')
if (/run\('git', \['add', '\.'\]\)/.test(script) || /git add \./.test(script)) fail('git add . is forbidden')
if (/git add dist/.test(script) || script.includes("run('git', ['add', 'dist'") || script.includes("run('git', ['add', 'dist/")) fail('git add dist is forbidden')
if (!script.includes("run('git', ['diff', '--cached', '--name-only'])")) fail('commit script must inspect staged files')
if (!script.includes('committedFiles')) fail('receipt must expose committedFiles')
if (!script.includes('forbiddenCommittedFiles')) fail('receipt must expose forbiddenCommittedFiles')
if (!script.includes('publicListingInclusionExpected')) fail('receipt must expose publicListingInclusionExpected')
if (!script.includes('CMS_207A_FORBIDDEN_SOURCE_COMMIT_FILES')) fail('forbidden staged files gate is missing')

console.log('CMS207A_INCREMENTAL_SOURCE_COMMIT_PASS')
