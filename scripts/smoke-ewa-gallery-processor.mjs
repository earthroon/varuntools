#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))

function assert(condition, message) {
  if (!condition) {
    console.error(`[smoke:ewa-gallery-processor] FAIL ${message}`)
    process.exit(1)
  }
}

const files = [
  'src/media/ewa/ewaTypes.ts',
  'src/media/ewa/ewaWebGpuRuntime.ts',
  'src/media/ewa/ewaGalleryProcessor.ts',
  'src/media/ewa/ewaPresets.ts',
  'src/media/ewa/ewaDebug.ts',
  'src/composables/useEwaGalleryProcessor.ts',
  'src/media/ewa/vendor/ewa_patch.js',
  'src/media/ewa/vendor/export_ewa_lowpass.wgsl',
  'src/media/ewa/vendor/export_ewa_recompose.wgsl',
  'src/media/ewa/vendor/ewa_aniso_downscale_pass.js',
  'src/media/ewa/vendor/ewa_aniso_downscale_rgba16f.wgsl',
]

for (const file of files) assert(exists(file), `${file} must exist`)

const types = read('src/media/ewa/ewaTypes.ts')
const presets = read('src/media/ewa/ewaPresets.ts')
const runtime = read('src/media/ewa/ewaWebGpuRuntime.ts')
const processor = read('src/media/ewa/ewaGalleryProcessor.ts')
const debug = read('src/media/ewa/ewaDebug.ts')
const composable = read('src/composables/useEwaGalleryProcessor.ts')
const lightbox = read('src/components/markdown/MarkdownLightbox.vue')
const caseGallery = read('src/components/portfolio/CaseGallery.vue')
const css = read('src/styles/markdown-lightbox.css')
const pkg = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')

assert(types.includes('EwaGalleryStatus'), 'ewaTypes must define EwaGalleryStatus')
assert(types.includes('EwaFallbackReason'), 'ewaTypes must define EwaFallbackReason')
assert(types.includes('EwaProcessToken'), 'ewaTypes must define EwaProcessToken')
assert(types.includes('processing-timeout') && types.includes('stale-result'), 'fallback reasons must include timeout and stale-result')

assert(presets.includes('EwaPresetConfig'), 'presets must use an explicit EwaPresetConfig contract')
for (const key of ['radiusMul', 'sigma', 'anisoAspect', 'deThresh', 'deSoft', 'deK']) {
  assert(presets.includes(key), `preset params must include ${key}`)
}
assert(presets.includes("'pixel-safe'") && presets.includes('allowWebGpu: false'), 'pixel-safe preset must disable WebGPU')
assert(presets.includes('preferFallback: true'), 'pixel-safe preset must prefer fallback')
assert(presets.includes('resolveEwaGalleryPreset') && presets.includes('inferEwaGalleryPreset'), 'preset resolver and inference must exist')

assert(runtime.includes('navigator') && runtime.includes('gpu'), 'runtime must lazily check navigator.gpu')
assert(runtime.includes('getEwaWebGpuRuntime'), 'runtime must export getEwaWebGpuRuntime')
assert(runtime.includes('device.lost'), 'runtime must handle device.lost')
assert(runtime.includes('adapter-unavailable') && runtime.includes('device-request-failed'), 'runtime must separate adapter and device failures')

