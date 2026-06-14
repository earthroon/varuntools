import fs from 'node:fs'

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

const component = read('src/components/markdown/MiniGalleryStrip.vue')
const sectionLightbox = read('src/composables/useSectionLightbox.ts')
const css = read('src/styles/markdown-lightbox.css')
const qa = read('src/content/pages/lab-markdown-gallery/index.md')
const pkg = JSON.parse(read('package.json'))

const checks = [
  ['MiniGalleryStrip component exists', component.includes('vt-mini-gallery')],
  ['MiniGalleryStrip emits open payload', component.includes('groupId') && component.includes('index') && component.includes('defineEmits')],
  ['MiniGallery thumbs are buttons', component.includes('class="vt-mini-gallery__thumb"') && component.includes('type="button"')],
  ['MiniGallery decorative thumb alt empty', component.includes('alt=""')],
  ['useSectionLightbox imports MiniGalleryStrip', sectionLightbox.includes('MiniGalleryStrip')],
  ['useSectionLightbox mounts mini galleries', sectionLightbox.includes('mountMiniGalleries') && sectionLightbox.includes('createApp')],
  ['mini gallery host dataset exists', sectionLightbox.includes('data-vt-mini-gallery') || sectionLightbox.includes('vtMiniGallery')],
  ['single-image groups excluded', sectionLightbox.includes('group.items.length <= 1')],
  ['mini gallery open uses groupId/index', sectionLightbox.includes('openGroupById') && sectionLightbox.includes('onOpen')],
  ['cleanup removes mini gallery hosts', sectionLightbox.includes('unmountMiniGalleries') && sectionLightbox.includes('host.remove()')],
  ['excluded images include mini gallery', sectionLightbox.includes('.vt-mini-gallery')],
  ['mini gallery CSS exists', css.includes('.vt-mini-gallery') && css.includes('.vt-mini-gallery__thumb')],
  ['reduced motion for mini gallery exists', css.includes('prefers-reduced-motion') && css.includes('.vt-mini-gallery__thumb')],
  ['Visual QA documents Mini Gallery Contract', qa.includes('Mini Gallery Contract')],
  ['package script exists', pkg.scripts?.['smoke:mini-gallery'] === 'node scripts/smoke-mini-gallery.mjs'],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[mini-gallery] failed: ${name}`)
  process.exit(1)
}
console.log(`[mini-gallery] OK — ${checks.length} checks`)
