import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []

function fail(message) {
  failures.push(message)
}

function readText(relativePath) {
  const fullPath = path.join(root, relativePath)
  if (!fs.existsSync(fullPath)) {
    fail(`Missing file: ${relativePath}`)
    return ''
  }
  return fs.readFileSync(fullPath, 'utf8')
}

function assertIncludes(source, token, label) {
  if (!source.includes(token)) fail(`${label} missing token: ${token}`)
}

function assertNotIncludes(source, token, label) {
  if (source.includes(token)) fail(`${label} must not include token: ${token}`)
}

function extractCssBlock(css, selector) {
  const selectorIndex = css.indexOf(selector)
  if (selectorIndex < 0) {
    fail(`CSS selector missing: ${selector}`)
    return ''
  }

  const openIndex = css.indexOf('{', selectorIndex)
  if (openIndex < 0) {
    fail(`CSS selector has no block: ${selector}`)
    return ''
  }

  let depth = 0
  for (let index = openIndex; index < css.length; index += 1) {
    const char = css[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) return css.slice(selectorIndex, index + 1)
    }
  }

  fail(`CSS block not closed: ${selector}`)
  return ''
}

const videoPlayer = readText('src/components/markdown/VideoPlayer.vue')
const css = readText('src/styles/markdown-components.css')

assertIncludes(videoPlayer, 'frameElement', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'stageElement', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'videoElement', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'ResizeObserver', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'containerWidth', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'viewportHeight', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'measuredStageSize', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'stageStyle', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'videoStyle', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'videoWidth', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'videoHeight', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'getBoundingClientRect', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'window.addEventListener(\'resize\'', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'window.removeEventListener(\'resize\'', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'handleTogglePlayback', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'video.play()', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'video.pause()', 'VideoPlayer.vue')
assertIncludes(videoPlayer, '@keydown.self.space.prevent', 'VideoPlayer.vue')
assertIncludes(videoPlayer, '@keydown.space.prevent', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'safeAutoplay', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'resolvedPoster || undefined', 'VideoPlayer.vue')

assertNotIncludes(videoPlayer, '--vt-video-aspect-ratio', 'VideoPlayer.vue')
assertNotIncludes(videoPlayer, "window.addEventListener('keydown'", 'VideoPlayer.vue')
assertNotIncludes(videoPlayer, 'window.addEventListener("keydown"', 'VideoPlayer.vue')
assertNotIncludes(videoPlayer, "document.addEventListener('keydown'", 'VideoPlayer.vue')
assertNotIncludes(videoPlayer, 'document.addEventListener("keydown"', 'VideoPlayer.vue')

const stageBlock = extractCssBlock(css, '.vt-video-player__stage')
const videoBlock = extractCssBlock(css, '.vt-video-player__video')

assertIncludes(stageBlock, 'max-width: 100%', '.vt-video-player__stage')
assertIncludes(stageBlock, 'margin-inline: auto', '.vt-video-player__stage')
assertNotIncludes(stageBlock, 'aspect-ratio', '.vt-video-player__stage')
assertNotIncludes(stageBlock, 'width: min(', '.vt-video-player__stage')
assertNotIncludes(stageBlock, '--vt-video-aspect-ratio', '.vt-video-player__stage')

assertIncludes(videoBlock, 'display: block', '.vt-video-player__video')
assertNotIncludes(videoBlock, 'height: 100%', '.vt-video-player__video')
assertNotIncludes(videoBlock, 'max-height:', '.vt-video-player__video')
assertNotIncludes(videoBlock, 'object-fit: cover', '.vt-video-player__video')

if (failures.length) {
  console.error('FAIL_PUBLIC_ASSET_SSOT_03H_R3_VIDEO_JS_MEASURED_PREVIEW')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('PASS_PUBLIC_ASSET_SSOT_03H_R3_VIDEO_JS_MEASURED_PREVIEW')
