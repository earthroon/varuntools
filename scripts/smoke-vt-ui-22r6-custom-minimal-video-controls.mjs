import fs from 'node:fs'

const checks = []

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function pass(label, ok) {
  checks.push({ label, ok })
}

const video = read('src/components/markdown/VideoPlayer.vue')
const mount = read('src/markdown/mountMarkdownComponents.ts')
const css = read('src/styles/markdown-components.css')
const pkg = JSON.parse(read('package.json'))

pass('VideoPlayer controls default false', video.includes('controls: false,'))
pass('shouldShowNativeControls explicit true gate', video.includes('const shouldShowNativeControls = computed(() => props.controls === true)'))
pass('nativeVideoControlAttrs no emit gate exists', video.includes('const nativeVideoControlAttrs = computed'))
pass('nativeVideoControlAttrs bound with v-bind', video.includes('v-bind="nativeVideoControlAttrs"'))
pass('direct props controls binding absent', !video.includes(':controls="props.controls"'))
pass('direct computed controls binding absent', !video.includes(':controls="shouldShowNativeControls"'))
pass('custom controls marker exists', video.includes('data-vt-ui22r6-custom-controls'))
pass('custom controls class exists', video.includes('vt-video-player__custom-controls'))
pass('control button class exists', video.includes('vt-video-player__control-button'))
pass('progress class exists', video.includes('vt-video-player__progress'))
pass('isPlaying state exists', video.includes('const isPlaying = ref(false)'))
pass('currentTime state exists', video.includes('const currentTime = ref(0)'))
pass('duration state exists', video.includes('const duration = ref(0)'))
pass('handleTimeUpdate exists', video.includes('function handleTimeUpdate'))
pass('handleSeekInput exists', video.includes('function handleSeekInput'))
pass('handleSurfaceToggle play pause exists', video.includes('video.play()') && video.includes('video.pause()'))
pass('play event handler exists', video.includes('@play="handlePlay"'))
pass('pause event handler exists', video.includes('@pause="handlePause"'))
pass('timeupdate event handler exists', video.includes('@timeupdate="handleTimeUpdate"'))
pass('ended event handler exists', video.includes('@ended="handleEnded"'))
pass('input seek handler exists', video.includes('@input="handleSeekInput"'))
pass('Enter keyboard toggle exists', video.includes('@keydown.enter.prevent="handleSurfaceToggle"'))
pass('Space keyboard toggle exists', video.includes('@keydown.space.prevent="handleSurfaceToggle"'))
pass('mount strict controls opt-in exists', mount.includes('controls: strictTrueAttr(el.dataset.controls)'))
pass('mount controls bool default true absent', !mount.includes('controls: boolAttr(el.dataset.controls, true)'))
pass('mount controls bool default false absent', !mount.includes('controls: boolAttr(el.dataset.controls, false)'))
pass('CSS custom controls class exists', css.includes('.vt-video-player__custom-controls'))
pass('CSS progress class exists', css.includes('.vt-video-player__progress'))
pass('CSS control button class exists', css.includes('.vt-video-player__control-button'))
pass('CSS custom control marker exists', css.includes('VT-UI-22R6 custom minimal video controls'))
pass('package smoke script exists', pkg.scripts && pkg.scripts['smoke:vt-ui-22r6-custom-minimal-video-controls'] === 'node scripts/smoke-vt-ui-22r6-custom-minimal-video-controls.mjs')

const failed = checks.filter((entry) => !entry.ok)

if (failed.length > 0) {
  console.error('FAIL_VT_UI_22R6_CUSTOM_MINIMAL_VIDEO_CONTROLS')
  for (const entry of failed) {
    console.error('- ' + entry.label)
  }
  process.exit(1)
}

console.log('PASS_VT_UI_22R6_CUSTOM_MINIMAL_VIDEO_CONTROLS')
console.log('PASS_VT_UI_22R6_NATIVE_CHROME_REPLACEMENT')
console.log('PASS_VT_UI_22R6_SURFACE_PLAY_PAUSE_PROGRESS_BAR')
console.log('PASS_VT_UI_22R6_NO_BROWSER_CONTROLS_UI')
