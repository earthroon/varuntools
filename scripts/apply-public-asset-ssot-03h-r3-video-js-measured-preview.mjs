import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const cssPath = path.join(root, 'src/styles/markdown-components.css')

function replaceCssBlock(source, selector, replacement) {
  const selectorIndex = source.indexOf(selector)
  if (selectorIndex < 0) {
    throw new Error(`CSS selector missing: ${selector}`)
  }

  const openIndex = source.indexOf('{', selectorIndex)
  if (openIndex < 0) {
    throw new Error(`CSS selector has no block: ${selector}`)
  }

  let depth = 0
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return `${source.slice(0, selectorIndex)}${replacement}${source.slice(index + 1)}`
      }
    }
  }

  throw new Error(`CSS block not closed: ${selector}`)
}

const stageBlock = `.vt-video-player__stage {
  position: relative;
  max-width: 100%;
  margin-inline: auto;
  overflow: hidden;
  border-radius: var(--vt-radius-md);
  border: 1px solid var(--vt-hair);
  background: #000;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    var(--vt-shadow-1);
}`

const videoBlock = `.vt-video-player__video {
  display: block;
  background: #000;
}`

if (!fs.existsSync(cssPath)) {
  throw new Error(`Missing css file: ${path.relative(root, cssPath)}`)
}

let css = fs.readFileSync(cssPath, 'utf8')
css = replaceCssBlock(css, '.vt-video-player__stage', stageBlock)
css = replaceCssBlock(css, '.vt-video-player__video', videoBlock)
fs.writeFileSync(cssPath, css, 'utf8')

console.log('APPLY_PUBLIC_ASSET_SSOT_03H_R3_VIDEO_JS_MEASURED_PREVIEW')
