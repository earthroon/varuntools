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
const mount = read('src/markdown/mountMarkdownComponents.ts')
const pkg = JSON.parse(read('package.json'))

pass('VideoPlayer has manifestWidth prop', video.includes('manifestWidth?: number'))
pass('VideoPlayer has manifestHeight prop', video.includes('manifestHeight?: number'))
pass('VideoPlayer has duration prop', video.includes('duration?: number'))
pass('VideoPlayer computes manifestRatio', video.includes('const manifestRatio = computed'))
pass('VideoPlayer prioritizes manifestRatio before intrinsicRatio', video.indexOf('if (manifestRatio.value)') > -1 && video.indexOf('if (manifestRatio.value)') < video.indexOf('return intrinsicRatio.value'))
pass('VideoPlayer orientation uses manifest fallback width', video.includes('manifestWidth || fallback.width'))
pass('VideoPlayer orientation uses manifest fallback height', video.includes('manifestHeight || fallback.height'))
pass('VideoPlayer has inset clip element', video.includes('vt-video-player__clip'))
pass('VideoPlayer has inner clip marker', video.includes('data-vt-ui22r3-inner-clip="1"'))
pass('VideoPlayer has shell policy marker', video.includes('data-vt-ui22r3-shell-policy="inset-clip"'))
pass('CSS owns 1px inset token', css.includes('--vt-video-inner-inset: 1px;'))
pass('CSS owns 1.5px radius token', css.includes('--vt-video-inner-radius: 1.5px;'))
pass('CSS stage is transparent shellless wrapper', css.includes('.vt-video-player__stage') && css.includes('background: transparent;') && css.includes('border: 0;') && css.includes('box-shadow: none;'))
pass('CSS stage does not clip visual surface', css.includes('overflow: visible;'))
pass('CSS clip owns inset', css.includes('.vt-video-player__clip') && css.includes('inset: var(--vt-video-inner-inset);'))
pass('CSS clip owns micro radius', css.includes('border-radius: var(--vt-video-inner-radius);'))
pass('CSS video remains absolute fill', css.includes('.vt-video-player__video') && css.includes('position: absolute;') && css.includes('inset: 0;') && css.includes('height: 100%;'))
pass('Mount passes manifest width', mount.includes('manifestWidth: numberAttr(el.dataset.width, 0) || undefined'))
pass('Mount passes manifest height', mount.includes('manifestHeight: numberAttr(el.dataset.height, 0) || undefined'))
pass('Mount passes duration', mount.includes('duration: numberAttr(el.dataset.duration, 0) || undefined'))
pass('Package has R3 smoke script', pkg.scripts?.['smoke:vt-ui-22r3-video-inner-inset-manifest'] === 'node scripts/smoke-vt-ui-22r3-video-inner-inset-manifest.mjs')

const failed = checks.filter(([, ok]) => !ok)
if (failed.length > 0) {
  console.error('FAIL_VT_UI_22R3_VIDEO_INNER_INSET_MANIFEST')
  for (const [name] of failed) console.error('- ' + name)
  process.exit(1)
}

console.log('PASS_VT_UI_22R3_VIDEO_MANIFEST_METADATA_PRELAYOUT')
console.log('PASS_VT_UI_22R3_INNER_1PX_INSET_CLIP_FRAME')
console.log('PASS_VT_UI_22R3_MICRO_RADIUS_VIDEO_SURFACE')
console.log('PASS_VT_UI_22R3_NO_OVERSIZED_WHITE_SOCK_SHELL')
