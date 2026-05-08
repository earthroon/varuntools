#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const checks = []
function check(label, pass) {
  checks.push({ label, pass })
  if (!pass) console.error(`[lightbox-zoom] failed: ${label}`)
}

const lightboxPath = 'src/components/markdown/MarkdownLightbox.vue'
const cssPath = 'src/styles/markdown-lightbox.css'
const qaPath = 'src/content/pages/lab-markdown-gallery/index.md'

check('MarkdownLightbox.vue exists', exists(lightboxPath))
const lightbox = read(lightboxPath)
const css = read(cssPath)
const qa = read(qaPath)

check('zoom state exists', /const\s+zoom\s*=\s*ref\(1\)/.test(lightbox))
check('pan state exists', /const\s+panX\s*=\s*ref\(0\)/.test(lightbox) && /const\s+panY\s*=\s*ref\(0\)/.test(lightbox))
check('zoom constants exist', /MIN_ZOOM\s*=\s*1/.test(lightbox) && /MAX_ZOOM\s*=\s*4/.test(lightbox) && /ZOOM_STEP\s*=\s*0\.5/.test(lightbox))
check('zoom functions exist', /function\s+zoomIn/.test(lightbox) && /function\s+zoomOut/.test(lightbox) && /function\s+resetZoom/.test(lightbox))
check('pointer pan handlers exist', /handleImagePointerDown/.test(lightbox) && /handleImagePointerMove/.test(lightbox) && /handleImagePointerUp/.test(lightbox))
check('wheel zoom requires ctrlKey', /handleImageWheel/.test(lightbox) && /event\.ctrlKey/.test(lightbox))
check('keyboard zoom shortcuts exist', /event\.key\s*===\s*[\"']\+[\"']/.test(lightbox) && /event\.key\s*===\s*[\"']-[\"']/.test(lightbox) && /event\.key\s*===\s*[\"']0[\"']/.test(lightbox))
check('image change resets zoom', /props\.index/.test(lightbox) && /resetZoom\(\)/.test(lightbox) && /scrollActiveThumbIntoView/.test(lightbox))
check('close resets zoom', /function\s+requestClose/.test(lightbox) && /resetZoom\(\)/.test(lightbox))
check('zoom controls rendered', /vt-lightbox__zoom-controls/.test(lightbox) && /aria-label="이미지 확대 조작"/.test(lightbox))
check('zoom value aria live exists', /aria-live="polite"/.test(lightbox))
check('image transform binding exists', /:style="\{ transform: imageTransform \}"/.test(lightbox))
check('CSS zoom controls exists', css.includes('.vt-lightbox__zoom-controls') && css.includes('.vt-lightbox__zoom-button'))
check('CSS cursor grab exists', css.includes("[data-zoomed='1']") && css.includes('cursor: grab') && css.includes('cursor: grabbing'))
check('reduced motion disables image transition', css.includes('prefers-reduced-motion: reduce') && css.includes('.vt-lightbox__image'))
check('Visual QA has Lightbox Zoom Contract', qa.includes('Lightbox Zoom Contract'))

const failed = checks.filter((item) => !item.pass)
if (failed.length) process.exit(1)
console.log(`[lightbox-zoom] OK — ${checks.length} checks`)
