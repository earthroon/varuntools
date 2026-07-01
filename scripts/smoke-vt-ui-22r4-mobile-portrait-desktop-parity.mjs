import fs from 'node:fs'

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

const checks = []
function pass(name, condition) {
  checks.push([name, Boolean(condition)])
}

const css = read('src/styles/markdown-components.css')
const video = read('src/components/markdown/VideoPlayer.vue')
const pkg = JSON.parse(read('package.json'))

pass('CSS has R4 marker', css.includes('VT-UI-22R4 mobile portrait desktop parity'))
pass('Desktop portrait width uses relaxed clamp', css.includes('width: min(100%, clamp(320px, 78vw, 360px));'))
pass('Mobile portrait width uses desktop parity clamp', css.includes('width: min(100%, clamp(300px, 86vw, 360px));'))
pass('Mobile portrait guard does not keep old narrow 72vw 46svh contract', !css.includes('width: min(72vw, 320px, 46svh);'))
pass('Desktop portrait guard does not keep old narrow 74vw 46svh contract', !css.includes('width: min(74vw, 340px, 46svh);'))
pass('R3 clip surface remains in CSS', css.includes('.vt-video-player__clip'))
pass('R3 inner inset remains 1px', css.includes('--vt-video-inner-inset: 1px'))
pass('R3 inner radius remains 1.5px', css.includes('--vt-video-inner-radius: 1.5px'))
pass('Stage remains transparent shellless wrapper', css.includes('background: transparent;') && css.includes('border: 0;') && css.includes('box-shadow: none;'))
pass('VideoPlayer still has inner clip template marker', video.includes('data-vt-ui22r3-inner-clip="1"'))
pass('VideoPlayer still preserves manifest metadata prelayout props', video.includes('manifestWidth?: number') && video.includes('manifestHeight?: number') && video.includes('duration?: number'))
pass('Package has R4 smoke script', pkg.scripts?.['smoke:vt-ui-22r4-mobile-portrait-desktop-parity'] === 'node scripts/smoke-vt-ui-22r4-mobile-portrait-desktop-parity.mjs')

const failed = checks.filter(([, ok]) => !ok)

if (failed.length > 0) {
  console.error('FAIL_VT_UI_22R4_MOBILE_PORTRAIT_DESKTOP_PARITY')
  for (const [name] of failed) {
    console.error('- ' + name)
  }
  process.exit(1)
}

console.log('PASS_VT_UI_22R4_MOBILE_PORTRAIT_DESKTOP_PARITY')
console.log('PASS_VT_UI_22R4_PORTRAIT_WIDTH_GUARD_RELAX')
console.log('PASS_VT_UI_22R4_NO_NARROW_SOCK_MOBILE_FRAME')
console.log('PASS_VT_UI_22R4_KEEP_INNER_INSET_CLIP')
