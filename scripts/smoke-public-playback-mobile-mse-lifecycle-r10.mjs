import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sessionPath = path.join(root, 'src/lib/media/segmentedPlaybackSession.ts')
const playerPath = path.join(root, 'src/components/markdown/VideoPlayer.vue')

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`FAIL_R10_REQUIRED_FILE_MISSING:${file}`)
  return fs.readFileSync(file, 'utf8')
}

function requireToken(source, token, label) {
  if (!source.includes(token)) throw new Error(`FAIL_R10_${label}:${token}`)
}

function requireOrder(source, first, second, label) {
  const a = source.indexOf(first)
  const b = source.indexOf(second)
  if (a < 0 || b < 0 || a >= b) throw new Error(`FAIL_R10_ORDER_${label}`)
}

const session = read(sessionPath)
const player = read(playerPath)

const explicitStart = session.indexOf('async explicitPlay()')
const explicitEnd = session.indexOf('\n  pause() {', explicitStart)
if (explicitStart < 0 || explicitEnd < 0) throw new Error('FAIL_R10_EXPLICIT_PLAY_BODY')
const explicit = session.slice(explicitStart, explicitEnd)

requireOrder(explicit, 'this.attachMediaSource(epoch)', 'this.video.play()', 'ATTACH_BEFORE_PLAY')
requireOrder(explicit, 'this.video.play()', 'await this.ensureManifest', 'PLAY_BEFORE_NETWORK_AWAIT')
const firstAwait = explicit.indexOf('await ')
const playCall = explicit.indexOf('this.video.play()')
if (firstAwait >= 0 && firstAwait < playCall) throw new Error('FAIL_R10_ASYNC_BOUNDARY_BEFORE_PLAY')

requireToken(session, "revision: 'MOBILE_MSE_LIFECYCLE_R10'", 'LIFECYCLE_RECEIPT')
requireToken(session, 'class StalePlaybackOperation extends Error', 'STALE_EPOCH_TYPE')
requireToken(session, 'private assertAppendAuthority(', 'APPEND_AUTHORITY')
requireToken(session, 'sourceBufferBelongsTo(handle.mediaSource, sourceBuffer)', 'SOURCEBUFFER_MEMBERSHIP')
requireToken(session, 'this.lifecycleReceipt.appendAfterDetachAttemptCount += 1', 'DETACH_RECEIPT')
requireToken(session, 'this.lifecycleReceipt.expectedPlayAbortSuppressedCount += 1', 'PLAY_ABORT_SUPPRESSION')
requireToken(session, 'this.playIntentOrdinal += 1', 'PLAY_INTENT_ORDINAL')
requireToken(session, 'this.pumpTask = task', 'PUMP_SINGLE_FLIGHT')
requireToken(session, 'URL.revokeObjectURL(handle.objectUrl)', 'OBJECT_URL_RETIREMENT')
requireToken(session, 'progressiveMp4RequestCount: 0', 'NO_PROGRESSIVE_AUTHORITY')

if (session.includes('void this.appendInterval(')) {
  throw new Error('FAIL_R10_UNMANAGED_APPEND_TASK')
}

const pairStart = session.indexOf('private async appendOwnedPair(')
const pairEnd = session.indexOf('\n  private async primeMediaSource(', pairStart)
if (pairStart < 0 || pairEnd < 0) throw new Error('FAIL_R10_APPEND_HELPER_BODY')
const pair = session.slice(pairStart, pairEnd)
const allAppendCalls = (session.match(/\.appendBuffer\(/g) || []).length
const ownedAppendCalls = (pair.match(/\.appendBuffer\(/g) || []).length
if (allAppendCalls !== 2 || ownedAppendCalls !== 2) {
  throw new Error(`FAIL_R10_RAW_APPEND_AUTHORITY:all=${allAppendCalls}:owned=${ownedAppendCalls}`)
}

const destroyStart = session.indexOf('destroy() {')
if (destroyStart < 0) throw new Error('FAIL_R10_DESTROY_BODY')
const destroy = session.slice(destroyStart)
requireOrder(destroy, 'this.destroyed = true', 'this.video.pause()', 'DESTROY_INVALIDATES_BEFORE_PAUSE')
requireOrder(destroy, 'handle.detached = true', 'this.video.pause()', 'DETACH_BEFORE_VIDEO_LOAD')

requireToken(player, 'const segmentedPlayIntentActive = ref(false)', 'VUE_PLAY_INTENT')
requireToken(player, 'let segmentedUiIntentOrdinal = 0', 'VUE_INTENT_ORDINAL')
requireToken(player, 'void activeSession.pump().catch((cause) => {', 'PUMP_ERROR_BOUNDARY')
requireToken(player, 'if (segmentedPlayIntentActive.value) {', 'RAPID_PAUSE_AUTHORITY')
if (player.includes('void session.value?.pump()')) {
  throw new Error('FAIL_R10_UNMANAGED_VUE_PUMP')
}

console.log('PASS_VARUNTOOLS_PUBLIC_PLAYBACK_MOBILE_MSE_LIFECYCLE_CLOSURE_R10_STATIC')
