#!/usr/bin/env node
import fs from 'node:fs'

const SCRIPT = 'scripts/commit-vacms-materialized-source.mjs'
const source = fs.readFileSync(SCRIPT, 'utf8')

function assertIncludes(needle, message) {
  if (!source.includes(needle)) throw new Error(message)
}

assertIncludes("const PATCH_ID = 'CMS-207A-R1'", 'CMS-207A-R1 patch id missing')
assertIncludes('function runtimeReceiptFiles()', 'runtimeReceiptFiles helper missing')
assertIncludes('function dirtyRuntimeReceiptFiles()', 'dirtyRuntimeReceiptFiles helper missing')
assertIncludes('function sourceDirtyGuardFiles()', 'sourceDirtyGuardFiles helper missing')
assertIncludes('const dirtySourceFiles = statusFiles(sourceDirtyGuardFiles())', 'preflight must only use source dirty guard files')
assertIncludes('receipt.workflowArtifactReceiptFiles = dirtyRuntimeReceiptFiles()', 'runtime receipts must be recorded as workflow artifacts')

if (source.includes("statusFiles([HOME_MARKDOWN, 'dist', ONE_SHOT_LIVE_REGISTRY, RECEIPT_FILE")) {
  throw new Error('runtime receipts are still included in dirty source preflight')
}

console.log('CMS207A_R1_RUNTIME_RECEIPT_DIRTY_ALLOWED_PASS')
