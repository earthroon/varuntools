#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()

function writeFile(relativePath, content) {
  const target = path.resolve(projectRoot, relativePath)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content.endsWith('\n') ? content : content + '\n', 'utf8')
}

function readJson(relativePath) {
  const target = path.resolve(projectRoot, relativePath)
  if (!fs.existsSync(target)) return {}
  return JSON.parse(fs.readFileSync(target, 'utf8'))
}

function writeJson(relativePath, value) {
  writeFile(relativePath, JSON.stringify(value, null, 2))
}

const imageSequenceVue = String.raw`<script setup lang="ts">
type ImageSequenceItem = {
  assetId?: string
  src: string
  srcFound: boolean
  srcReason: string
  source: string
  alt: string
  caption?: string
  width?: number
  height?: number
  filename?: string
  mimeType?: string
}

const props = withDefaults(
  defineProps<{
    layout?: 'crop-strip'
    reserved?: boolean
    lazy?: boolean
    fade?: boolean
    width?: number
    height?: number
    items: ImageSequenceItem[]
  }>(),
  {
    layout: 'crop-strip',
    reserved: true,
    lazy: true,
    fade: true,
  },
)

function positiveNumber(value: number | undefined): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function ratioForItem(item: ImageSequenceItem): string {
  const width = positiveNumber(item.width) ?? positiveNumber(props.width)
  const height = positiveNumber(item.height) ?? positiveNumber(props.height)

  if (width && height) return String(width) + ' / ' + String(height)
  return '16 / 9'
}

function itemStyle(item: ImageSequenceItem): Record<string, string> {
  return {
    '--vt-image-sequence-ratio': ratioForItem(item),
  }
}
</script>

<template>
  <figure
    class="vt-image-sequence vt-media-breakout"
    :data-layout="layout"
    :data-reserved="reserved ? '1' : '0'"
    :data-fade="fade ? '1' : '0'"
    aria-label="Image sequence"
  >
    <div class="vt-image-sequence__track" role="list">
      <article
        v-for="(item, index) in items"
        :key="item.assetId || item.source || index"
        class="vt-image-sequence__item"
        role="listitem"
        :style="itemStyle(item)"
      >
        <div class="vt-image-sequence__frame">
          <img
            v-if="item.srcFound"
            class="vt-image-sequence__image"
            :src="item.src"
            :alt="item.alt"
            :width="item.width"
            :height="item.height"
            :loading="lazy ? 'lazy' : 'eager'"
            decoding="async"
            draggable="false"
            :data-vt-source="item.source || undefined"
          />

          <div v-else class="vt-media-missing vt-image-sequence__missing" role="status">
            <strong>Image asset missing</strong>
            <span>{{ item.srcReason || item.source }}</span>
          </div>
        </div>

        <figcaption v-if="item.caption" class="vt-image-sequence__caption">
          {{ item.caption }}
        </figcaption>
      </article>
    </div>
  </figure>
</template>

<style scoped>
.vt-image-sequence {
  display: grid;
  gap: 12px;
  margin: 24px 0;
}

.vt-image-sequence__track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  padding-bottom: 4px;
}

.vt-image-sequence__item {
  flex: 0 0 min(82vw, 560px);
  min-width: 0;
  scroll-snap-align: start;
}

.vt-image-sequence__frame {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  background: rgba(36, 31, 26, .06);
  aspect-ratio: var(--vt-image-sequence-ratio, 16 / 9);
}

.vt-image-sequence__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vt-image-sequence__missing {
  display: grid;
  min-height: 100%;
  place-content: center;
  gap: 6px;
  padding: 18px;
  text-align: center;
}

.vt-image-sequence__caption {
  margin-top: 7px;
  color: rgba(36, 31, 26, .66);
  font-size: 12px;
  line-height: 1.5;
}

.vt-image-sequence[data-fade="1"] .vt-image-sequence__image {
  transition: opacity .18s ease;
}

@media (max-width: 720px) {
  .vt-image-sequence__item {
    flex-basis: 86vw;
  }
}
</style>`

