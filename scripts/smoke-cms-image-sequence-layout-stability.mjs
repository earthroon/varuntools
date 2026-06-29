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
const packageJson = JSON.parse(read('package.json') || '{}')
const imageSequenceVue = read(imageSequenceVuePath)

check('ImageSequence.vue exists', fs.existsSync(imageSequenceVuePath))
check('ImageSequence.vue contains vt-image-sequence__frame', imageSequenceVue.includes('vt-image-sequence__frame'))
check('ImageSequence.vue contains aspect-ratio', imageSequenceVue.includes('aspect-ratio'))
check('ImageSequence.vue contains --vt-image-sequence-ratio', imageSequenceVue.includes('--vt-image-sequence-ratio'))
check('ImageSequence.vue has itemStyle', imageSequenceVue.includes('function itemStyle'))
check('ImageSequence.vue has ratioForItem', imageSequenceVue.includes('function ratioForItem'))
check('ImageSequence.vue preserves item width binding', imageSequenceVue.includes(':width="item.width"'))
check('ImageSequence.vue preserves item height binding', imageSequenceVue.includes(':height="item.height"'))

const hasLoadingModeBinding = imageSequenceVue.includes(':loading="loadingMode()"')
const hasLoadingModeFunction = imageSequenceVue.includes('function loadingMode')
const hasLazyEagerReturn =
  imageSequenceVue.includes("return props.lazy ? 'lazy' : 'eager'")
  || imageSequenceVue.includes("props.lazy ? 'lazy' : 'eager'")
  || imageSequenceVue.includes("return lazy ? 'lazy' : 'eager'")
  || imageSequenceVue.includes("lazy ? 'lazy' : 'eager'")

check(
  'ImageSequence.vue uses lazy/eager loading',
  hasLoadingModeBinding && hasLoadingModeFunction && hasLazyEagerReturn,
)

check('ImageSequence.vue has role list', imageSequenceVue.includes('role="list"'))
check('ImageSequence.vue has role listitem', imageSequenceVue.includes('role="listitem"'))
check('ImageSequence.vue has vt-image-sequence__caption', imageSequenceVue.includes('vt-image-sequence__caption'))
check('ImageSequence.vue has vt-image-sequence__missing', imageSequenceVue.includes('vt-image-sequence__missing'))
check('ImageSequence.vue has scroll-snap-type', imageSequenceVue.includes('scroll-snap-type'))
check('ImageSequence.vue has object-fit', imageSequenceVue.includes('object-fit'))

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

check(
  'package.json has smoke:cms-image-sequence-layout',
  Boolean(packageJson.scripts?.['smoke:cms-image-sequence-layout']),
)

if (failures.length) {
  console.error('FAIL_VARUNTOOLS_CMS_IMAGE_SEQUENCE_LAYOUT_STABILITY')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log('PASS_VARUNTOOLS_CMS_IMAGE_SEQUENCE_LAYOUT_STABILITY')
