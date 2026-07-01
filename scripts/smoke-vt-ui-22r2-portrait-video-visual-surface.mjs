import fs from 'node:fs'

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

const video = read('src/components/markdown/VideoPlayer.vue')
const css = read('src/styles/markdown-components.css')
const mount = read('src/markdown/mountMarkdownComponents.ts')
const pkg = JSON.parse(read('package.json'))

const checks = []
function pass(name, condition) {
  checks.push([name, Boolean(condition)])
}

pass('VideoPlayer has portrait chrome suppression computed', video.includes('const shouldSuppressPortraitChrome = computed'))
pass('VideoPlayer has native controls computed', video.includes('const shouldShowNativeControls = computed'))
pass('VideoPlayer no longer binds controls directly to props.controls', !video.includes(':controls="props.controls"'))
pass('VideoPlayer binds controls to computed chrome policy', video.includes(':controls="shouldShowNativeControls"'))
pass('VideoPlayer has R2 soft letterbox marker', video.includes('data-vt-ui22r2-visual-surface-guard="soft-letterbox"'))
pass('VideoPlayer supports click playback without native chrome', video.includes('@click="handleTogglePlayback"'))
pass('Mount defaults controls to explicit opt-in', mount.includes('controls: boolAttr(el.dataset.controls, false)'))
pass('CSS exposes soft frame background var', css.includes('--vt-video-frame-bg'))
pass('CSS exposes soft frame border var', css.includes('--vt-video-frame-border'))
pass('CSS stage uses soft frame background', css.includes('background: var(--vt-video-frame-bg);'))
pass('CSS video background is transparent', css.includes('background: transparent;'))
pass('CSS removes black video surface background', !css.includes('background: #050505;'))
pass('CSS portrait guard uses R2 46svh width', css.includes('width: min(82%, 390px, 46svh);'))
pass('CSS mobile portrait guard uses R2 46svh width', css.includes('width: min(76%, 340px, 46svh);'))
pass('CSS square guard remains bounded', css.includes('.vt-video-player--square') && css.includes('72svh'))
pass('CSS keeps fit variable authority', css.includes('object-fit: var(--vt-video-fit);'))
pass('CSS keeps optional cover fit', css.includes('.vt-video-player__video--cover'))
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
