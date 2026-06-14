#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))

const component = read('src/components/markdown/GalleryStrip.vue')
const parser = read('src/markdown/galleryStripItems.ts')
const directive = read('src/markdown/directives/galleryStripDirective.ts')
const mount = read('src/markdown/mountMarkdownComponents.ts')
const sectionLightbox = read('src/composables/useSectionLightbox.ts')
const documentView = read('src/components/markdown/MarkdownDocumentView.vue')
const css = read('src/styles/markdown-lightbox.css')
const validate = read('scripts/validate-content.mjs')
const qa = read('src/content/pages/lab-markdown-gallery/index.md')
const pkg = JSON.parse(read('package.json'))

const checks = [
  ['GalleryStrip component exists', exists('src/components/markdown/GalleryStrip.vue') && component.includes('vt-gallery-strip')],
  ['galleryStripItems parser exists', exists('src/markdown/galleryStripItems.ts') && parser.includes('parseGalleryStripItems')],
  ['galleryStrip directive exists', exists('src/markdown/directives/galleryStripDirective.ts') && directive.includes('renderGalleryStripDirective')],
  ['directive registry includes gallery-strip', read('src/markdown/directiveTypes.ts').includes("'gallery-strip'") && read('src/markdown/directives/index.ts').includes('renderGalleryStripDirective')],
  ['directive plugin supports gallery body', read('src/markdown/directivePlugin.ts').includes("directiveName === 'gallery-strip'")],
  ['mountMarkdownComponents mounts gallery-strip', mount.includes("querySelectorAll('gallery-strip')") && mount.includes('GalleryStrip')],
  ['mount parses gallery-strip items', mount.includes('parseGalleryStripItems')],
  ['GalleryStrip dispatches vt:open-gallery', component.includes('vt:open-gallery') && component.includes('CustomEvent')],
  ['useSectionLightbox listens manual gallery event', sectionLightbox.includes('vt:open-gallery') && sectionLightbox.includes('handleManualGalleryOpen')],
  ['manual gallery suppresses auto mini gallery', sectionLightbox.includes('hasManualGallery') && sectionLightbox.includes('data-vt-manual-gallery')],
  ['gallery.autoMini option exists', documentView.includes('gallery?.autoMini') && sectionLightbox.includes('miniGallery?: boolean')],
  ['CSS contains gallery strip classes', css.includes('.vt-gallery-strip') && css.includes("[data-layout='grid']")],
  ['validate-content checks gallery-strip', validate.includes('validateGalleryStripDirectives') && validate.includes('gallery-strip.src')],
  ['Visual QA contains Manual Gallery Strip', qa.includes('## 15. Manual Gallery Strip') && qa.includes('::gallery-strip')],
  ['package script exists', pkg.scripts?.['smoke:gallery-strip'] === 'node scripts/smoke-gallery-strip.mjs'],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[gallery-strip] failed: ${name}`)
  process.exit(1)
}
console.log(`[gallery-strip] OK — ${checks.length} checks`)
