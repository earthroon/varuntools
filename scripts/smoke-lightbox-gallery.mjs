#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const sectionLightbox = read('src/composables/useSectionLightbox.ts')
const lightbox = read('src/components/markdown/MarkdownLightbox.vue')
const documentView = read('src/components/markdown/MarkdownDocumentView.vue')
const css = read('src/styles/markdown-lightbox.css')
const qa = read('src/content/pages/lab-markdown-gallery/index.md')
const checks = [
  ['useSectionLightbox.ts exists', exists('src/composables/useSectionLightbox.ts')],
  ['section boundary includes section-gap', sectionLightbox.includes('section-gap')],
  ['section boundary includes hr', sectionLightbox.includes("element.matches('hr')")],
  ['collectSectionLightboxGroups exists', sectionLightbox.includes('collectSectionLightboxGroups')],
  ['gallery group dataset written', sectionLightbox.includes('vtGalleryGroup') && sectionLightbox.includes('vtGalleryIndex')],
  ['page-wide lightbox import removed from DocumentView', !documentView.includes('@/composables/useLightbox')],
  ['DocumentView uses useSectionLightbox', documentView.includes('useSectionLightbox')],
  ['MarkdownLightbox accepts items', lightbox.includes('items?: SectionLightboxItem[]')],
  ['MarkdownLightbox contains thumbnail tray', lightbox.includes('vt-lightbox__thumbs')],
  ['MarkdownLightbox contains thumbnail button', lightbox.includes('vt-lightbox__thumb')],
  ['MarkdownLightbox uses aria-current', lightbox.includes(':aria-current')],
  ['MarkdownLightbox emits setIndex', lightbox.includes('setIndex') && lightbox.includes('selectThumb')],
  ['MarkdownLightbox scrolls active thumbnail', lightbox.includes('scrollIntoView')],
  ['thumbnail tray CSS exists', css.includes('.vt-lightbox__thumbs') && css.includes('.vt-lightbox__thumb.is-active')],
  ['Visual QA contains Section Scoped Lightbox section', qa.includes('## 14. Section Scoped Lightbox')],
  ['Visual QA contains separated gallery groups', qa.includes('Gallery A-1') && qa.includes('Gallery B-1') && qa.includes('::section-gap')],
  ['pagecard/video excluded from gallery groups', sectionLightbox.includes("closest('.vt-pagecard')") && sectionLightbox.includes("closest('.vt-video-player')")],
  ['Home/End keyboard navigation exists', sectionLightbox.includes("event.key === 'Home'") && sectionLightbox.includes("event.key === 'End'")],
]
const failed = checks.filter(([, ok]) => !ok)
if (failed.length) { for (const [name] of failed) console.error(`[lightbox-gallery] failed: ${name}`); process.exit(1) }
console.log(`[lightbox-gallery] OK — ${checks.length} checks`)
