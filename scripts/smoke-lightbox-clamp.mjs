#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const checks = []
function check(label, pass) {
  checks.push({ label, pass })
  if (!pass) console.error(`[lightbox-clamp] failed: ${label}`)
}

const mathPath = 'src/composables/useLightboxZoomMath.ts'
const lightboxPath = 'src/components/markdown/MarkdownLightbox.vue'
const cssPath = 'src/styles/markdown-lightbox.css'
const qaPath = 'src/content/pages/lab-markdown-gallery/index.md'

check('useLightboxZoomMath.ts exists', exists(mathPath))
check('MarkdownLightbox.vue exists', exists(lightboxPath))
const math = read(mathPath)
const lightbox = read(lightboxPath)
const css = read(cssPath)
const qa = read(qaPath)

check('getContainedSize exists', /function\s+getContainedSize/.test(math))
check('getPanBounds exists', /function\s+getPanBounds/.test(math))
check('clampPan exists', /function\s+clampPan/.test(math))
check('getFocalZoomPan exists', /function\s+getFocalZoomPan/.test(math))
check('pan bounds use zoomed overflow', /zoomedWidth/.test(math) && /overflowX/.test(math) && /overflowY/.test(math))
check('MarkdownLightbox imports clampPan/focal zoom', /clampPan/.test(lightbox) && /getFocalZoomPan/.test(lightbox))
check('stage/image refs exist', /stageRef/.test(lightbox) && /imageRef/.test(lightbox) && /imageNaturalSize/.test(lightbox))
check('image load captures natural size', /handleLightboxImageLoad/.test(lightbox) && /naturalWidth/.test(lightbox) && /naturalHeight/.test(lightbox))
check('setPan clamps current pan', /function\s+setPan/.test(lightbox) && /clampPan\(/.test(lightbox))
check('pointer pan uses setPan', /handleImagePointerMove/.test(lightbox) && /setPan\(\{[\s\S]*panStart/.test(lightbox))
check('touch pan uses setPan', /touch\.clientX - touchLastX/.test(lightbox) && /setPan\(\{[\s\S]*panX\.value \+ dx/.test(lightbox))
check('wheel zoom passes focalPoint', /handleImageWheel/.test(lightbox) && /getStageFocalPoint\(event\.clientX, event\.clientY\)/.test(lightbox) && /setZoom\(zoom\.value \+ ZOOM_STEP, focalPoint\)/.test(lightbox))
check('double tap zoom passes focalPoint', /setZoom\(2, getStageFocalPoint\(touchLastX\.value, touchLastY\.value\)\)/.test(lightbox))
check('pinch zoom uses pinch center focal point', /pinchCenter/.test(lightbox) && /getTouchCenter/.test(lightbox) && /setZoom\(pinchStartZoom\.value \* scale, pinchCenter\.value\)/.test(lightbox))
check('resize clamps current pan', /handleResize/.test(lightbox) && /clampCurrentPan\(\)/.test(lightbox) && /addEventListener\("resize"/.test(lightbox))
check('stage exposes zoomed/panning data attrs', /:data-zoomed="isZoomed/.test(lightbox) && /:data-panning="isPanning/.test(lightbox))
check('CSS stage data cursor states exist', /vt-lightbox__stage\[data-zoomed='1'\]/.test(css) && /vt-lightbox__stage\[data-panning='1'\]/.test(css))
check('Visual QA has Lightbox Pan Boundary', qa.includes('Lightbox Pan Boundary'))

const failed = checks.filter((item) => !item.pass)
if (failed.length) process.exit(1)
console.log(`[lightbox-clamp] OK — ${checks.length} checks`)
