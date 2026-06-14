#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }
function assert(condition, message) { if (!condition) { console.error(`[smoke:ewa-visual-qa] FAIL ${message}`); process.exit(1) } }

const required = [
  'src/media/ewa/ewaDiagnostics.ts',
  'src/components/markdown/EwaDebugPanel.vue',
  'src/components/markdown/EwaCompareView.vue',
  'src/styles/ewa-debug.css',
]
for (const file of required) assert(exists(file), `${file} exists`)

const diagnostics = read('src/media/ewa/ewaDiagnostics.ts')
for (const token of ['EwaDeviceDiagnostics', 'EwaProcessDiagnostics', 'decodeMs', 'uploadMs', 'computeMs', 'presentMs', 'totalMs', 'sourceWidth', 'targetWidth', 'devicePixelRatio', 'fallbackReason', 'EWA_DIAG_SLOW_COMPUTE']) {
  assert(diagnostics.includes(token), `diagnostics contains ${token}`)
}

const debug = read('src/media/ewa/ewaDebug.ts')
assert(debug.includes('vt:ewa-debug'), 'localStorage vt:ewa-debug hook exists')
assert(debug.includes('vt:ewa-compare'), 'localStorage vt:ewa-compare hook exists')
assert(debug.includes("'split'"), 'split compare mode contract exists')

const runtime = read('src/media/ewa/ewaWebGpuRuntime.ts')
assert(runtime.includes('getEwaDeviceDiagnostics'), 'device diagnostics probe exists')
assert(runtime.includes('preferredCanvasFormat'), 'preferred canvas format diagnostic exists')

const processor = read('src/media/ewa/ewaGalleryProcessor.ts')
for (const token of ['decodeMs', 'uploadMs', 'computeMs', 'presentMs', 'totalMs', 'diagnostics', 'cacheHit']) {
  assert(processor.includes(token), `processor records ${token}`)
}
assert(!processor.includes('[object Object]'), 'processor contains no [object Object]')

const lightbox = read('src/components/markdown/MarkdownLightbox.vue')
assert(lightbox.includes('EwaDebugPanel'), 'MarkdownLightbox connects EwaDebugPanel')
assert(lightbox.includes('EwaCompareView'), 'MarkdownLightbox connects EwaCompareView')
assert(lightbox.includes('data-ewa-compare'), 'MarkdownLightbox has compare mode data attribute')
assert(lightbox.includes('showEwaCompareView'), 'compare view is guarded')
assert(lightbox.includes('ewaDebugEnabled'), 'debug off guard exists')
assert(lightbox.includes('processActiveItem(props.item)'), 'visual QA does not replace active-image trigger')
assert(!lightbox.includes('vendor/'), 'component does not import EWA vendor directly')
assert(!lightbox.includes('[object Object]'), 'lightbox contains no [object Object]')

const compare = read('src/components/markdown/EwaCompareView.vue')
assert(compare.includes('vt-ewa-compare__split'), 'split compare view exists')
assert(compare.includes('Original'), 'original label exists')
assert(compare.includes('EWA'), 'processed label exists')

console.log('[smoke:ewa-visual-qa] PASS')
