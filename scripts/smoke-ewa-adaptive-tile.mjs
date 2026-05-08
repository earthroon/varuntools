#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))

function assert(condition, message) {
  if (!condition) {
    console.error(`[smoke:ewa-adaptive-tile] FAIL ${message}`)
    process.exit(1)
  }
}

const required = [
  'src/media/ewa/ewaAdaptiveTileCompute.ts',
  'src/media/ewa/ewaTileMask.ts',
  'src/media/ewa/ewaAdaptivePresets.ts',
  'src/media/ewa/ewaTypes.ts',
  'src/media/ewa/ewaPresets.ts',
  'src/media/ewa/ewaDebug.ts',
  'src/media/ewa/ewaDiagnostics.ts',
  'src/media/ewa/ewaGalleryProcessor.ts',
  'src/components/markdown/EwaDebugPanel.vue',
  'src/components/markdown/MarkdownLightbox.vue',
]
for (const file of required) assert(exists(file), `${file} must exist`)

const types = read('src/media/ewa/ewaTypes.ts')
const presets = read('src/media/ewa/ewaPresets.ts')
const debug = read('src/media/ewa/ewaDebug.ts')
const diagnostics = read('src/media/ewa/ewaDiagnostics.ts')
const tileMask = read('src/media/ewa/ewaTileMask.ts')
const adaptive = read('src/media/ewa/ewaAdaptiveTileCompute.ts')
const processor = read('src/media/ewa/ewaGalleryProcessor.ts')
const panel = read('src/components/markdown/EwaDebugPanel.vue')
const lightbox = read('src/components/markdown/MarkdownLightbox.vue')
const workCard = exists('src/components/markdown/WorkCard.vue') ? read('src/components/markdown/WorkCard.vue') : ''
const caseGallery = read('src/components/portfolio/CaseGallery.vue')
const pkg = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')

assert(types.includes('EwaComputeMode') && types.includes("'adaptive-tile'"), 'EwaComputeMode must include adaptive-tile')
assert(types.includes('EwaAdaptiveTileParams'), 'adaptive tile params type must exist')
for (const token of ['tilePx', 'qThresh', 'fastMode']) assert(types.includes(token) && presets.includes(token), `adaptive params must include ${token}`)
assert(types.includes('EwaTileDiagnostics'), 'tile diagnostics type must exist')

assert(debug.includes('vt:ewa-mode'), 'localStorage vt:ewa-mode hook must exist')
assert(debug.includes('getEwaComputeMode'), 'compute mode resolver hook must exist')
assert(presets.includes('resolveEwaComputeMode'), 'presets must resolve compute mode')
assert(presets.includes('adaptive-tile'), 'presets must define adaptive-tile mode candidates')
assert(presets.includes("'pixel-safe'") && presets.includes('allowWebGpu: false') && presets.includes('enabled: false'), 'pixel-safe must bypass adaptive/basic compute')

assert(tileMask.includes('estimateEwaTileDiagnostics'), 'tile mask diagnostics estimator must exist')
assert(tileMask.includes('activeTileRatio'), 'tile diagnostics must include active tile ratio')
assert(adaptive.includes('runAdaptiveEwaTileDownscale'), 'adaptive compute runner must exist')
assert(adaptive.includes('EWA_ADAPTIVE_TILE_DOWNSCALE_WGSL'), 'adaptive compute must use adaptive WGSL source')
assert(adaptive.includes('STORAGE_BINDING') && adaptive.includes('TEXTURE_BINDING'), 'adaptive output texture must support storage and sampling')
assert(adaptive.includes('dispatchWorkgroups'), 'adaptive compute must dispatch workgroups')
assert(adaptive.includes('tileDiagnostics'), 'adaptive compute must return tile diagnostics')

assert(processor.includes('runAdaptiveEwaTileDownscale'), 'processor must call adaptive path')
assert(processor.includes('runEwaAnisoDownscale'), 'processor must preserve basic EWA fallback')
assert(processor.includes("adaptiveFallback = 'basic'"), 'adaptive failure must fallback to basic EWA')
assert(processor.includes('pixel-safe-preset'), 'pixel-safe fallback must remain')
assert(processor.includes('computeMode'), 'processor diagnostics must track compute mode')
assert(processor.includes('tileDiagnostics'), 'processor diagnostics must preserve tile diagnostics')
assert(processor.includes('processActiveImage'), 'adaptive path must be inside active image processor')
assert(!processor.includes('qmap_preprocess') && !processor.includes('DadumGPUParams'), 'adaptive path must not import full Qmap/Dadum chain')

assert(diagnostics.includes('adaptiveFallback'), 'diagnostics must include adaptive fallback state')
assert(diagnostics.includes('tileDiagnostics'), 'diagnostics must include tile diagnostics')
for (const warning of ['EWA_DIAG_ADAPTIVE_TILE_ENABLED', 'EWA_DIAG_ADAPTIVE_TILE_FALLBACK_BASIC', 'EWA_DIAG_TILE_MASK_EMPTY', 'EWA_DIAG_TILE_MASK_DENSE']) {
  assert(diagnostics.includes(warning), `diagnostics must include ${warning}`)
}

assert(panel.includes('Mode') && panel.includes('Adaptive fallback'), 'debug panel must display compute mode and adaptive fallback')
assert(panel.includes('Tile px') && panel.includes('Q threshold') && panel.includes('Active tiles'), 'debug panel must display tile diagnostics')
assert(lightbox.includes('data-ewa-mode'), 'lightbox must expose compute mode data attribute')
assert(lightbox.includes('processActiveItem(props.item)'), 'adaptive path must still be triggered only by active lightbox item')
assert(!lightbox.includes('onMounted(() => {\n  processActiveItem'), 'processor must not run on page load')
assert(!caseGallery.includes('runAdaptiveEwaTileDownscale') && !workCard.includes('runAdaptiveEwaTileDownscale'), 'WorkCard/CaseGallery thumbnails must not run adaptive compute')
assert(![types, presets, debug, diagnostics, tileMask, adaptive, processor, panel, lightbox].join('\n').includes('[object Object]'), 'sources must not contain [object Object]')

assert(pkg.scripts?.['smoke:ewa-adaptive-tile'] === 'node scripts/smoke-ewa-adaptive-tile.mjs', 'package.json must expose smoke:ewa-adaptive-tile')
assert(checkLaunch.includes('scripts/smoke-ewa-adaptive-tile.mjs'), 'check:launch must run smoke-ewa-adaptive-tile')

console.log('[smoke:ewa-adaptive-tile] PASS')
