import fs from 'node:fs'

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

const checks = []
function pass(name, condition) {
  checks.push([name, Boolean(condition)])
}

const video = read('src/components/markdown/VideoPlayer.vue')
const css = read('src/styles/markdown-components.css')
const pkg = JSON.parse(read('package.json'))

pass('VideoPlayer has portrait chrome suppression', video.includes('shouldSuppressPortraitChrome'))
pass('VideoPlayer has native controls guard', video.includes('shouldShowNativeControls'))
pass('VideoPlayer controls uses guard', video.includes(':controls="shouldShowNativeControls"'))
pass('VideoPlayer has R2 marker', video.includes('data-vt-ui22r2-visual-surface-guard="soft-letterbox"') || video.includes('data-vt-ui22r3-shell-policy="inset-clip"'))
pass('CSS keeps frame bg token for compatibility', css.includes('--vt-video-frame-bg'))
pass('CSS keeps frame border token for compatibility', css.includes('--vt-video-frame-border'))
pass('CSS stage is not black', !css.includes('.vt-video-player__stage {\n  position: relative;\n  width: 100%;\n  aspect-ratio: var(--vt-video-ratio);\n  overflow: hidden;\n  border-radius: var(--vt-radius-md);\n  border: 1px solid var(--vt-hair);\n  background: #050505;'))
pass('CSS video background is transparent', css.includes('.vt-video-player__video') && css.includes('background: transparent;'))
pass('CSS portrait guard uses svh visual limit', css.includes('.vt-video-player--portrait') && (css.includes('clamp(320px, 78vw, 360px)') || css.includes('clamp(300px, 86vw, 360px)') || css.includes('width: min(100%, clamp(320px, 78vw, 360px));') || css.includes('width: min(100%, clamp(300px, 86vw, 360px));')))
pass('CSS object fit remains variable owned', css.includes('object-fit: var(--vt-video-fit);'))
pass('CSS cover fit remains optional', css.includes('.vt-video-player__video--cover'))
pass('Package has R2 smoke script', pkg.scripts?.['smoke:vt-ui-22r2-portrait-video-visual-surface'] === 'node scripts/smoke-vt-ui-22r2-portrait-video-visual-surface.mjs')

const failed = checks.filter(([, ok]) => !ok)
if (failed.length > 0) {
  console.error('FAIL_VT_UI_22R2_PORTRAIT_VIDEO_VISUAL_SURFACE')
  for (const [name] of failed) console.error('- ' + name)
  process.exit(1)
}

console.log('PASS_VT_UI_22R2_PORTRAIT_VIDEO_VISUAL_SURFACE_GUARD')
console.log('PASS_VT_UI_22R2_NATIVE_CONTROLS_CHROME_SUPPRESSION')
console.log('PASS_VT_UI_22R2_SOFT_LETTERBOX_BACKGROUND')
console.log('PASS_VT_UI_22R2_NO_BLACK_SOCK_FRAME')
