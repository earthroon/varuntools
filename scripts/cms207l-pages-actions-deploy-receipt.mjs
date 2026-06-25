#!/usr/bin/env node
import fs from 'node:fs'

const PATCH_ID = 'CMS-207L'
const RECEIPT = 'vacms-pages-actions-deploy-receipt.json'

function fail(code, message, extra = {}) {
  const receipt = {
    ok: false,
    patchId: PATCH_ID,
    status: 'FAIL_CMS_207L_PAGES_ACTIONS_DEPLOY_RECEIPT',
    failureCode: code,
    message,
    checkedAt: new Date().toISOString(),
    ...extra,
  }
  fs.writeFileSync(RECEIPT, JSON.stringify(receipt, null, 2))
  console.error(`${receipt.status}: ${code}`)
  console.error(message)
  process.exit(1)
}

const strategy = String(process.env.PAGES_DEPLOY_STRATEGY || 'actions').trim()
if (strategy !== 'actions') {
  fail('CMS_207L_ACTIONS_DEPLOY_RECEIPT_STRATEGY_MISMATCH', 'Actions deploy receipt can only be sealed in actions strategy', { strategy })
}
const pagesUrl = String(process.env.PAGES_URL || process.env.GITHUB_PAGES_URL || '').trim()
if (!pagesUrl) fail('CMS_207L_ACTIONS_DEPLOY_PAGES_URL_MISSING', 'PAGES_URL output is missing')

const receipt = {
  ok: true,
  patchId: PATCH_ID,
  status: 'PASS_CMS_207L_PAGES_ACTIONS_DEPLOY_RECEIPT',
  strategy,
  pagesUrl,
  deploymentId: String(process.env.GITHUB_PAGES_DEPLOYMENT_ID || process.env.GITHUB_RUN_ID || ''),
  artifactSource: 'dist',
  branchPushRequired: false,
  checkedAt: new Date().toISOString(),
}
fs.writeFileSync(RECEIPT, JSON.stringify(receipt, null, 2))
console.log(receipt.status)
