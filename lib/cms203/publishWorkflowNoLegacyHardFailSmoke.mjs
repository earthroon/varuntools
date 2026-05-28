import fs from 'node:fs'

const workflow = fs.readFileSync('.github/workflows/publish-sheet-cms.yml', 'utf8')
const checks = [
  ['publish-sheet-cms.yml defines SHEET_CMS_ASSET_SYNC_MODE', /SHEET_CMS_ASSET_SYNC_MODE:\s*(vacms|none)/.test(workflow)],
  ['default mode is not legacy-appscript', !/SHEET_CMS_ASSET_SYNC_MODE:\s*legacy-appscript/.test(workflow)],
  ['workflow still runs sync:drive-assets', workflow.includes('npm run sync:drive-assets')],
  ['workflow step no longer names AppScript as default path', !workflow.includes('Sync Drive assets through Apps Script')],
]
let failed = false
for (const [label, ok] of checks) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log('CMS203_PUBLISH_WORKFLOW_NO_LEGACY_HARD_FAIL_PASS')
