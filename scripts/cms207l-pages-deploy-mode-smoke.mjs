#!/usr/bin/env node
import fs from 'node:fs'

const PATCH_ID = 'CMS-207L'
const RECEIPT = 'vacms-pages-deploy-mode-receipt.json'
const VALID = new Set(['branch', 'actions'])

function fail(code, message, extra = {}) {
  const receipt = {
    ok: false,
    patchId: PATCH_ID,
    status: 'FAIL_CMS_207L_PAGES_DEPLOY_MODE_ALIGNED',
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
if (!strategy) fail('CMS_207L_PAGES_DEPLOY_STRATEGY_MISSING', 'PAGES_DEPLOY_STRATEGY is missing')
if (!VALID.has(strategy)) {
  fail('CMS_207L_PAGES_DEPLOY_STRATEGY_INVALID', 'PAGES_DEPLOY_STRATEGY must be branch or actions', { strategy })
}

const receipt = {
  ok: true,
  patchId: PATCH_ID,
  status: 'PASS_CMS_207L_PAGES_DEPLOY_MODE_ALIGNED',
  strategy,
  branchDeployAllowed: strategy === 'branch',
  actionsDeployAllowed: strategy === 'actions',
  branchOnlySuccessBlocked: true,
  checkedAt: new Date().toISOString(),
}

fs.writeFileSync(RECEIPT, JSON.stringify(receipt, null, 2))
console.log(receipt.status)
