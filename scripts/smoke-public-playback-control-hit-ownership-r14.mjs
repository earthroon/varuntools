import fs from 'node:fs'
import path from 'node:path'

const repo = process.cwd()
const file = path.join(repo, 'src/components/markdown/VideoPlayer.vue')
const source = fs.readFileSync(file, 'utf8')

const { parse } = await import('@vue/compiler-sfc')
const parsed = parse(source, { filename: 'VideoPlayer.vue' })
if (parsed.errors.length > 0) {
  const detail = parsed.errors
    .map((error) => error instanceof Error ? error.message : String(error))
    .join(' | ')
  throw new Error(`FAIL_R14_STATIC: vue-sfc-parse ${detail}`)
}

function pass(name, condition) {
  if (!condition) throw new Error(`FAIL_R14_STATIC: ${name}`)
}

function blockBetween(start, end) {
  const a = source.indexOf(start)
  const b = source.indexOf(end, a + start.length)
  if (a < 0 || b < 0) throw new Error(`FAIL_R14_STATIC: block ${start}`)
  return source.slice(a, b)
}

const clipBlock = blockBetween(
  '<div\n        class="vt-video-player__clip"',
  '<video\n',
)

const fullscreenBlock = blockBetween(
  'class="vt-video-player__control-button vt-video-player__fullscreen-button"',
  '</button>',
)

const surfaceIndex = source.indexOf('class="vt-video-player__surface-hit"')
const controlsIndex = source.indexOf('class="vt-video-player__custom-controls"')
const videoIndex = source.indexOf('class="vt-video-player__video"')

pass('usesSegmentedPlayback declaration unique', (source.match(/const usesSegmentedPlayback = computed\(/g) || []).length === 1)
pass('defineExpose declaration unique', (source.match(/defineExpose\(/g) || []).length === 1)
pass('no duplicate video opening splice', !source.includes('<video\n      >\n        <video'))
pass('single script setup close', (source.match(/<\/script>/g) || []).length === 1)
pass('single template close', (source.match(/<\/template>/g) || []).length === 1)
pass('R14 root marker', source.includes('data-vt-r14-control-hit-ownership="sibling-surface-controls"'))
pass('clip role removed', !clipBlock.includes('role="button"'))
pass('clip tabindex removed', !clipBlock.includes('tabindex="0"'))
pass('clip surface click removed', !clipBlock.includes('@click="handleSurfaceToggle"'))
pass('clip key enter removed', !clipBlock.includes('@keydown.enter'))
pass('clip key space removed', !clipBlock.includes('@keydown.space'))
pass('surface hit button exists', surfaceIndex >= 0)
pass('surface hit marker exists', source.includes('data-vt-r14-surface-hit="1"'))
pass('surface hit owns playback click', source.includes('@click="handleSurfaceHitClick"'))
pass('surface hit custom controls sibling order', videoIndex >= 0 && surfaceIndex > videoIndex && controlsIndex > surfaceIndex)
pass('controls ref exists', source.includes('ref="controlsRef"'))
pass('controls interaction active exists', source.includes('controlsInteractionActive'))
pass('controls pointerdown pin exists', source.includes('@pointerdown.stop="beginControlsInteraction"'))
pass('controls pointerup release exists', source.includes('@pointerup.stop="endControlsInteraction"'))
pass('controls pointercancel release exists', source.includes('@pointercancel.stop="endControlsInteraction"'))
pass('touch pointerleave guard exists', source.includes("event.pointerType !== 'mouse'"))
pass('touch pointerleave receipt exists', source.includes('touchPointerLeaveIgnoredCount += 1'))
pass('hide timer interaction guard exists', source.includes('hideTimerBlockedByInteractionCount += 1'))
pass('surface z layer', source.includes('.vt-video-player__surface-hit {') && source.includes('z-index: 1;'))
pass('controls z layer', source.includes('.vt-video-player__custom-controls {') && source.includes('z-index: 2;'))
pass('video z layer', source.includes('.vt-video-player__video {\n  z-index: 0;'))
pass('custom play isolated handler', source.includes('@click.stop="handleCustomPlayClick"'))
pass('fullscreen isolated click', fullscreenBlock.includes('@click.stop="toggleFullscreen"'))
pass('fullscreen direct pointerdown removed', !fullscreenBlock.includes('@pointerdown.stop'))
pass('R13 fullscreen enabled preserved', source.includes('document.fullscreenEnabled === true'))
pass('R13 standard root preserved', source.includes("'standard-root'"))
pass('R13 standard video preserved', source.includes("'standard-video'"))
pass('R13 webkit video preserved', source.includes("'webkit-video'"))
pass('R13 webkit capability preserved', source.includes('webkitSupportsFullscreen === true'))
pass('R13 standard fullscreenchange preserved', source.includes("'fullscreenchange'"))
pass('R13 standard fullscreenerror preserved', source.includes("'fullscreenerror'"))
pass('R13 webkit begin preserved', source.includes("'webkitbeginfullscreen'"))
pass('R13 webkit end preserved', source.includes("'webkitendfullscreen'"))
pass('R13 webkit error preserved', source.includes("'webkitfullscreenerror'"))
pass('R12 touch geometry play', source.includes('grid-template-columns: 34px minmax(52px, 58px) 34px;'))
pass('R12 touch geometry control width', source.includes('width: 34px;'))
pass('R14 receipt exposed', source.includes('defineExpose({ fullscreenReceipt, controlHitOwnershipReceipt })'))

console.log('PASS_VARUNTOOLS_PUBLIC_PLAYBACK_CONTROL_HIT_SURFACE_AND_TOUCH_EVENT_OWNERSHIP_CLOSURE_R14_STATIC')
