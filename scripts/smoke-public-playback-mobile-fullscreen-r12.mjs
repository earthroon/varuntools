import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const file = path.join(root, 'src/components/markdown/VideoPlayer.vue')
const source = fs.readFileSync(file, 'utf8')

function requireToken(token, label = token) {
  if (!source.includes(token)) {
    throw new Error(`FAIL_R12_MISSING_${label}`)
  }
}

requireToken("type FullscreenAuthority =", 'FULLSCREEN_AUTHORITY_TYPE')
requireToken("'webkit-video'", 'WEBKIT_VIDEO_AUTHORITY')
requireToken("'standard-video'", 'STANDARD_VIDEO_AUTHORITY')
requireToken("'standard-root'", 'STANDARD_ROOT_AUTHORITY')
requireToken("matchMedia('(pointer: coarse)')", 'COARSE_POINTER_CLASSIFICATION')
requireToken('navigator.maxTouchPoints > 0', 'TOUCH_CLASSIFICATION')
requireToken('webkitEnterFullscreen', 'WEBKIT_ENTER_FULLSCREEN')
requireToken('webkitExitFullscreen', 'WEBKIT_EXIT_FULLSCREEN')
requireToken('webkitDisplayingFullscreen', 'WEBKIT_DISPLAY_STATE')
requireToken("'webkitbeginfullscreen'", 'WEBKIT_BEGIN_EVENT')
requireToken("'webkitendfullscreen'", 'WEBKIT_END_EVENT')
requireToken('document.fullscreenElement === root', 'ROOT_FULLSCREEN_STATE')
requireToken('document.fullscreenElement === video', 'VIDEO_FULLSCREEN_STATE')
requireToken('data-vt-r12-fullscreen-authority="video-mobile-root-desktop"', 'R12_MARKER')
requireToken('grid-template-columns: 34px minmax(52px, 58px) 34px;', 'MOBILE_GRID')
requireToken('min-width: 52px;', 'PROGRESS_MIN')
requireToken('max-width: 58px;', 'PROGRESS_MAX')
requireToken('@pointerdown.stop', 'FULLSCREEN_POINTER_STOP')
requireToken('@click.stop="toggleFullscreen"', 'FULLSCREEN_CLICK_STOP')
requireToken('.vt-video-player__video:fullscreen', 'STANDARD_VIDEO_FULLSCREEN_CSS')

const resolverStart = source.indexOf('function resolveFullscreenAuthority(')
const resolverEnd = source.indexOf('\nfunction syncFullscreenState()', resolverStart)
if (resolverStart < 0 || resolverEnd < 0) {
  throw new Error('FAIL_R12_RESOLVER_BOUNDARY')
}
const resolver = source.slice(resolverStart, resolverEnd)
const mobileStart = resolver.indexOf('if (prefersMobileFullscreenTarget())')
const webkitAt = resolver.indexOf('webkitEnterFullscreen', mobileStart)
const videoAt = resolver.indexOf('video.requestFullscreen', mobileStart)
const rootAt = resolver.indexOf('root.requestFullscreen', mobileStart)
if (!(mobileStart >= 0 && webkitAt > mobileStart && videoAt > webkitAt && rootAt > videoAt)) {
  throw new Error('FAIL_R12_MOBILE_AUTHORITY_ORDER')
}

const desktopRootAt = resolver.indexOf("return 'standard-root'", rootAt + 1)
const desktopVideoAt = resolver.indexOf("return 'standard-video'", desktopRootAt + 1)
if (!(desktopRootAt > rootAt && desktopVideoAt > desktopRootAt)) {
  throw new Error('FAIL_R12_DESKTOP_AUTHORITY_ORDER')
}

const toggleStart = source.indexOf('async function toggleFullscreen()')
const toggleEnd = source.indexOf('\nfunction ensureSegmentedSession()', toggleStart)
if (toggleStart < 0 || toggleEnd < 0) {
  throw new Error('FAIL_R12_TOGGLE_BOUNDARY')
}
const toggle = source.slice(toggleStart, toggleEnd)

for (const forbidden of [
  'explicitPlay(',
  '.pause(',
  '.seek(',
  '.destroy(',
  'new SegmentedPlaybackSession',
  'video.src =',
  'streamManifestUrl',
]) {
  if (toggle.includes(forbidden)) {
    throw new Error(`FAIL_R12_FULLSCREEN_TRANSPORT_MUTATION_${forbidden}`)
  }
}

if (/root\.requestFullscreen\([\s\S]*catch[\s\S]*video\.requestFullscreen/.test(toggle)) {
  throw new Error('FAIL_R12_REJECTED_ROOT_FALLBACK_CHAIN')
}

const fullscreenButtonNeedle = `class="vt-video-player__control-button vt-video-player__fullscreen-button"`
const buttonAt = source.indexOf(fullscreenButtonNeedle)
const buttonEnd = source.indexOf('</button>', buttonAt)
if (buttonAt < 0 || buttonEnd < 0) {
  throw new Error('FAIL_R12_FULLSCREEN_BUTTON_BOUNDARY')
}
const button = source.slice(buttonAt, buttonEnd)
if (!button.includes('@pointerdown.stop') || !button.includes('@click.stop="toggleFullscreen"')) {
  throw new Error('FAIL_R12_FULLSCREEN_BUTTON_EVENT_OWNERSHIP')
}

console.log('PASS_VARUNTOOLS_PUBLIC_PLAYBACK_MOBILE_FULLSCREEN_TARGET_AND_TOUCH_AUTHORITY_CLOSURE_R12_STATIC')
