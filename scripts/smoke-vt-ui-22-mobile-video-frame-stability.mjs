import fs from 'node:fs'

function fail(message) {
  console.error('FAIL_VT_UI_22_MOBILE_VIDEO_FRAME_STABILITY')
  console.error(message)
  process.exit(1)
}

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function mustInclude(text, token, message) {
  if (!text.includes(token)) fail(message)
}

function mustNotInclude(text, token, message) {
  if (text.includes(token)) fail(message)
}

const videoPlayer = read('src/components/markdown/VideoPlayer.vue')
const packageJson = JSON.parse(read('package.json'))

mustInclude(videoPlayer, 'ratio?: VideoFrameRatio', 'VideoPlayer.vue missing ratio prop')
mustInclude(videoPlayer, 'fit?: VideoFrameFit', 'VideoPlayer.vue missing fit prop')
mustInclude(videoPlayer, "ratio: '16/9'", 'VideoPlayer.vue missing default 16/9 ratio')
mustInclude(videoPlayer, "fit: 'contain'", 'VideoPlayer.vue missing default contain fit')
mustInclude(videoPlayer, '--vt-video-ratio', 'VideoPlayer.vue missing video ratio CSS variable')
mustInclude(videoPlayer, '--vt-video-fit', 'VideoPlayer.vue missing video fit CSS variable')
mustInclude(videoPlayer, 'aspect-ratio: var(--vt-video-ratio)', 'VideoPlayer.vue missing wrapper aspect-ratio authority')
mustInclude(videoPlayer, 'contain: layout paint', 'VideoPlayer.vue missing layout paint containment')
mustInclude(videoPlayer, 'data-vt-ui22-video-frame-size-authority="wrapper"', 'VideoPlayer.vue missing VT-UI-22 wrapper authority marker')
mustInclude(videoPlayer, '.vt-video-player__video', 'VideoPlayer.vue missing media class')
mustInclude(videoPlayer, 'position: absolute', 'VideoPlayer.vue video is not absolute fill')
mustInclude(videoPlayer, 'inset: 0', 'VideoPlayer.vue video missing inset fill')
mustInclude(videoPlayer, 'object-fit: var(--vt-video-fit, contain)', 'VideoPlayer.vue missing CSS-owned object fit')
mustInclude(videoPlayer, 'transform: translate3d(0, 0, 0)', 'VideoPlayer.vue missing GPU-stable media transform')

mustNotInclude(videoPlayer, 'viewportHeight', 'VideoPlayer.vue still owns layout through viewportHeight')
mustNotInclude(videoPlayer, 'window.innerHeight', 'VideoPlayer.vue still reads window.innerHeight for layout')
mustNotInclude(videoPlayer, 'ResizeObserver', 'VideoPlayer.vue still measures wrapper with ResizeObserver')
mustNotInclude(videoPlayer, 'measuredStageSize', 'VideoPlayer.vue still computes measured stage size')
mustNotInclude(videoPlayer, 'stageStyle', 'VideoPlayer.vue still binds measured stageStyle')
mustNotInclude(videoPlayer, 'videoStyle', 'VideoPlayer.vue still binds measured videoStyle')
mustNotInclude(videoPlayer, 'intrinsicWidth', 'VideoPlayer.vue still tracks intrinsic width as layout authority')
mustNotInclude(videoPlayer, 'intrinsicHeight', 'VideoPlayer.vue still tracks intrinsic height as layout authority')
mustNotInclude(videoPlayer, 'readIntrinsicVideoSize', 'VideoPlayer.vue metadata still rewrites layout size')

for (const file of ['src/components/markdown/WorkCard.vue', 'src/pages/MarkdownPage.vue', 'src/components/markdown/MarkdownDocumentView.vue']) {
  if (fs.existsSync(file)) {
    mustNotInclude(read(file), 'window.scrollTo', file + ' must not own video scroll jitter correction')
  }
}

if (packageJson.scripts?.['smoke:vt-ui-22-mobile-video-frame-stability'] !== 'node scripts/smoke-vt-ui-22-mobile-video-frame-stability.mjs') {
  fail('package.json missing smoke:vt-ui-22-mobile-video-frame-stability script')
}

console.log('PASS_VT_UI_22_MOBILE_VIDEO_FRAME_STABILITY')
console.log('PASS_VT_UI_22_WRAPPER_ASPECT_RATIO_SIZE_AUTHORITY')
console.log('PASS_VT_UI_22_SMALL_VIEWPORT_HEIGHT_GUARD')
console.log('PASS_VT_UI_22_NO_SCROLL_JITTER_VIDEO_REFLOW')
