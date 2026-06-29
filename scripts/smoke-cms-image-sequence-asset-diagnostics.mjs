#!/usr/bin/env node
import fs from 'node:fs'

const failures = []

function read(path) {
  return fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
}

function check(label, ok) {
  if (!ok) failures.push(label)
}

const imageSequenceVuePath = 'src/components/markdown/ImageSequence.vue'
const imageSequenceVue = read(imageSequenceVuePath)
const packageJson = JSON.parse(read('package.json') || '{}')

check('ImageSequence.vue exists', fs.existsSync(imageSequenceVuePath))
check('ImageSequence.vue has data-asset-id', imageSequenceVue.includes('data-asset-id'))
check('ImageSequence.vue has data-source', imageSequenceVue.includes('data-source'))
check('ImageSequence.vue has data-src-found', imageSequenceVue.includes('data-src-found'))
check('ImageSequence.vue has data-src-reason', imageSequenceVue.includes('data-src-reason'))
check('ImageSequence.vue has data-filename', imageSequenceVue.includes('data-filename'))
check('ImageSequence.vue has data-mime-type', imageSequenceVue.includes('data-mime-type'))
check('ImageSequence.vue preserves item.source', imageSequenceVue.includes('item.source'))
check('ImageSequence.vue preserves item.srcFound', imageSequenceVue.includes('item.srcFound'))
check('ImageSequence.vue preserves item.srcReason', imageSequenceVue.includes('item.srcReason'))
check('ImageSequence.vue missing fallback shows srcReason', imageSequenceVue.includes("item.srcReason || 'unresolved_content_asset'") || imageSequenceVue.includes('item.srcReason || "unresolved_content_asset"'))
check('ImageSequence.vue missing fallback shows source', imageSequenceVue.includes('<code v-if="item.source">{{ item.source }}</code>'))
check('ImageSequence.vue keeps loadingMode binding', imageSequenceVue.includes(':loading="loadingMode()"'))
check('ImageSequence.vue keeps image src binding', imageSequenceVue.includes(':src="item.src"'))
check('ImageSequence.vue keeps missing role status', imageSequenceVue.includes('role="status"'))
check('package.json has smoke:cms-image-sequence-diagnostics', Boolean(packageJson.scripts?.['smoke:cms-image-sequence-diagnostics']))

const forbiddenTokens = [
  'srcset',
  'sizes',
  '<picture',
  '<source',
  'canvas',
  'ImageBitmap',
  'createImageBitmap',
  'OffscreenCanvas',
  'imageOptimizer',
  'optimizer',
  'transform',
  'thumbnail',
  'blurData',
  'lqip',
  'EWA',
  'ewa',
  'webgpu',
  'wgpu',
]

for (const token of forbiddenTokens) {
  check('ImageSequence.vue forbidden token absent: ' + token, !imageSequenceVue.includes(token))
}

if (failures.length) {
  console.error('FAIL_VARUNTOOLS_CMS_IMAGE_SEQUENCE_ASSET_DIAGNOSTICS')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log('PASS_VARUNTOOLS_CMS_IMAGE_SEQUENCE_ASSET_DIAGNOSTICS')
