#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const assert = (condition, message) => {
  if (!condition) {
    console.error(`[smoke:ewa-quality-budget] FAIL ${message}`)
    process.exit(1)
  }
}

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['smoke:ewa-quality-budget'] === 'node scripts/smoke-ewa-quality-budget.mjs', 'package script must exist')

assert(exists('src/media/ewa/ewaDeviceTier.ts'), 'ewaDeviceTier.ts must exist')
assert(exists('src/media/ewa/ewaQualityBudget.ts'), 'ewaQualityBudget.ts must exist')

const tier = read('src/media/ewa/ewaDeviceTier.ts')
const budget = read('src/media/ewa/ewaQualityBudget.ts')
const processor = read('src/media/ewa/ewaGalleryProcessor.ts')
const diagnostics = read('src/media/ewa/ewaDiagnostics.ts')
const debug = read('src/media/ewa/ewaDebug.ts')
const panel = read('src/components/markdown/EwaDebugPanel.vue')
const checkLaunch = read('scripts/check-launch.mjs')

for (const value of ['unsupported', 'low', 'medium', 'high']) {
  assert(tier.includes(`'${value}'`) || budget.includes(`${value}:`), `device tier ${value} must exist`)
}

for (const token of ['maxTargetWidth', 'maxTargetHeight', 'timeoutMs', 'maxDevicePixelRatio', 'maxCacheEntries']) {
  assert(budget.includes(token), `quality budget must define ${token}`)
}
assert(budget.includes('allowAdaptiveTile') && budget.includes('allowBasicEwa'), 'quality budget must define adaptive/basic allowances')
assert(debug.includes('vt:ewa-tier') && tier.includes('vt:ewa-tier'), 'vt:ewa-tier debug hook must exist')
assert(budget.includes('clampEwaTargetToBudget'), 'target size clamp function must exist')
assert(processor.includes('clampEwaTargetToBudget'), 'processor must apply budget target clamp')
assert(processor.includes('resolveEwaModeWithinBudget'), 'processor must resolve mode within budget')
assert(processor.includes("requestedMode === 'adaptive-tile'") || diagnostics.includes('ADAPTIVE_DISABLED_BY_BUDGET'), 'adaptive requested on low tier must downgrade to basic contract')
assert(processor.includes("resolvedMode === 'original'") && processor.includes('quality-budget-original'), 'unsupported/original budget fallback must exist')
assert(diagnostics.includes('qualityBudget?: EwaQualityBudgetDiagnostics'), 'diagnostics must include qualityBudget field')
for (const token of ['EWA_DIAG_DEVICE_TIER_LOW', 'EWA_DIAG_DEVICE_TIER_UNSUPPORTED', 'EWA_DIAG_TARGET_CLAMPED_BY_BUDGET', 'EWA_DIAG_ADAPTIVE_DISABLED_BY_BUDGET']) {
  assert(diagnostics.includes(token), `${token} warning must exist`)
}
for (const label of ['Tier', 'Budget target', 'Resolved mode', 'Timeout budget', 'Adaptive allowed']) {
  assert(panel.includes(label), `DebugPanel must display ${label}`)
}
assert(processor.includes('withTimeout') && processor.includes('budget.timeoutMs'), 'timeout must use budget.timeoutMs')
assert(processor.includes('this.maxEntries = budget.maxCacheEntries'), 'cache size must use budget.maxCacheEntries')
assert(!processor.includes('processActiveImage({ src:') || processor.includes('processActiveImage(request'), 'processor should remain request-driven')
assert(!read('src/components/markdown/MarkdownLightbox.vue').includes('processActiveImage('), 'lightbox should use composable, not direct page-load processor')
assert(!read('src/components/markdown/WorkCard.vue').includes('ewaQualityBudget'), 'WorkCard must not run quality budget EWA processing')
assert(checkLaunch.includes('smoke-ewa-quality-budget.mjs'), 'check:launch must include smoke:ewa-quality-budget')
for (const file of ['src/media/ewa/ewaDeviceTier.ts', 'src/media/ewa/ewaQualityBudget.ts', 'src/media/ewa/ewaGalleryProcessor.ts', 'src/components/markdown/EwaDebugPanel.vue']) {
  assert(!read(file).includes('[object Object]'), `${file} must not contain [object Object]`)
}

console.log('[smoke:ewa-quality-budget] PASS')