assert(processor.includes('processActiveImage'), 'processor must expose active-image processing')
assert(processor.includes('createEwaGalleryCacheKey'), 'processor must define a deterministic cache key')
assert(processor.includes('EWA_GALLERY_ALGORITHM_VERSION'), 'cache key must include algorithm version')
assert(processor.includes('EWA_PROCESS_TIMEOUT_MS'), 'processor must define a timeout')
assert(processor.includes('withTimeout'), 'processor must wrap compute work with timeout fallback')
assert(processor.includes('processing-timeout'), 'processor must return processing-timeout fallback')
assert(processor.includes('allowWebGpu') && processor.includes('pixel-safe-preset'), 'processor must respect pixel-safe fallback')
assert(processor.includes('maxEntries = 3') || processor.includes('EwaGalleryProcessor(3)'), 'cache must stay small by default')
assert(processor.includes('URL.revokeObjectURL'), 'processor must revoke object URLs during cleanup')
assert(processor.includes('loadImageBitmapForEwa') || processor.includes('loadImageBitmap'), 'processor must process the active source lazily')
assert(exists('src/media/ewa/ewaWgslSources.ts'), 'processor must use a split WebGPU WGSL source module')
assert(processor.includes('runEwaAnisoDownscale'), 'processor must call the WebGPU compute wrapper')
assert(read('src/media/ewa/ewaWgslSources.ts').includes('rgba16float'), 'EWA WGSL source must use an rgba16float output texture')
assert(processor.includes('fallbackReason'), 'processor must keep a fallback path')

assert(debug.includes('isEwaDebugEnabled'), 'debug compare hook must exist')
assert(debug.includes('EwaCompareMode'), 'debug compare mode type must exist')
assert(debug.includes('vt:ewa-debug'), 'debug hook must use an opt-in flag')

assert(composable.includes('activeToken') && composable.includes('Symbol'), 'composable must guard stale async results with a token')
assert(composable.includes('targetWidth') && composable.includes('targetHeight') && composable.includes('preset'), 'stale token must include src/target size/preset')
assert(composable.includes('isSameProcessToken'), 'composable must compare structured process tokens')
assert(composable.includes('stale-result'), 'composable must mark late async results stale')
assert(composable.includes('processActiveItem'), 'composable must process the current active item only')
assert(composable.includes('clearRuntimeResult'), 'composable must expose close cleanup')
assert(composable.includes('stageRef'), 'composable must size the target from the active lightbox stage')

assert(lightbox.includes('useEwaGalleryProcessor'), 'MarkdownLightbox must wire the EWA gallery processor')
assert(lightbox.includes('processActiveItem(props.item)'), 'lightbox must process only the active item')
assert(lightbox.includes('clearRuntimeResult(true)'), 'lightbox close/unmount must clear runtime results')
assert(lightbox.includes('displayImageSrc'), 'lightbox must keep the original-first display contract')
assert(lightbox.includes('props.item?.src') && lightbox.includes('ewaOutputUrl'), 'lightbox must show original source before successful EWA output')
assert(lightbox.includes('ewaState'), 'lightbox must expose EWA state on the active image')
assert(lightbox.includes('data-ewa-debug') && lightbox.includes('data-ewa-compare'), 'lightbox must expose debug compare hooks')
assert(!lightbox.includes('@/media/ewa/vendor'), 'MarkdownLightbox must not import vendor passes directly')
assert(!caseGallery.includes('@/media/ewa/vendor'), 'CaseGallery must not import vendor passes directly')
assert(!lightbox.includes('onMounted(() => {\n  processActiveItem'), 'processor must not run on page load')
assert(caseGallery.includes("new CustomEvent('vt:open-gallery'"), 'CaseGallery must still activate lightbox lazily by click event')
assert(css.includes('.vt-lightbox__ewa-status'), 'lightbox CSS must include EWA status styling')
assert(css.includes('data-ewa-debug'), 'lightbox CSS must include debug-state styling')
assert(![types, presets, runtime, processor, debug, composable, lightbox, css].join('\n').includes('[object Object]'), 'sources must not contain [object Object]')

assert(pkg.scripts?.['smoke:ewa-gallery-processor'] === 'node scripts/smoke-ewa-gallery-processor.mjs', 'package.json must expose smoke:ewa-gallery-processor')
assert(checkLaunch.includes('scripts/smoke-ewa-gallery-processor.mjs'), 'check:launch must run smoke-ewa-gallery-processor')

console.log('[smoke:ewa-gallery-processor] PASS')