const smoke = String.raw`#!/usr/bin/env node
import fs from 'node:fs'

const failures = []

function read(path) {
  return fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
}

function check(label, ok) {
  if (!ok) failures.push(label)
}

const componentPath = 'src/components/markdown/ImageSequence.vue'
const component = read(componentPath)
const packageJson = JSON.parse(read('package.json') || '{}')

check('ImageSequence.vue exists', fs.existsSync(componentPath))
check('ImageSequence.vue contains vt-image-sequence__frame', component.includes('vt-image-sequence__frame'))
check('ImageSequence.vue contains aspect-ratio', component.includes('aspect-ratio'))
check('ImageSequence.vue contains --vt-image-sequence-ratio', component.includes('--vt-image-sequence-ratio'))
check('ImageSequence.vue has itemStyle', component.includes('function itemStyle'))
check('ImageSequence.vue has ratioForItem', component.includes('function ratioForItem'))
check('ImageSequence.vue preserves :width="item.width"', component.includes(':width="item.width"'))
check('ImageSequence.vue preserves :height="item.height"', component.includes(':height="item.height"'))
check('ImageSequence.vue uses lazy/eager loading', component.includes(":loading=\"lazy ? 'lazy' : 'eager'\""))
check('ImageSequence.vue has role="list"', component.includes('role="list"'))
check('ImageSequence.vue has role="listitem"', component.includes('role="listitem"'))
check('ImageSequence.vue has vt-image-sequence__caption', component.includes('vt-image-sequence__caption'))
check('ImageSequence.vue has vt-image-sequence__missing', component.includes('vt-image-sequence__missing'))
check('ImageSequence.vue has scroll-snap-type', component.includes('scroll-snap-type'))
check('ImageSequence.vue has object-fit', component.includes('object-fit'))

const forbidden = [
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

for (const token of forbidden) {
  check('ImageSequence.vue forbidden token absent: ' + token, !component.includes(token))
}

check('package.json has smoke:cms-image-sequence-layout', Boolean(packageJson.scripts?.['smoke:cms-image-sequence-layout']))

if (failures.length) {
  console.error('FAIL_VARUNTOOLS_CMS_IMAGE_SEQUENCE_LAYOUT_STABILITY')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log('PASS_VARUNTOOLS_CMS_IMAGE_SEQUENCE_LAYOUT_STABILITY')`

const docs = String.raw`# VT-CMS-03 CMS Image Sequence Layout Stability

Patch: VT-CMS-03

Title: Image Sequence Reserved Slot / CLS Stable Frame / Caption Strip Polish / No Image Optimization

Local SSOT path:
D:\11124\dd\varuntools

## Scope

This patch stabilizes the public ImageSequence component layout after VT-CMS-02.

It uses the CMS-provided width and height fields to set a reserved frame ratio. It keeps the published item order intact and does not perform image optimization.

## Changes

- src/components/markdown/ImageSequence.vue
- scripts/smoke-cms-image-sequence-layout-stability.mjs
- package.json script smoke:cms-image-sequence-layout

## Explicit non-goals

- No srcset
- No sizes
- No picture/source pipeline
- No thumbnail generation
- No blur placeholder
- No EWA line
- No WebGPU line
- No D1 lookup
- No R2 list lookup

## Verify

Run from:
D:\11124\dd\varuntools

Commands:

  npm run smoke:cms-image-sequence-directive
  npm run smoke:cms-image-sequence-renderer
  npm run smoke:cms-image-sequence-layout
  npm run typecheck
  npm run build

## Pass token

PASS_VARUNTOOLS_CMS_IMAGE_SEQUENCE_LAYOUT_STABILITY`

writeFile('src/components/markdown/ImageSequence.vue', imageSequenceVue)
writeFile('scripts/smoke-cms-image-sequence-layout-stability.mjs', smoke)
writeFile('docs/CMS_IMAGE_SEQUENCE_PUBLIC_RENDERER.md', docs)

const pkg = readJson('package.json')
pkg.scripts = pkg.scripts || {}
pkg.scripts['smoke:cms-image-sequence-layout'] = 'node scripts/smoke-cms-image-sequence-layout-stability.mjs'
writeJson('package.json', pkg)

console.log('PASS_VT_CMS_03_APPLY_OVERLAY')
