#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))

const lightbox = read('src/components/markdown/MarkdownLightbox.vue')
const parser = read('src/markdown/galleryStripItems.ts')
const sectionLightbox = read('src/composables/useSectionLightbox.ts')
const css = read('src/styles/markdown-lightbox.css')
const qa = read('src/content/pages/lab-markdown-gallery/index.md')
const pkg = JSON.parse(read('package.json'))

const checks = [
  ['MarkdownLightbox has metadata panel', lightbox.includes('vt-lightbox__meta') && lightbox.includes('currentTitle') && lightbox.includes('currentCaption')],
  ['MarkdownLightbox has action bar', lightbox.includes('vt-lightbox__actions') && lightbox.includes('Info') && lightbox.includes('Open') && lightbox.includes('Copy')],
  ['MarkdownLightbox has copyCurrentImageLink', lightbox.includes('copyCurrentImageLink') && lightbox.includes('navigator.clipboard.writeText')],
  ['MarkdownLightbox has aria-live copy status', lightbox.includes('vt-lightbox__copy-status') && lightbox.includes('aria-live="polite"')],
  ['MarkdownLightbox has original open action', lightbox.includes('target="_blank"') && lightbox.includes('원본 이미지 새 탭에서 열기')],
  ['galleryStripItems parser supports metadata segment', parser.includes('parseGalleryStripMeta') && parser.includes('title: meta.title')],
  ['useSectionLightbox parses gallery hash', sectionLightbox.includes('parseGalleryHash') && sectionLightbox.includes('#vt-gallery=')],
  ['useSectionLightbox opens hash deep link', sectionLightbox.includes('openHashDeepLink') && sectionLightbox.includes('collectManualGalleryGroup')],
  ['Section lightbox item has title/source metadata', sectionLightbox.includes('title?: string') && sectionLightbox.includes('meta?: Record<string, string>')],
  ['Visual QA contains Lightbox Metadata Contract', qa.includes('Lightbox Metadata Contract') && qa.includes('Manual Metadata Gallery')],
  ['CSS contains lightbox metadata styles', css.includes('.vt-lightbox__meta') && css.includes('.vt-lightbox__actions')],
  ['package script exists', pkg.scripts?.['smoke:lightbox-metadata'] === 'node scripts/smoke-lightbox-metadata.mjs'],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[lightbox-metadata] failed: ${name}`)
  process.exit(1)
}
console.log(`[lightbox-metadata] OK — ${checks.length} checks`)
