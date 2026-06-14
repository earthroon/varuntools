#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const checks = []
function check(label, pass) {
  checks.push({ label, pass })
  if (!pass) console.error(`[touch-gallery] failed: ${label}`)
}

const touchPath = 'src/composables/useTouchGesture.ts'
const lightboxPath = 'src/components/markdown/MarkdownLightbox.vue'
const cssPath = 'src/styles/markdown-lightbox.css'
const qaPath = 'src/content/pages/lab-markdown-gallery/index.md'

check('useTouchGesture.ts exists', exists(touchPath))
check('MarkdownLightbox.vue exists', exists(lightboxPath))
const touch = read(touchPath)
const lightbox = read(lightboxPath)
const css = read(cssPath)
const qa = read(qaPath)

check('touch helper exports distance/strict double tap', touch.includes('getTouchDistance') && touch.includes('isStrictDoubleTap'))
check('DOUBLE_TAP_MS is 220', /DOUBLE_TAP_MS\s*=\s*220/.test(lightbox))
check('DOUBLE_TAP_DISTANCE_PX is 28', /DOUBLE_TAP_DISTANCE_PX\s*=\s*28/.test(lightbox))
check('SWIPE_MIN_DISTANCE exists', /SWIPE_MIN_DISTANCE\s*=\s*54/.test(lightbox))
check('handles touchstart', /handleTouchStart/.test(lightbox) && /@touchstart="handleTouchStart"/.test(lightbox))
check('handles touchmove', /handleTouchMove/.test(lightbox) && /@touchmove="handleTouchMove"/.test(lightbox))
check('handles touchend/cancel', /handleTouchEnd/.test(lightbox) && /@touchend="handleTouchEnd"/.test(lightbox) && /@touchcancel="handleTouchEnd"/.test(lightbox))
check('pinch zoom uses two touches', /event\.touches\.length\s*===\s*2/.test(lightbox) && /pinchStartDistance/.test(lightbox) && /pinchStartZoom/.test(lightbox))
check('pinch zoom changes zoom by scale with focal center', /nextDistance\s*\/\s*pinchStartDistance\.value/.test(lightbox) && /setZoom\(pinchStartZoom\.value \* scale, pinchCenter\.value\)/.test(lightbox))
check('zoomed one-finger pan gated by zoom > 1', /if \(zoom\.value > 1\)/.test(lightbox) && /setPan\(\{[\s\S]*panX\.value \+ dx/.test(lightbox) && /panY\.value \+ dy/.test(lightbox))
check('swipe navigation gated by zoom <= 1', /zoom\.value <= 1/.test(lightbox) && /SWIPE_MIN_DISTANCE/.test(lightbox) && /emit\('next'\)/.test(lightbox) && /emit\('previous'\)/.test(lightbox))
check('double tap uses strict helper', /isStrictDoubleTap/.test(lightbox) && /thresholdMs: DOUBLE_TAP_MS/.test(lightbox) && /distancePx: DOUBLE_TAP_DISTANCE_PX/.test(lightbox))
check('double tap toggles 2x/reset with focal point', /if \(zoom\.value > 1\) resetZoom\(\)/.test(lightbox) && /else setZoom\(2, getStageFocalPoint\(touchLastX\.value, touchLastY\.value\)\)/.test(lightbox))
check('interactive controls are excluded', /isInteractiveLightboxControl/.test(lightbox) && /vt-lightbox__thumbs/.test(lightbox) && /vt-lightbox__zoom-controls/.test(lightbox))
check('CSS stage touch-action none', css.includes('.vt-lightbox__stage') && css.includes('touch-action: none'))
check('CSS thumbs touch-action pan-x', css.includes('.vt-lightbox__thumbs') && css.includes('touch-action: pan-x'))
check('Visual QA has Mobile Touch Contract', qa.includes('Mobile Touch Contract'))

const failed = checks.filter((item) => !item.pass)
if (failed.length) process.exit(1)
console.log(`[touch-gallery] OK — ${checks.length} checks`)
