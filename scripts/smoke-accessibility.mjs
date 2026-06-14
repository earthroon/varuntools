#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

const files = {
  captioned: read('src/components/markdown/CaptionedImage.vue'),
  beforeAfter: read('src/components/markdown/BeforeAfterWiper.vue'),
  box: read('src/components/markdown/MarkdownBox.vue'),
  toc: read('src/components/markdown/MarkdownToc.vue'),
  lightbox: read('src/components/markdown/MarkdownLightbox.vue'),
  pagecard: read('src/components/markdown/PagecardGrid.vue'),
  accessibilityCss: read('src/styles/accessibility.css'),
  qaPage: read('src/content/pages/lab-markdown-gallery/index.md'),
}

const checks = [
  ['VideoPlayer uses native video controls binding', read('src/components/markdown/VideoPlayer.vue').includes(':controls="controls"')],
  ['VideoPlayer has aria-label', read('src/components/markdown/VideoPlayer.vue').includes(':aria-label="mediaLabel"')],
  ['CaptionedImage aria-describedby', files.captioned.includes(':aria-describedby="tooltipId"')],
  ['CaptionedImage does not use aria-expanded for tooltip', !files.captioned.includes('aria-expanded')],
  ['CaptionedImage does not use JS tooltip state handlers', !files.captioned.includes('openTooltip') && !files.captioned.includes('@mouseenter')],
  ['CaptionedImage aria-label', files.captioned.includes(':aria-label="flagLabel"')],
  ['CaptionedImage tooltip role', files.captioned.includes('role="tooltip"')],
  ['CaptionedImage tooltip uses focus-visible CSS trigger', read('src/styles/markdown-components.css').includes('.vt-captioned-image__help:focus-visible ~ .vt-captioned-image__tooltip')],
  ['CaptionedImage frame wrapper', files.captioned.includes('vt-captioned-image__frame')],
  ['BeforeAfter range input', files.beforeAfter.includes('type="range"')],
  ['BeforeAfter aria-valuenow', files.beforeAfter.includes(':aria-valuenow')],
  ['BeforeAfter aria-valuetext', files.beforeAfter.includes(':aria-valuetext')],
  ['MarkdownBox aria-expanded', files.box.includes(':aria-expanded')],
  ['MarkdownBox aria-controls', files.box.includes(':aria-controls="bodyId"')],
  ['MarkdownToc nav label', files.toc.includes('aria-label="문서 목차"')],
  ['MarkdownToc aria-expanded', files.toc.includes(':aria-expanded')],
  ['MarkdownToc aria-controls', files.toc.includes(':aria-controls="tocPanelId"')],
  ['MarkdownToc Escape handler', files.toc.includes("event.key === 'Escape'")],
  ['Lightbox dialog role', files.lightbox.includes('role="dialog"')],
  ['Lightbox aria-modal', files.lightbox.includes('aria-modal="true"')],
  ['Lightbox close label', files.lightbox.includes('aria-label="확대 이미지 닫기"')],
  ['Pagecard decorative fallback hidden', files.pagecard.includes('aria-hidden="true"')],
  ['Reduced motion CSS', files.accessibilityCss.includes('prefers-reduced-motion: reduce')],
  ['Focus visible CSS', files.accessibilityCss.includes(':focus-visible')],
  ['Visual QA accessibility section', files.qaPage.includes('## 11. Accessibility Check')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[accessibility] missing: ${name}`)
  process.exit(1)
}

console.log(`[accessibility] OK — ${checks.length} checks`)
