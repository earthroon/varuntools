import fs from 'node:fs'
import path from 'node:path'

const repo = process.cwd()
const playerPath = path.join(repo, 'src/components/markdown/VideoPlayer.vue')

if (!fs.existsSync(playerPath)) {
  throw new Error('E_R13_PLAYER_MISSING')
}

const source = fs.readFileSync(playerPath, 'utf8').replace(/\r\n/g, '\n')
const scriptEnd = source.indexOf('</script>')
if (scriptEnd < 0) throw new Error('E_R13_SCRIPT_END_MISSING')
const script = source.slice(0, scriptEnd)

function requireText(text, label) {
  if (!source.includes(text)) throw new Error(`E_R13_REQUIRED_${label}`)
}

function requireScript(text, label) {
  if (!script.includes(text)) throw new Error(`E_R13_SCRIPT_REQUIRED_${label}`)
}

function forbidScript(text, label) {
  if (script.includes(text)) throw new Error(`E_R13_SCRIPT_FORBIDDEN_${label}`)
}

requireScript("revision: 'FULLSCREEN_CAPABILITY_AUTHORITY_R13'", 'RECEIPT_REVISION')
requireScript('document.fullscreenEnabled === true', 'STANDARD_CAPABILITY')
requireScript("return 'standard-root'", 'STANDARD_ROOT')
requireScript("return 'standard-video'", 'STANDARD_VIDEO')
requireScript("return 'webkit-video'", 'WEBKIT_VIDEO')
requireScript('webkitSupportsFullscreen === true', 'WEBKIT_SUPPORT_GATE')
requireScript("'fullscreenchange'", 'FULLSCREENCHANGE')
requireScript("'fullscreenerror'", 'FULLSCREENERROR')
requireScript("'webkitbeginfullscreen'", 'WEBKIT_BEGIN')
requireScript("'webkitendfullscreen'", 'WEBKIT_END')
requireScript("'webkitfullscreenerror'", 'WEBKIT_ERROR')
requireScript('standardRootRejected', 'ROOT_HEALTH')
requireScript('standardVideoRejected', 'VIDEO_HEALTH')
requireScript('maxRequestsPerGesture', 'GESTURE_RECEIPT')
requireScript('recordGestureRequest()', 'GESTURE_GATE')
requireText('data-vt-r13-fullscreen-authority="capability-standard-root-video-webkit-last"', 'DATA_AUTHORITY')
requireText('grid-template-columns: 34px minmax(52px, 58px) 34px;', 'TOUCH_GEOMETRY')
requireText('@pointerdown.stop', 'POINTER_ISOLATION')
requireText('@click.stop="toggleFullscreen"', 'CLICK_ISOLATION')

forbidScript('prefersMobileFullscreenTarget', 'MOBILE_HEURISTIC_FUNCTION')
forbidScript('navigator.maxTouchPoints', 'MAX_TOUCH_POINTS')
forbidScript("matchMedia('(pointer: coarse)')", 'COARSE_POINTER_SCRIPT')
forbidScript('navigator.userAgent', 'UA_SNIFFING')

const resolverStart = script.indexOf('function resolveFullscreenAuthority(')
const resolverEnd = script.indexOf('\nfunction markStandardRequestRejected', resolverStart)
if (resolverStart < 0 || resolverEnd < 0) throw new Error('E_R13_RESOLVER_RANGE')
const resolver = script.slice(resolverStart, resolverEnd)

const rootIndex = resolver.indexOf("return 'standard-root'")
const videoIndex = resolver.indexOf("return 'standard-video'")
const webkitIndex = resolver.indexOf("return 'webkit-video'")
if (!(rootIndex >= 0 && videoIndex > rootIndex && webkitIndex > videoIndex)) {
  throw new Error('E_R13_AUTHORITY_ORDER')
}

const standardBlock = resolver.slice(0, webkitIndex)
if (!standardBlock.includes('document.fullscreenEnabled === true')) {
  throw new Error('E_R13_STANDARD_CAPABILITY_NOT_AUTHORITATIVE')
}
const webkitBlock = resolver.slice(resolver.lastIndexOf('const webkitVideo'), webkitIndex + "return 'webkit-video'".length)
if (!webkitBlock.includes('webkitSupportsFullscreen === true')) {
  throw new Error('E_R13_WEBKIT_SUPPORT_GATE_MISSING')
}
if (!resolver.includes("if (standardEnabled)")) {
  throw new Error('E_R13_STANDARD_BRANCH_MISSING')
}

const toggleStart = script.indexOf('function toggleFullscreen()')
const toggleEnd = script.indexOf('\nfunction ensureSegmentedSession', toggleStart)
if (toggleStart < 0 || toggleEnd < 0) throw new Error('E_R13_TOGGLE_RANGE')
const toggle = script.slice(toggleStart, toggleEnd)

for (const forbidden of [
  'explicitPlay(',
  '.pause(',
  '.seek(',
  '.destroy(',
  'new SegmentedPlaybackSession',
  'video.src',
  'video.load(',
  'removeAttribute(\'src\')',
]) {
  if (toggle.includes(forbidden)) {
    throw new Error(`E_R13_TRANSPORT_FIREWALL_${forbidden}`)
  }
}

const rootBranch = toggle.slice(
  toggle.indexOf("if (authority === 'standard-root')"),
  toggle.indexOf("if (authority === 'standard-video')"),
)
const videoBranch = toggle.slice(
  toggle.indexOf("if (authority === 'standard-video')"),
  toggle.indexOf("if (authority === 'webkit-video')"),
)
const webkitBranch = toggle.slice(
  toggle.indexOf("if (authority === 'webkit-video')"),
  toggle.indexOf("playbackError.value = 'E_PUBLIC_FULLSCREEN_UNAVAILABLE'"),
)

if ((rootBranch.match(/requestFullscreen\(/g) ?? []).length !== 1) {
  throw new Error('E_R13_ROOT_REQUEST_COUNT_STATIC')
}
if ((videoBranch.match(/requestFullscreen\(/g) ?? []).length !== 1) {
  throw new Error('E_R13_VIDEO_REQUEST_COUNT_STATIC')
}
if ((webkitBranch.match(/webkitEnterFullscreen/g) ?? []).length !== 1) {
  throw new Error('E_R13_WEBKIT_REQUEST_COUNT_STATIC')
}
if (rootBranch.includes('video.requestFullscreen') || rootBranch.includes('webkitEnterFullscreen')) {
  throw new Error('E_R13_ROOT_SAME_GESTURE_FALLBACK')
}
if (videoBranch.includes('root.requestFullscreen') || videoBranch.includes('webkitEnterFullscreen')) {
  throw new Error('E_R13_VIDEO_SAME_GESTURE_FALLBACK')
}

console.log('PASS_VARUNTOOLS_PUBLIC_PLAYBACK_FULLSCREEN_CAPABILITY_AUTHORITY_CLOSURE_R13_STATIC')
