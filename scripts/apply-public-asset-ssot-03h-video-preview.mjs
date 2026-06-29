import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const cssPath = path.join(root, 'src/styles/markdown-components.css')
const vuePatchPath = path.join(root, 'src/components/markdown/VideoPlayer.vue')

function fail(message) {
  console.error(`FAIL_PUBLIC_ASSET_SSOT_03H_APPLY: ${message}`)
  process.exit(1)
}

function replaceCssBlock(source, selector, replacement) {
  const start = source.indexOf(`${selector} {`)
  if (start < 0) fail(`CSS selector not found: ${selector}`)

  let index = source.indexOf('{', start)
  let depth = 0

  for (; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return `${source.slice(0, start)}${replacement}${source.slice(index + 1)}`
      }
    }
  }

  fail(`CSS block not closed: ${selector}`)
}

function insertAfterBlockIfMissing(source, selector, requiredSelector, block) {
  if (source.includes(requiredSelector)) return source

  const start = source.indexOf(`${selector} {`)
  if (start < 0) fail(`CSS selector not found for insertion: ${selector}`)

  let index = source.indexOf('{', start)
  let depth = 0

  for (; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return `${source.slice(0, index + 1)}\n\n${block}${source.slice(index + 1)}`
      }
    }
  }

  fail(`CSS block not closed for insertion: ${selector}`)
}

if (!fs.existsSync(cssPath)) fail('Missing src/styles/markdown-components.css')
if (!fs.existsSync(vuePatchPath)) fail('Missing src/components/markdown/VideoPlayer.vue. Copy the baked VideoPlayer.vue first.')

let css = fs.readFileSync(cssPath, 'utf8')

const stageBlock = `.vt-video-player__stage {
  position: relative;
  display: grid;
  place-items: center;
  width: fit-content;
  max-width: 100%;
  max-height: 78vh;
  aspect-ratio: var(--vt-video-aspect-ratio, 16 / 9);
  margin-inline: auto;
  overflow: hidden;
  border-radius: var(--vt-radius-md);
  border: 1px solid var(--vt-hair);
  background: #000;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    var(--vt-shadow-1);
}`

const stageFocusBlock = `.vt-video-player__stage:focus-visible {
  outline: 2px solid rgba(10, 132, 255, 0.58);
  outline-offset: 4px;
}`

const videoBlock = `.vt-video-player__video {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 78vh;
  background: #000;
  object-fit: contain;
}`

css = replaceCssBlock(css, '.vt-video-player__stage', stageBlock)
css = insertAfterBlockIfMissing(css, '.vt-video-player__stage', '.vt-video-player__stage:focus-visible', stageFocusBlock)
css = replaceCssBlock(css, '.vt-video-player__video', videoBlock)

fs.writeFileSync(cssPath, css, 'utf8')

console.log('PASS_PUBLIC_ASSET_SSOT_03H_APPLY_VIDEO_PREVIEW_CSS')
