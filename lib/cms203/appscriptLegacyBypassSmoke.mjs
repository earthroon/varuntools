import fs from 'node:fs'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const router = fs.readFileSync('scripts/sheet-cms/sync-drive-assets.mjs', 'utf8')
const modeLib = fs.readFileSync('scripts/sheet-cms/lib/asset-sync-mode.mjs', 'utf8')

const checks = [
  ['sync:drive-assets routes through sync-drive-assets.mjs', packageJson.scripts?.['sync:drive-assets'] === 'node scripts/sheet-cms/sync-drive-assets.mjs'],
  ['legacy script is preserved as explicit opt-in', Boolean(packageJson.scripts?.['sync:drive-assets:legacy-appscript'])],
  ['default mode resolves to vacms', modeLib.includes("'vacms').trim().toLowerCase()")],
  ['legacy AppScript only runs with explicit legacy-appscript mode', router.includes("mode === 'legacy-appscript'") && router.includes('sync-appscript-assets.mjs')],
  ['vacms/none modes use sync-vacms-assets.mjs', router.includes('sync-vacms-assets.mjs')],
]

let failed = false
for (const [label, ok] of checks) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log('CMS203_APPSCRIPT_LEGACY_BYPASS_PASS')
