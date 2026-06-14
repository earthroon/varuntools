#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { resolveAssetSyncMode } from './lib/asset-sync-mode.mjs'

function runNodeScript(scriptPath, args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    stdio: 'inherit',
    env: process.env,
  })
  if (result.error) throw result.error
  process.exit(result.status ?? 1)
}

const mode = resolveAssetSyncMode()
console.log(`[sync:drive-assets] asset sync mode: ${mode}`)

if (mode === 'legacy-appscript') {
  console.log('[sync:drive-assets] using legacy AppScript asset gateway because SHEET_CMS_ASSET_SYNC_MODE=legacy-appscript')
  runNodeScript('scripts/sheet-cms/sync-appscript-assets.mjs', process.argv.slice(2))
}

runNodeScript('scripts/sheet-cms/sync-vacms-assets.mjs', process.argv.slice(2))
