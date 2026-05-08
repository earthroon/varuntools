#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
function assert(condition, message) {
  if (!condition) {
    console.error(`[smoke:ewa-authoring-metadata] FAIL ${message}`)
    process.exit(1)
  }
}

const required = [
  'src/media/ewa/ewaTypes.ts',
  'src/media/ewa/ewaPresets.ts',
  'src/media/ewa/ewaDiagnostics.ts',
  'src/media/ewa/ewaGalleryProcessor.ts',
  'src/composables/useEwaGalleryProcessor.ts',
  'src/components/portfolio/CaseGallery.vue',
  'src/components/markdown/GalleryStrip.vue',
  'src/composables/useSectionLightbox.ts',
  'src/markdown/galleryStripItems.ts',
  'src/markdown/mountMarkdownComponents.ts',
  'scripts/lib/csv-markdown.mjs',
  'src/components/markdown/EwaDebugPanel.vue',
  'docs/authoring/ewa-image-metadata.md',
]
for (const file of required) assert(exists(file), `${file} must exist`)

const types = read('src/media/ewa/ewaTypes.ts')
const presets = read('src/media/ewa/ewaPresets.ts')
const diagnostics = read('src/media/ewa/ewaDiagnostics.ts')
const processor = read('src/media/ewa/ewaGalleryProcessor.ts')
const composable = read('src/composables/useEwaGalleryProcessor.ts')
const caseGallery = read('src/components/portfolio/CaseGallery.vue')
const galleryStrip = read('src/components/markdown/GalleryStrip.vue')
const sectionLightbox = read('src/composables/useSectionLightbox.ts')
const galleryParser = read('src/markdown/galleryStripItems.ts')
const mounter = read('src/markdown/mountMarkdownComponents.ts')
const csv = read('scripts/lib/csv-markdown.mjs')
const panel = read('src/components/markdown/EwaDebugPanel.vue')
const docs = read('docs/authoring/ewa-image-metadata.md')
const pkg = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')

for (const token of ['ewaPreset', 'ewaMode', 'pixelSafe', 'ewaEnabled', 'ewaNote']) {
  assert(types.includes(token), `types must include ${token}`)
  assert(csv.includes(`media.${token}`), `CSV renderer must preserve media.${token}`)
  assert(docs.includes(`media.${token}`), `docs must mention media.${token}`)
}

assert(types.includes('EwaImageAuthoringMetadata') && types.includes('ResolvedEwaAuthoringMetadata'), 'authoring metadata types must exist')
assert(presets.includes('normalizeEwaAuthoringMetadata'), 'metadata normalizer must exist')
assert(presets.includes('resolveEwaPresetFromAuthoring'), 'metadata preset resolver must exist')
assert(presets.includes('EWA_METADATA_VALID_PRESETS'), 'valid preset contract must exist')
assert(presets.includes('EWA_METADATA_VALID_MODES'), 'valid mode contract must exist')
assert(presets.includes('pixelSafe === true') && presets.includes("EWA_GALLERY_PRESETS['pixel-safe']"), 'pixelSafe must force pixel-safe preset')
assert(presets.includes('ewaEnabled === false'), 'ewaEnabled=false must be honored')
assert(presets.includes('EWA_METADATA_INVALID_PRESET') && presets.includes('EWA_METADATA_INVALID_MODE'), 'invalid metadata warnings must exist')
assert(presets.includes('EWA_METADATA_PIXEL_SAFE_OVERRIDES_PRESET') && presets.includes('EWA_METADATA_DISABLED_OVERRIDES_PRESET'), 'override warnings must exist')

assert(diagnostics.includes('authoring?: ResolvedEwaAuthoringMetadata'), 'diagnostics must include authoring metadata')
assert(diagnostics.includes('EWA_METADATA_INVALID_PRESET') && diagnostics.includes('EWA_METADATA_INVALID_MODE'), 'diagnostics warning codes must include invalid metadata')
assert(processor.includes('media?: EwaImageAuthoringMetadata'), 'processor request must accept media metadata')
assert(processor.includes('resolveEwaPresetFromAuthoring'), 'processor must resolve preset from authoring metadata')
assert(processor.includes('ewa-disabled-by-metadata'), 'processor must bypass when ewaEnabled=false')
assert(processor.includes('pixel-safe-preset'), 'processor must keep pixel-safe fallback')
assert(processor.includes('authoring,'), 'processor must attach authoring diagnostics')

assert(composable.includes('getItemEwaMetadata'), 'composable must extract item metadata')
assert(composable.includes("getMetaValue(meta, 'media.ewaPreset')"), 'composable must read dotted media.ewaPreset')
assert(composable.includes('resolveEwaPresetFromAuthoring'), 'composable must use authoring resolver')
assert(composable.includes('media,'), 'composable must pass metadata to processor')

assert(caseGallery.includes('media?:') && galleryStrip.includes('media?:'), 'gallery item component types must include media metadata')
assert(sectionLightbox.includes('media?:') && sectionLightbox.includes('media: (item as any).media'), 'section lightbox must carry media metadata')
assert(galleryParser.includes("[\\w.-]*"), 'gallery metadata parser must allow dotted media keys')
assert(mounter.includes('galleryMediaFromMeta') && mounter.includes('media: galleryMediaFromMeta'), 'markdown mounter must convert gallery meta to media metadata')
assert(csv.includes('pushCaseGalleryMediaMeta'), 'CSV renderer must push case gallery media metadata')

for (const label of ['Authoring preset', 'Authoring mode', 'Authoring source', 'Pixel-safe', 'EWA enabled', 'EWA note']) {
  assert(panel.includes(label), `DebugPanel must show ${label}`)
}

assert(!caseGallery.includes('runEwa') && !galleryStrip.includes('runEwa'), 'gallery thumbnails must not run EWA directly')
assert(!composable.includes('onMounted(() => {\n  processActiveItem'), 'metadata must not trigger processor on page load')
assert(![types, presets, diagnostics, processor, composable, caseGallery, galleryStrip, sectionLightbox, galleryParser, mounter, csv, panel, docs].join('\n').includes('[object Object]'), 'sources must not contain [object Object]')

assert(pkg.scripts?.['smoke:ewa-authoring-metadata'] === 'node scripts/smoke-ewa-authoring-metadata.mjs', 'package.json must expose smoke:ewa-authoring-metadata')
assert(checkLaunch.includes('scripts/smoke-ewa-authoring-metadata.mjs'), 'check:launch must run smoke-ewa-authoring-metadata')

console.log('[smoke:ewa-authoring-metadata] PASS')
