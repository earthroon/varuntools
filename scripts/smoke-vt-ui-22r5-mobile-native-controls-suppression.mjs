import fs from 'node:fs'

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

const video = read('src/components/markdown/VideoPlayer.vue')
const mount = read('src/markdown/mountMarkdownComponents.ts')
const css = read('src/styles/markdown-components.css')
const pkg = JSON.parse(read('package.json'))

const failures = []

function pass(label, condition) {
  if (!condition) failures.push(label)
}

pass('VideoPlayer.vue controls default is false', video.includes('controls: false,'))
pass('VideoPlayer.vue has shouldShowNativeControls computed', video.includes('const shouldShowNativeControls = computed'))
pass('shouldShowNativeControls is explicit opt-in only', video.includes('props.controls === true'))
pass('template uses shouldShowNativeControls for native controls', video.includes(':controls="shouldShowNativeControls"'))
pass('template does not bind native controls directly to props.controls', !video.includes(':controls="props.controls"'))
pass('clip has R5 surface toggle marker', video.includes('data-vt-ui22r5-surface-toggle="1"'))
pass('clip has controls opt-in marker', video.includes('data-vt-ui22r5-native-controls'))
pass('figure has controls opt-in only marker', video.includes('data-vt-ui22r5-controls-opt-in-only="1"'))
pass('handleSurfaceToggle exists', video.includes('async function handleSurfaceToggle'))
pass('handleSurfaceToggle returns when native controls are enabled', video.includes('if (shouldShowNativeControls.value) return'))
pass('handleSurfaceToggle calls video.play', video.includes('await video.play()'))
pass('handleSurfaceToggle calls video.pause', video.includes('video.pause()'))
pass('Enter keydown handler exists', video.includes('@keydown.enter.prevent="handleSurfaceToggle"'))
pass('Space keydown handler exists', video.includes('@keydown.space.prevent="handleSurfaceToggle"'))
pass('surface role button exists for no-native-controls mode', video.includes("role=\"button\"") || video.includes(':role="shouldShowNativeControls ? undefined : \'button\'"'))
pass('surface tabindex exists for keyboard toggle', video.includes(':tabindex="shouldShowNativeControls ? undefined : 0"'))
pass('mount controls default is false', mount.includes('controls: boolAttr(el.dataset.controls, false)'))
pass('mount controls default is not true', !mount.includes('controls: boolAttr(el.dataset.controls, true)'))
pass('CSS has R5 surface toggle block', css.includes('VT-UI-22R5 mobile native controls suppression'))
pass('CSS has focus-visible affordance', css.includes(".vt-video-player__clip[data-vt-ui22r5-surface-toggle='1']:focus-visible"))
pass('CSS has cursor pointer affordance', css.includes(".vt-video-player__clip[data-vt-ui22r5-surface-toggle='1']"))
pass('package has R5 smoke script', pkg.scripts && pkg.scripts['smoke:vt-ui-22r5-mobile-native-controls-suppression'])

if (failures.length > 0) {
  console.error('FAIL_VT_UI_22R5_MOBILE_NATIVE_CONTROLS_SUPPRESSION')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log('PASS_VT_UI_22R5_MOBILE_PORTRAIT_NATIVE_CONTROLS_SUPPRESSION')
console.log('PASS_VT_UI_22R5_TAP_TO_PLAY_VIDEO_SURFACE')
console.log('PASS_VT_UI_22R5_CONTROLS_OPT_IN_ONLY')
console.log('PASS_VT_UI_22R5_NO_NATIVE_CHROME_SOCK_FRAME')
