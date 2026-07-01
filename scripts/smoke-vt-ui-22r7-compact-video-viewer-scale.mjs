import fs from 'node:fs'

const cssFile = 'src/styles/markdown-components.css'
const packageFile = 'package.json'

const css = fs.readFileSync(cssFile, 'utf8')
const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'))

const failures = []

function requireCss(token, label) {
  if (!css.includes(token)) failures.push(label + ' missing ' + token)
}

function requirePackageScript(name, command) {
  if (pkg.scripts?.[name] !== command) {
    failures.push('package.json missing ' + name)
  }
}

requireCss('/* VT-UI-22R7 compact video viewer scale */', 'R7 marker')
requireCss('width: min(100%, clamp(160px, 42vw, 190px));', 'portrait compact width')
requireCss('width: min(100%, clamp(160px, 46vw, 190px));', 'mobile portrait compact width')
requireCss('width: min(100%, 360px);', 'landscape compact width')
requireCss('width: min(100%, 340px);', 'mobile landscape compact width')
requireCss('width: min(100%, 260px);', 'square compact width')
requireCss('width: min(100%, 240px);', 'mobile square compact width')
requireCss('.vt-video-player__custom-controls', 'custom controls selector')
requireCss('padding: 5px 7px;', 'custom controls compact padding')
requireCss('.vt-video-player__control-button', 'control button selector')
requireCss('width: 24px;', 'control button compact width')
requireCss('height: 24px;', 'control button compact height')
requireCss('.vt-video-player__progress', 'progress selector')
requireCss('min-width: 52px;', 'progress compact min width')
requireCss('grid-template-columns: auto 1fr;', 'mobile custom controls compact grid')
requireCss('.vt-video-player__time', 'time selector')
requireCss('display: none;', 'mobile time hidden')
requirePackageScript('smoke:vt-ui-22r7-compact-video-viewer-scale', 'node scripts/smoke-vt-ui-22r7-compact-video-viewer-scale.mjs')

if (failures.length > 0) {
  console.error('FAIL_VT_UI_22R7_COMPACT_VIDEO_VIEWER_SCALE')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log('PASS_VT_UI_22R7_COMPACT_VIDEO_VIEWER_SCALE')
console.log('PASS_VT_UI_22R7_HALF_SIZE_PORTRAIT_FRAME')
console.log('PASS_VT_UI_22R7_CUSTOM_CONTROLS_COMPACT_LAYOUT')
console.log('PASS_VT_UI_22R7_NO_OVERSIZED_PLAYBACK_VIEWER')
