#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
function assert(condition, message) {
  if (!condition) {
    console.error(`[smoke:ewa-color-presentation] FAIL ${message}`)
    process.exit(1)
  }
}

const types = read('src/media/ewa/ewaTypes.ts')
const presenter = read('src/media/ewa/ewaCanvasPresenter.ts')
const diagnostics = read('src/media/ewa/ewaDiagnostics.ts')
const panel = read('src/components/markdown/EwaDebugPanel.vue')
const compare = read('src/components/markdown/EwaCompareView.vue')
const styles = read('src/styles/ewa-debug.css')
const processor = read('src/media/ewa/ewaGalleryProcessor.ts')
const lightbox = read('src/components/markdown/MarkdownLightbox.vue')
const workCard = exists('src/components/markdown/WorkCard.vue') ? read('src/components/markdown/WorkCard.vue') : ''
const pkg = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')
const docs = read('docs/authoring/ewa-color-presentation.md')

assert(types.includes('EwaPresentationPolicy'), 'presentation policy type must exist')
assert(types.includes("computeFormat: 'rgba16float'"), 'computeFormat=rgba16float contract must exist')
assert(types.includes("presentationFamily: 'rgba8unorm-srgb'"), 'presentationFamily=rgba8unorm-srgb contract must exist')
assert(types.includes("colorSpace: 'srgb'") && types.includes('bitDepth: 8') && types.includes("dynamicRange: 'sdr'"), '8-bit sRGB SDR policy must exist')
assert(types.includes("outputFormat: 'webp'") && types.includes('outputQuality: 0.92'), 'webp 0.92 default output policy must exist')
assert(types.includes("alphaMode: 'opaque'"), 'default alphaMode must be opaque')
assert(types.includes('presentation-blob-failed') && types.includes('presentation-canvas-failed'), 'presentation fallback reasons must exist')

assert(presenter.includes('createEwaPresentationPolicy'), 'presenter must use presentation policy')
assert(presenter.includes("presentationFamily: 'rgba8unorm-srgb'"), 'presenter must seal rgba8unorm-srgb family')
assert(presenter.includes('canvas.toBlob') && presenter.includes('image/webp') && presenter.includes('image/png'), 'presenter must encode webp/png via toBlob')
assert(presenter.includes('EWA_DIAG_OUTPUT_FORMAT_FALLBACK') && presenter.includes('presentation-blob-failed'), 'toBlob failure/fallback diagnostics must exist')
assert(presenter.includes('URL.revokeObjectURL'), 'object URL revoke responsibility must exist')
assert(presenter.includes("alphaMode: policy.alphaMode"), 'canvas configure must use alpha policy')
assert(presenter.includes("computeFormat: 'rgba16float'") && presenter.includes("colorSpace: 'srgb'") && presenter.includes('bitDepth: 8'), 'presentation diagnostics must include compute/color/bit depth')

assert(diagnostics.includes('EwaPresentationDiagnostics'), 'diagnostics must include presentation diagnostics type')
assert(diagnostics.includes('presentation?: EwaPresentationDiagnostics'), 'process diagnostics must include presentation field')
for (const token of ['EWA_DIAG_PRESENTATION_POLICY_SRGB8', 'EWA_DIAG_BLOB_FAILED', 'EWA_DIAG_OUTPUT_FORMAT_FALLBACK', 'EWA_DIAG_ALPHA_MODE_PREMULTIPLIED', 'EWA_DIAG_PRESENTATION_SLOW_BLOB']) {
  assert(diagnostics.includes(token), `diagnostics must include ${token}`)
}

for (const label of ['Compute format', 'Presentation', 'Canvas format', 'Color', 'Alpha', 'Output', 'Blob', 'Object URL']) {
  assert(panel.includes(label), `DebugPanel must show ${label}`)
}
assert(compare.includes('vt-ewa-compare__pane--original') && compare.includes('vt-ewa-compare__pane--processed'), 'compare view must keep original/processed panes')
assert(styles.includes('object-fit: contain') && styles.includes('background: #050505'), 'compare view must normalize object-fit/background')
assert(processor.includes('presentation: output.presentation.diagnostics') && processor.includes('presentation: presentation.diagnostics'), 'processor must attach presentation diagnostics')
assert(processor.includes('toEwaFallbackReason') && processor.includes('presentation-color-policy-failed'), 'presentation failure must fall back to original path')
assert(lightbox.includes('processActiveItem(props.item)'), 'processor must still be triggered by active lightbox item only')
assert(!lightbox.includes('onMounted(() => {\n  processActiveItem'), 'EWA processor must not run on page load')
assert(!workCard.includes('presentEwaTextureToCanvas') && !workCard.includes('EwaPresentationPolicy'), 'WorkCard/thumbnail must not use EWA presentation path')
assert(docs.includes('rgba8unorm-sRGB') && docs.includes('8-bit sRGB SDR') && docs.includes('rgba16float'), 'docs must document color presentation policy')
assert(![types, presenter, diagnostics, panel, compare, styles, processor, lightbox, docs].join('\n').includes('[object Object]'), 'sources must not contain [object Object]')

assert(pkg.scripts?.['smoke:ewa-color-presentation'] === 'node scripts/smoke-ewa-color-presentation.mjs', 'package.json must expose smoke:ewa-color-presentation')
assert(checkLaunch.includes('scripts/smoke-ewa-color-presentation.mjs'), 'check:launch must run smoke-ewa-color-presentation')

console.log('[smoke:ewa-color-presentation] PASS')
