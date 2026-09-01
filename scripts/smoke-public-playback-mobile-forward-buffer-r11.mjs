import fs from 'node:fs'
import path from 'node:path'

const repo = process.cwd()
const sessionPath = path.join(repo, 'src/lib/media/segmentedPlaybackSession.ts')
const playerPath = path.join(repo, 'src/components/markdown/VideoPlayer.vue')

for (const file of [sessionPath, playerPath]) {
  if (!fs.existsSync(file)) {
    throw new Error(`HOLD_R11_REQUIRED_SOURCE_MISSING:${file}`)
  }
}

const session = fs.readFileSync(sessionPath, 'utf8')
const player = fs.readFileSync(playerPath, 'utf8')

function requireToken(source, token, label) {
  if (!source.includes(token)) {
    throw new Error(`HOLD_R11_${label}:${token}`)
  }
}

for (const [token, label] of [
  ["revision: 'MOBILE_FORWARD_BUFFER_STARVATION_R11'", 'RECEIPT'],
  ['FORWARD_BUFFER_TARGET_US = 3_750_000', 'TARGET'],
  ['FORWARD_BUFFER_MAX_US = 4_500_000', 'HARD_MAX'],
  ['BUFFER_RANGE_EPSILON_US = 100_000', 'BUFFER_EPSILON'],
  ['MAX_PUMP_INTERVAL_ADMISSIONS = 2', 'PUMP_BOUND'],
  ['MAX_TRACK_FETCH_CONCURRENCY = 2', 'TRACK_BOUND'],
  ['this.video.buffered', 'BUFFERED_AUTHORITY'],
  ['nextMissingForwardIndex', 'NEXT_MISSING'],
  ['samplePlayableBufferedAheadUs', 'BUFFER_SAMPLE'],
  ['Promise.all([', 'PARALLEL_TRACK_FETCH'],
  ['maxConcurrentTrackFetches', 'TRACK_RECEIPT'],
  ['maxConcurrentIntervals', 'INTERVAL_RECEIPT'],
  ['pumpCoalescedCount', 'PUMP_SINGLE_FLIGHT'],
  ['hardMaxAdmissionBlockedCount', 'HARD_MAX_BLOCK'],
  ['networkRebufferCount', 'REBUFFER_RECEIPT'],
  ['requestsStartedWhilePaused', 'PAUSE_BUDGET'],
  ['requestsStartedWhileOutOfView', 'OUT_OF_VIEW_BUDGET'],
  ['progressiveMp4RequestCount: 0', 'NO_PROGRESSIVE'],
]) {
  requireToken(session, token, label)
}

for (const [token, label] of [
  ['data-vt-r11-mobile-chrome="bounded-portrait-3-column"', 'VUE_AUTHORITY'],
  ['@media (max-width: 720px), (pointer: coarse)', 'MOBILE_MEDIA'],
  ['width: min(calc(100% - 10px), 146px);', 'CONTROL_BAR_BOUND'],
  ['grid-template-columns: 24px minmax(48px, 76px) 24px;', 'THREE_COLUMN'],
  ['max-width: 76px;', 'PROGRESS_BOUND'],
  ['grid-column: 3;', 'FULLSCREEN_COLUMN'],
  ['touch-action: manipulation;', 'FULLSCREEN_TOUCH'],
]) {
  requireToken(player, token, label)
}

const explicitStart = session.indexOf('  async explicitPlay() {')
const explicitEnd = session.indexOf('\n  pause() {', explicitStart)
if (explicitStart < 0 || explicitEnd < 0) {
  throw new Error('HOLD_R11_EXPLICIT_PLAY_SECTION')
}
const explicit = session.slice(explicitStart, explicitEnd)
const playInvoke = explicit.indexOf('rawPlayPromise = this.video.play()')
const manifestAwait = explicit.indexOf("await this.ensureManifest(signal, epoch, 'play')")
const currentAppend = explicit.indexOf("await this.appendInterval(index, epoch, signal, 'play')")
const nextAppend = explicit.indexOf("await this.appendInterval(nextIndex, epoch, signal, 'play')")
const playSettlement = explicit.indexOf('const playFailure = await playSettlement')

if (!(playInvoke >= 0 && manifestAwait > playInvoke)) {
  throw new Error('HOLD_R11_USER_ACTIVATION_ORDER')
}
if (!(currentAppend >= 0 && nextAppend > currentAppend && playSettlement > nextAppend)) {
  throw new Error('HOLD_R11_STARTUP_PRIME_ORDER')
}

const pumpStart = session.indexOf('  async pump() {')
const pumpEnd = session.indexOf('\n  destroy() {', pumpStart)
const pump = session.slice(pumpStart, pumpEnd)
for (const token of [
  'samplePlayableBufferedAheadUs()',
  'while (admissions < MAX_PUMP_INTERVAL_ADMISSIONS)',
  'nextMissingForwardIndex(',
  'canAdmitForwardInterval(',
  "await this.appendInterval(\n          candidateIndex,",
]) {
  if (!pump.includes(token)) {
    throw new Error(`HOLD_R11_PUMP_CONTRACT:${token}`)
  }
}

const appendStart = session.indexOf('  private async appendIntervalPhysical(')
const appendEnd = session.indexOf('\n  private async appendInterval(', appendStart)
const appendPhysical = session.slice(appendStart, appendEnd)
if (!appendPhysical.includes('Promise.all([')) {
  throw new Error('HOLD_R11_TRACK_PARALLELISM_MISSING')
}
if (!appendPhysical.includes('activeIntervalRequests > 1')) {
  throw new Error('HOLD_R11_INTERVAL_SINGLE_FLIGHT_MISSING')
}
if (!session.includes('activeTrackFetches > MAX_TRACK_FETCH_CONCURRENCY')) {
  throw new Error('HOLD_R11_TRACK_CONCURRENCY_GATE_MISSING')
}

console.log('PASS_VARUNTOOLS_PUBLIC_PLAYBACK_MOBILE_FORWARD_BUFFER_STARVATION_CLOSURE_R11_STATIC')
