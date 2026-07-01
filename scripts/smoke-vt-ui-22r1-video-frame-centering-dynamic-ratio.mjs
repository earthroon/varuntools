import fs from 'node:fs'

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

const checks = []
function pass(name, condition) {
  checks.push([name, Boolean(condition)])
}

const video = read('src/components/markdown/VideoPlayer.vue')
const css = read('src/styles/markdown-components.css')
const mount = read('src/markdown/mountMarkdownComponents.ts')
const pkg = JSON.parse(read('package.json'))

pass('VideoPlayer default figure does not use vt-media-breakout', !video.includes('class="vt-video-player vt-media-breakout"'))
pass('VideoPlayer has ratio prop', video.includes('ratio?: VideoRatio'))
pass('VideoPlayer has fit prop', video.includes('fit?: VideoFit'))
pass('VideoPlayer has breakout prop', video.includes('breakout?: boolean'))
pass('VideoPlayer supports auto ratio', video.includes("type VideoRatio = 'auto'"))
pass('VideoPlayer has videoWidth ref', video.includes('const videoWidth = ref<number | null>(null)'))
pass('VideoPlayer has videoHeight ref', video.includes('const videoHeight = ref<number | null>(null)'))
pass('VideoPlayer reads metadata width', video.includes('video?.videoWidth') || video.includes('video.videoWidth'))
pass('VideoPlayer reads metadata height', video.includes('video?.videoHeight') || video.includes('video.videoHeight'))
pass('VideoPlayer computes orientation', video.includes("type VideoOrientation = 'landscape' | 'portrait' | 'square'") && video.includes('const orientation = computed'))
pass('VideoPlayer exposes orientation data attr', video.includes(':data-orientation="orientation"'))
pass('VideoPlayer writes ratio CSS var', video.includes("'--vt-video-ratio': resolvedRatio.value"))
pass('VideoPlayer writes fit CSS var', video.includes("'--vt-video-fit': props.fit"))
pass('VideoPlayer keeps video absolute class fit binding', video.includes('vt-video-player__video--') && video.includes('+ fit'))
pass('VideoPlayer has center marker', video.includes('data-vt-ui22r1-video-frame-center="1"'))
pass('VideoPlayer has no window.innerHeight stage layout', !video.includes('window.innerHeight'))
pass('VideoPlayer has no ResizeObserver stage layout', !video.includes('ResizeObserver'))
pass('VideoPlayer has no stageStyle px authority', !video.includes('stageStyle'))
pass('VideoPlayer has no videoStyle px authority', !video.includes('videoStyle'))
pass('CSS centers video player', css.includes('margin: 1.8rem auto;'))
pass('CSS stage owns aspect ratio', css.includes('aspect-ratio: var(--vt-video-ratio);'))
pass('CSS stage has containment', css.includes('contain: layout paint;'))
pass('CSS video absolute fill', css.includes('position: absolute;') && css.includes('inset: 0;') && css.includes('height: 100%;'))
pass('CSS fit uses CSS var', css.includes('object-fit: var(--vt-video-fit);'))
pass('CSS cover fit exists', css.includes('.vt-video-player__video--cover'))
pass('CSS contain fit exists', css.includes('.vt-video-player__video--contain'))
pass('CSS portrait guard exists', css.includes('.vt-video-player--portrait') && (css.includes('clamp(320px, 78vw, 360px)') || css.includes('clamp(300px, 86vw, 360px)') || css.includes('width: min(100%, clamp(320px, 78vw, 360px));') || css.includes('width: min(100%, clamp(300px, 86vw, 360px));')))
pass('CSS square guard exists', css.includes('.vt-video-player--square') && css.includes('72svh'))
pass('CSS landscape guard exists', css.includes('.vt-video-player--landscape'))
pass('CSS optional breakout exists', css.includes('.vt-video-player--breakout') && css.includes('translateX(-50%)'))
pass('CSS caption follows frame center axis', css.includes('.vt-video-player__caption') && css.includes('margin: 0.75rem auto 0;'))
pass('Mount has normalizeVideoRatio', mount.includes('function normalizeVideoRatio'))
pass('Mount has normalizeVideoFit', mount.includes('function normalizeVideoFit'))
pass('Mount passes ratio', mount.includes('ratio: normalizeVideoRatio(el.dataset.ratio)'))
pass('Mount passes fit', mount.includes('fit: normalizeVideoFit(el.dataset.fit)'))
pass('Mount passes breakout', mount.includes('breakout: boolAttr(el.dataset.breakout, false)'))
pass('Package has smoke script', pkg.scripts?.['smoke:vt-ui-22r1-video-frame-centering-dynamic-ratio'] === 'node scripts/smoke-vt-ui-22r1-video-frame-centering-dynamic-ratio.mjs')

const failed = checks.filter(([, ok]) => !ok)
if (failed.length > 0) {
  console.error('FAIL_VT_UI_22R1_VIDEO_FRAME_CENTERING_DYNAMIC_RATIO')
  for (const [name] of failed) console.error('- ' + name)
  process.exit(1)
}

console.log('PASS_VT_UI_22R1_VIDEO_FRAME_CONTAINER_CENTERING')
console.log('PASS_VT_UI_22R1_DYNAMIC_INTRINSIC_RATIO_STAGE')
console.log('PASS_VT_UI_22R1_OPTIONAL_COVER_FIT_MODE')
console.log('PASS_VT_UI_22R1_NO_BREAKOUT_DRIFT_NO_BLACK_PILLARBOX_DEFAULT')
