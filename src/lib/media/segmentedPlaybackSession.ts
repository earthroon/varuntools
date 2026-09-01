import {
  assertManifest,
  type SegmentStreamManifest,
} from './segmentedPlaybackManifest'

function ownedArrayBuffer(
  bytes: Uint8Array<ArrayBufferLike> | ArrayBuffer,
): ArrayBuffer {
  if (bytes instanceof ArrayBuffer) {
    return bytes
  }

  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

export type SchedulerReceipt = {
  revision: 'SEGMENT_SCHEDULER_DATA_BUDGET_V1'
  explicitPlayCount: number
  manifestRequestCount: number
  manifestBytes: number
  videoInitBytes: number
  audioInitBytes: number
  segmentIntervalRequests: number
  videoSegmentBytes: number
  audioSegmentBytes: number
  totalMediaBytesReceived: number
  peakForwardBufferUs: number
  maxConcurrentIntervalRequests: number
  pauseAbortCount: number
  outOfViewAbortCount: number
  seekAbortCount: number
  requestsStartedWhilePaused: number
  requestsStartedWhileOutOfView: number
  progressiveMp4RequestCount: 0
  dataBudgetPass: boolean
}

export type MobileMseLifecycleReceipt = {
  revision: 'MOBILE_MSE_LIFECYCLE_R10'
  playIntentCount: number
  mediaSourceAttachCount: number
  mediaSourceDetachCount: number
  epochAdvanceCount: number
  staleOperationSuppressedCount: number
  sourceBufferAppendCount: number
  appendAfterDetachAttemptCount: number
  currentEpochAppendFailureCount: number
  playPromiseCreatedCount: number
  expectedPlayAbortSuppressedCount: number
  unexpectedPlayRejectCount: number
  abortControllerAbortCount: number
  pauseIntentCount: number
  seekIntentCount: number
  outOfViewIntentCount: number
  destroyCount: number
  unhandledAsyncRejectionCount: number
}

export type MobileForwardBufferReceipt = {
  revision: 'MOBILE_FORWARD_BUFFER_STARVATION_R11'
  startupPrimeCount: number
  bufferedAheadSampleCount: number
  minPlayingBufferedAheadUs: number
  maxBufferedAheadUs: number
  forwardBufferDemandCount: number
  forwardBufferSatisfiedCount: number
  hardMaxAdmissionBlockedCount: number
  intervalAdmissionCount: number
  maxConcurrentIntervals: number
  trackFetchCount: number
  maxConcurrentTrackFetches: number
  pairedTrackFetchCount: number
  pairFetchFailureCount: number
  pumpInvocationCount: number
  pumpCoalescedCount: number
  pumpIntervalAdmissionCount: number
  waitingEventCount: number
  stalledEventCount: number
  networkRebufferCount: number
  networkRebufferRecoveredCount: number
  networkRebufferTotalMs: number
  requestsStartedWhilePaused: number
  requestsStartedWhileOutOfView: number
  progressiveMp4RequestCount: 0
  forwardBudgetPass: boolean
}

const FORWARD_BUFFER_TARGET_US = 3_750_000
const FORWARD_BUFFER_MAX_US = 4_500_000
const BUFFER_RANGE_EPSILON_US = 100_000
const MAX_PUMP_INTERVAL_ADMISSIONS = 2
const MAX_TRACK_FETCH_CONCURRENCY = 2

type PlaybackIntent = 'playing' | 'paused' | 'destroyed'
type FetchReason = 'play' | 'seek' | 'pump'

type MediaSourceHandle = {
  epoch: number
  mediaSource: MediaSource
  objectUrl: string
  videoBuffer: SourceBuffer | null
  audioBuffer: SourceBuffer | null
  initAppendIssued: boolean
  detached: boolean
}

type IntervalTask = {
  epoch: number
  promise: Promise<void>
}

class StalePlaybackOperation extends Error {
  constructor() {
    super('E_PUBLIC_STALE_PLAYBACK_OPERATION')
    this.name = 'StalePlaybackOperation'
  }
}

function absolute(base: string, path: string) {
  return new URL(path, base).toString()
}

function isAbortLike(cause: unknown): boolean {
  if (!cause || typeof cause !== 'object') return false
  return (cause as { name?: unknown }).name === 'AbortError'
}

function publicError(code: string, cause?: unknown): Error {
  const error = new Error(code)
  if (cause !== undefined) {
    ;(error as Error & { cause?: unknown }).cause = cause
  }
  return error
}

function sourceBufferBelongsTo(
  mediaSource: MediaSource,
  sourceBuffer: SourceBuffer,
): boolean {
  const buffers = mediaSource.sourceBuffers
  for (let index = 0; index < buffers.length; index += 1) {
    if (buffers[index] === sourceBuffer) return true
  }
  return false
}

export class SegmentedPlaybackSession {
  private manifest: SegmentStreamManifest | null = null
  private handle: MediaSourceHandle | null = null
  private generation = 0
  private playIntentOrdinal = 0
  private aborter: AbortController | null = null
  private loaded = new Set<number>()
  private intervalTask: IntervalTask | null = null
  private pumpTask: Promise<void> | null = null
  private started = false
  private destroyed = false
  private desiredPlayback: PlaybackIntent = 'paused'
  private outsideViewport = false
  private activeIntervalRequests = 0
  private activeTrackFetches = 0
  private rebufferStartedAtMs: number | null = null
  private hasPlayingBufferSample = false
  private startupPriming = false

  readonly receipt: SchedulerReceipt = {
    revision: 'SEGMENT_SCHEDULER_DATA_BUDGET_V1',
    explicitPlayCount: 0,
    manifestRequestCount: 0,
    manifestBytes: 0,
    videoInitBytes: 0,
    audioInitBytes: 0,
    segmentIntervalRequests: 0,
    videoSegmentBytes: 0,
    audioSegmentBytes: 0,
    totalMediaBytesReceived: 0,
    peakForwardBufferUs: 0,
    maxConcurrentIntervalRequests: 0,
    pauseAbortCount: 0,
    outOfViewAbortCount: 0,
    seekAbortCount: 0,
    requestsStartedWhilePaused: 0,
    requestsStartedWhileOutOfView: 0,
    progressiveMp4RequestCount: 0,
    dataBudgetPass: true,
  }

  readonly lifecycleReceipt: MobileMseLifecycleReceipt = {
    revision: 'MOBILE_MSE_LIFECYCLE_R10',
    playIntentCount: 0,
    mediaSourceAttachCount: 0,
    mediaSourceDetachCount: 0,
    epochAdvanceCount: 0,
    staleOperationSuppressedCount: 0,
    sourceBufferAppendCount: 0,
    appendAfterDetachAttemptCount: 0,
    currentEpochAppendFailureCount: 0,
    playPromiseCreatedCount: 0,
    expectedPlayAbortSuppressedCount: 0,
    unexpectedPlayRejectCount: 0,
    abortControllerAbortCount: 0,
    pauseIntentCount: 0,
    seekIntentCount: 0,
    outOfViewIntentCount: 0,
    destroyCount: 0,
    unhandledAsyncRejectionCount: 0,
  }

  readonly forwardBufferReceipt: MobileForwardBufferReceipt = {
    revision: 'MOBILE_FORWARD_BUFFER_STARVATION_R11',
    startupPrimeCount: 0,
    bufferedAheadSampleCount: 0,
    minPlayingBufferedAheadUs: 0,
    maxBufferedAheadUs: 0,
    forwardBufferDemandCount: 0,
    forwardBufferSatisfiedCount: 0,
    hardMaxAdmissionBlockedCount: 0,
    intervalAdmissionCount: 0,
    maxConcurrentIntervals: 0,
    trackFetchCount: 0,
    maxConcurrentTrackFetches: 0,
    pairedTrackFetchCount: 0,
    pairFetchFailureCount: 0,
    pumpInvocationCount: 0,
    pumpCoalescedCount: 0,
    pumpIntervalAdmissionCount: 0,
    waitingEventCount: 0,
    stalledEventCount: 0,
    networkRebufferCount: 0,
    networkRebufferRecoveredCount: 0,
    networkRebufferTotalMs: 0,
    requestsStartedWhilePaused: 0,
    requestsStartedWhileOutOfView: 0,
    progressiveMp4RequestCount: 0,
    forwardBudgetPass: true,
  }

  private beginNetworkRebuffer() {
    if (
      this.rebufferStartedAtMs !== null ||
      !this.started ||
      this.destroyed ||
      this.desiredPlayback !== 'playing' ||
      this.video.seeking ||
      this.startupPriming ||
      this.loaded.size === 0
    ) {
      return
    }

    this.rebufferStartedAtMs = Date.now()
    this.forwardBufferReceipt.networkRebufferCount += 1
  }

  private closeNetworkRebuffer(recovered: boolean) {
    if (this.rebufferStartedAtMs === null) return
    this.forwardBufferReceipt.networkRebufferTotalMs += Math.max(
      0,
      Date.now() - this.rebufferStartedAtMs,
    )
    if (recovered) {
      this.forwardBufferReceipt.networkRebufferRecoveredCount += 1
    }
    this.rebufferStartedAtMs = null
  }

  private handleWaitingEvent = () => {
    this.forwardBufferReceipt.waitingEventCount += 1
    this.beginNetworkRebuffer()
  }

  private handleStalledEvent = () => {
    this.forwardBufferReceipt.stalledEventCount += 1
    this.beginNetworkRebuffer()
  }

  private handlePlayingEvent = () => {
    this.closeNetworkRebuffer(true)
  }

  constructor(
    private video: HTMLVideoElement,
    private manifestUrl: string,
  ) {
    this.video.addEventListener('waiting', this.handleWaitingEvent)
    this.video.addEventListener('stalled', this.handleStalledEvent)
    this.video.addEventListener('playing', this.handlePlayingEvent)
  }

  private abortCurrentOperation() {
    if (this.aborter && !this.aborter.signal.aborted) {
      this.aborter.abort()
      this.lifecycleReceipt.abortControllerAbortCount += 1
    }
  }

  private advanceEpoch(createController: true): {
    epoch: number
    signal: AbortSignal
  }
  private advanceEpoch(createController: false): {
    epoch: number
    signal: null
  }
  private advanceEpoch(createController: boolean) {
    this.generation += 1
    this.lifecycleReceipt.epochAdvanceCount += 1

    if (this.handle && !this.handle.detached) {
      this.handle.epoch = this.generation
    }

    this.abortCurrentOperation()
    this.aborter = null

    if (!createController) {
      return { epoch: this.generation, signal: null }
    }

    this.aborter = new AbortController()
    return {
      epoch: this.generation,
      signal: this.aborter.signal,
    }
  }

  private isCurrent(
    epoch: number,
    signal?: AbortSignal | null,
  ): boolean {
    return (
      !this.destroyed &&
      this.generation === epoch &&
      !signal?.aborted
    )
  }

  private assertCurrent(
    epoch: number,
    signal?: AbortSignal | null,
  ) {
    if (!this.isCurrent(epoch, signal)) {
      throw new StalePlaybackOperation()
    }
  }

  private isExpectedLifecycleFailure(cause: unknown): boolean {
    return (
      cause instanceof StalePlaybackOperation ||
      isAbortLike(cause)
    )
  }

  private suppressExpectedLifecycleFailure(cause: unknown): boolean {
    if (!this.isExpectedLifecycleFailure(cause)) return false
    this.lifecycleReceipt.staleOperationSuppressedCount += 1
    return true
  }

  private recordRequestStart(reason: FetchReason) {
    if (reason !== 'seek' && this.desiredPlayback !== 'playing') {
      this.receipt.requestsStartedWhilePaused += 1
      this.forwardBufferReceipt.requestsStartedWhilePaused += 1
      this.forwardBufferReceipt.forwardBudgetPass = false
    }
    if (reason !== 'seek' && this.outsideViewport) {
      this.receipt.requestsStartedWhileOutOfView += 1
      this.forwardBufferReceipt.requestsStartedWhileOutOfView += 1
      this.forwardBufferReceipt.forwardBudgetPass = false
    }
  }

  private samplePlayableBufferedAheadUs(): number {
    const currentUs = Math.max(0, this.video.currentTime * 1e6)
    const ranges = this.video.buffered
    let aheadUs = 0

    for (let index = 0; index < ranges.length; index += 1) {
      const startUs = ranges.start(index) * 1e6
      const endUs = ranges.end(index) * 1e6
      if (
        currentUs + BUFFER_RANGE_EPSILON_US >= startUs &&
        currentUs <= endUs + BUFFER_RANGE_EPSILON_US
      ) {
        aheadUs = Math.max(0, endUs - currentUs)
        break
      }
    }

    this.forwardBufferReceipt.bufferedAheadSampleCount += 1
    this.forwardBufferReceipt.maxBufferedAheadUs = Math.max(
      this.forwardBufferReceipt.maxBufferedAheadUs,
      aheadUs,
    )
    this.receipt.peakForwardBufferUs = Math.max(
      this.receipt.peakForwardBufferUs,
      aheadUs,
    )

    if (this.desiredPlayback === 'playing') {
      if (!this.hasPlayingBufferSample) {
        this.forwardBufferReceipt.minPlayingBufferedAheadUs = aheadUs
        this.hasPlayingBufferSample = true
      } else {
        this.forwardBufferReceipt.minPlayingBufferedAheadUs = Math.min(
          this.forwardBufferReceipt.minPlayingBufferedAheadUs,
          aheadUs,
        )
      }
    }

    if (aheadUs > FORWARD_BUFFER_MAX_US + BUFFER_RANGE_EPSILON_US) {
      this.forwardBufferReceipt.forwardBudgetPass = false
    }

    return aheadUs
  }

  private nextMissingForwardIndex(
    startIndex: number,
    manifest: SegmentStreamManifest,
  ): number | null {
    for (
      let index = Math.max(0, startIndex);
      index < manifest.segments.length;
      index += 1
    ) {
      if (!this.loaded.has(index)) return index
    }
    return null
  }

  private canAdmitForwardInterval(
    index: number,
    bufferedAheadUs: number,
    manifest: SegmentStreamManifest,
  ): boolean {
    const segment = manifest.segments[index]
    if (!segment) return false
    return bufferedAheadUs + segment.durationUs <= FORWARD_BUFFER_MAX_US
  }

  private async fetchTrackBytes(
    url: string,
    signal: AbortSignal,
    epoch: number,
    reason: FetchReason,
  ): Promise<Uint8Array<ArrayBuffer>> {
    this.activeTrackFetches += 1
    this.forwardBufferReceipt.trackFetchCount += 1
    this.forwardBufferReceipt.maxConcurrentTrackFetches = Math.max(
      this.forwardBufferReceipt.maxConcurrentTrackFetches,
      this.activeTrackFetches,
    )

    if (this.activeTrackFetches > MAX_TRACK_FETCH_CONCURRENCY) {
      this.activeTrackFetches -= 1
      this.forwardBufferReceipt.forwardBudgetPass = false
      throw publicError('E_PUBLIC_TRACK_FETCH_BUDGET')
    }

    try {
      return await this.fetchBytes(url, signal, epoch, reason)
    } finally {
      this.activeTrackFetches -= 1
    }
  }

  private async fetchBytes(
    url: string,
    signal: AbortSignal,
    epoch: number,
    reason: FetchReason,
  ): Promise<Uint8Array<ArrayBuffer>> {
    this.assertCurrent(epoch, signal)
    this.recordRequestStart(reason)

    let response: Response
    try {
      response = await fetch(url, {
        signal,
        credentials: 'omit',
        cache: 'default',
      })
    } catch (cause) {
      if (!this.isCurrent(epoch, signal) || isAbortLike(cause)) {
        throw new StalePlaybackOperation()
      }
      throw publicError('E_PUBLIC_SEGMENT_FETCH_NETWORK', cause)
    }

    this.assertCurrent(epoch, signal)

    if (!response.ok) {
      throw publicError(`E_PUBLIC_SEGMENT_FETCH_${response.status}`)
    }

    let bytes: ArrayBuffer
    try {
      bytes = await response.arrayBuffer()
    } catch (cause) {
      if (!this.isCurrent(epoch, signal) || isAbortLike(cause)) {
        throw new StalePlaybackOperation()
      }
      throw publicError('E_PUBLIC_SEGMENT_READ_FAILED', cause)
    }

    this.assertCurrent(epoch, signal)
    return new Uint8Array(bytes)
  }

  private async ensureManifest(
    signal: AbortSignal,
    epoch: number,
    reason: FetchReason,
  ): Promise<SegmentStreamManifest> {
    if (this.manifest) return this.manifest

    this.assertCurrent(epoch, signal)
    this.receipt.manifestRequestCount += 1
    this.recordRequestStart(reason)

    let response: Response
    try {
      response = await fetch(this.manifestUrl, {
        signal,
        credentials: 'omit',
        cache: 'default',
      })
    } catch (cause) {
      if (!this.isCurrent(epoch, signal) || isAbortLike(cause)) {
        throw new StalePlaybackOperation()
      }
      throw publicError('E_PUBLIC_SEGMENT_MANIFEST_NETWORK', cause)
    }

    this.assertCurrent(epoch, signal)

    if (!response.ok) {
      throw publicError(`E_PUBLIC_SEGMENT_MANIFEST_${response.status}`)
    }

    let text: string
    try {
      text = await response.text()
    } catch (cause) {
      if (!this.isCurrent(epoch, signal) || isAbortLike(cause)) {
        throw new StalePlaybackOperation()
      }
      throw publicError('E_PUBLIC_SEGMENT_MANIFEST_READ_FAILED', cause)
    }

    this.assertCurrent(epoch, signal)
    this.receipt.manifestBytes += new TextEncoder().encode(text).byteLength

    let manifest: SegmentStreamManifest
    try {
      manifest = assertManifest(JSON.parse(text))
    } catch (cause) {
      if (cause instanceof Error && cause.message.startsWith('E_PUBLIC_')) {
        throw cause
      }
      throw publicError('E_PUBLIC_SEGMENT_MANIFEST_INVALID', cause)
    }

    this.assertCurrent(epoch, signal)
    this.manifest = manifest
    return manifest
  }

  private attachMediaSource(epoch: number): MediaSourceHandle {
    if (this.destroyed) {
      throw new StalePlaybackOperation()
    }

    if (this.handle && !this.handle.detached) {
      this.handle.epoch = epoch
      return this.handle
    }

    if (typeof MediaSource === 'undefined') {
      throw publicError('E_PUBLIC_MEDIA_SOURCE_UNSUPPORTED')
    }

    const mediaSource = new MediaSource()
    const objectUrl = URL.createObjectURL(mediaSource)
    const handle: MediaSourceHandle = {
      epoch,
      mediaSource,
      objectUrl,
      videoBuffer: null,
      audioBuffer: null,
      initAppendIssued: false,
      detached: false,
    }

    this.handle = handle
    this.video.src = objectUrl
    this.lifecycleReceipt.mediaSourceAttachCount += 1
    return handle
  }

  private assertHandleCurrent(
    handle: MediaSourceHandle,
    epoch: number,
    signal?: AbortSignal | null,
  ) {
    this.assertCurrent(epoch, signal)

    if (
      this.handle !== handle ||
      handle.detached ||
      handle.epoch !== epoch
    ) {
      throw new StalePlaybackOperation()
    }
  }

  private waitForSourceOpen(
    handle: MediaSourceHandle,
    epoch: number,
    signal: AbortSignal,
  ): Promise<void> {
    this.assertHandleCurrent(handle, epoch, signal)

    if (handle.mediaSource.readyState === 'open') {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const mediaSource = handle.mediaSource

      const cleanup = () => {
        mediaSource.removeEventListener('sourceopen', onOpen)
        mediaSource.removeEventListener('sourceclose', onClose)
        mediaSource.removeEventListener('error', onError)
        signal.removeEventListener('abort', onAbort)
      }

      const finish = (fn: () => void) => {
        cleanup()
        fn()
      }

      const onOpen = () => finish(resolve)
      const onClose = () => finish(() => {
        if (!this.isCurrent(epoch, signal) || handle.detached) {
          reject(new StalePlaybackOperation())
          return
        }
        reject(publicError('E_PUBLIC_MEDIA_SOURCE_CLOSED'))
      })
      const onError = () => finish(() => {
        if (!this.isCurrent(epoch, signal) || handle.detached) {
          reject(new StalePlaybackOperation())
          return
        }
        reject(publicError('E_PUBLIC_MEDIA_SOURCE_OPEN'))
      })
      const onAbort = () => finish(() => reject(new StalePlaybackOperation()))

      mediaSource.addEventListener('sourceopen', onOpen, { once: true })
      mediaSource.addEventListener('sourceclose', onClose, { once: true })
      mediaSource.addEventListener('error', onError, { once: true })
      signal.addEventListener('abort', onAbort, { once: true })

      if (!this.isCurrent(epoch, signal) || handle.detached) {
        onAbort()
      } else if (mediaSource.readyState === 'open') {
        onOpen()
      }
    }).then(() => {
      this.assertHandleCurrent(handle, epoch, signal)
    })
  }

  private ensureSourceBuffers(
    handle: MediaSourceHandle,
    manifest: SegmentStreamManifest,
    epoch: number,
    signal: AbortSignal,
  ) {
    this.assertHandleCurrent(handle, epoch, signal)

    if (handle.mediaSource.readyState !== 'open') {
      throw publicError('E_PUBLIC_MEDIA_SOURCE_NOT_OPEN')
    }

    if (!handle.videoBuffer) {
      const type = `video/mp4; codecs="${manifest.video.codec}"`
      if (!MediaSource.isTypeSupported(type)) {
        throw publicError('E_PUBLIC_MEDIA_CODEC_UNSUPPORTED')
      }
      try {
        handle.videoBuffer = handle.mediaSource.addSourceBuffer(type)
      } catch (cause) {
        throw publicError('E_PUBLIC_MEDIA_VIDEO_SOURCEBUFFER_CREATE', cause)
      }
    }

    this.assertHandleCurrent(handle, epoch, signal)

    if (manifest.audio && !handle.audioBuffer) {
      const type = `audio/mp4; codecs="${manifest.audio.codec}"`
      if (!MediaSource.isTypeSupported(type)) {
        throw publicError('E_PUBLIC_MEDIA_CODEC_UNSUPPORTED')
      }
      try {
        handle.audioBuffer = handle.mediaSource.addSourceBuffer(type)
      } catch (cause) {
        throw publicError('E_PUBLIC_MEDIA_AUDIO_SOURCEBUFFER_CREATE', cause)
      }
    }
  }

  private waitForBufferIdle(
    handle: MediaSourceHandle,
    sourceBuffer: SourceBuffer,
    epoch: number,
    signal: AbortSignal,
  ): Promise<void> {
    this.assertAppendAuthority(handle, sourceBuffer, epoch, signal)

    if (!sourceBuffer.updating) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const mediaSource = handle.mediaSource

      const cleanup = () => {
        sourceBuffer.removeEventListener('updateend', onDone)
        sourceBuffer.removeEventListener('error', onError)
        mediaSource.removeEventListener('sourceclose', onClose)
        signal.removeEventListener('abort', onAbort)
      }

      const finish = (fn: () => void) => {
        cleanup()
        fn()
      }

      const onDone = () => finish(resolve)
      const onError = () => finish(() => {
        if (!this.isCurrent(epoch, signal) || handle.detached) {
          reject(new StalePlaybackOperation())
          return
        }
        reject(publicError('E_PUBLIC_SOURCEBUFFER_UPDATE'))
      })
      const onClose = () => finish(() => {
        if (!this.isCurrent(epoch, signal) || handle.detached) {
          reject(new StalePlaybackOperation())
          return
        }
        reject(publicError('E_PUBLIC_MEDIA_SOURCE_CLOSED'))
      })
      const onAbort = () => finish(() => reject(new StalePlaybackOperation()))

      sourceBuffer.addEventListener('updateend', onDone, { once: true })
      sourceBuffer.addEventListener('error', onError, { once: true })
      mediaSource.addEventListener('sourceclose', onClose, { once: true })
      signal.addEventListener('abort', onAbort, { once: true })

      if (!this.isCurrent(epoch, signal) || handle.detached) {
        onAbort()
      } else if (!sourceBuffer.updating) {
        onDone()
      }
    }).then(() => {
      this.assertAppendAuthority(handle, sourceBuffer, epoch, signal)
    })
  }

  private assertAppendAuthority(
    handle: MediaSourceHandle,
    sourceBuffer: SourceBuffer,
    epoch: number,
    signal: AbortSignal,
  ) {
    this.assertHandleCurrent(handle, epoch, signal)

    if (
      handle.mediaSource.readyState !== 'open' ||
      !sourceBufferBelongsTo(handle.mediaSource, sourceBuffer)
    ) {
      if (!this.isCurrent(epoch, signal) || handle.detached) {
        throw new StalePlaybackOperation()
      }
      throw publicError('E_PUBLIC_SOURCEBUFFER_DETACHED_CURRENT_EPOCH')
    }
  }

  private async appendOwnedPair(
    handle: MediaSourceHandle,
    epoch: number,
    signal: AbortSignal,
    videoBytes: Uint8Array<ArrayBuffer>,
    audioBytes: Uint8Array<ArrayBuffer> | null,
    onIssued: () => void,
  ) {
    const videoBuffer = handle.videoBuffer
    if (!videoBuffer) {
      throw publicError('E_PUBLIC_SEGMENT_VIDEO_BUFFER_MISSING')
    }

    const audioBuffer = audioBytes ? handle.audioBuffer : null
    if (audioBytes && !audioBuffer) {
      throw publicError('E_PUBLIC_SEGMENT_AUDIO_BUFFER_MISSING')
    }

    await this.waitForBufferIdle(handle, videoBuffer, epoch, signal)
    if (audioBuffer) {
      await this.waitForBufferIdle(handle, audioBuffer, epoch, signal)
    }

    this.assertAppendAuthority(handle, videoBuffer, epoch, signal)
    if (audioBuffer) {
      this.assertAppendAuthority(handle, audioBuffer, epoch, signal)
    }

    try {
      videoBuffer.appendBuffer(ownedArrayBuffer(videoBytes))
      this.lifecycleReceipt.sourceBufferAppendCount += 1

      if (audioBytes && audioBuffer) {
        audioBuffer.appendBuffer(ownedArrayBuffer(audioBytes))
        this.lifecycleReceipt.sourceBufferAppendCount += 1
      }
    } catch (cause) {
      if (
        !this.isCurrent(epoch, signal) ||
        this.handle !== handle ||
        handle.detached ||
        handle.mediaSource.readyState !== 'open'
      ) {
        this.lifecycleReceipt.appendAfterDetachAttemptCount += 1
        throw new StalePlaybackOperation()
      }

      this.lifecycleReceipt.currentEpochAppendFailureCount += 1
      throw publicError('E_PUBLIC_SOURCEBUFFER_APPEND_FAILED', cause)
    }

    onIssued()

    await this.waitForBufferIdle(handle, videoBuffer, epoch, signal)
    if (audioBuffer) {
      await this.waitForBufferIdle(handle, audioBuffer, epoch, signal)
    }
  }

  private async primeMediaSource(
    handle: MediaSourceHandle,
    manifest: SegmentStreamManifest,
    epoch: number,
    signal: AbortSignal,
    reason: FetchReason,
  ) {
    await this.waitForSourceOpen(handle, epoch, signal)
    this.assertHandleCurrent(handle, epoch, signal)
    this.ensureSourceBuffers(handle, manifest, epoch, signal)

    if (handle.initAppendIssued) return

    const videoInit = await this.fetchBytes(
      absolute(this.manifestUrl, manifest.video.init.path),
      signal,
      epoch,
      reason,
    )
    this.receipt.videoInitBytes += videoInit.byteLength

    let audioInit: Uint8Array<ArrayBuffer> | null = null
    if (manifest.audio) {
      audioInit = await this.fetchBytes(
        absolute(this.manifestUrl, manifest.audio.init.path),
        signal,
        epoch,
        reason,
      )
      this.receipt.audioInitBytes += audioInit.byteLength
    }

    this.assertHandleCurrent(handle, epoch, signal)

    await this.appendOwnedPair(
      handle,
      epoch,
      signal,
      videoInit,
      audioInit,
      () => {
        handle.initAppendIssued = true
      },
    )
  }

  private indexFor(time: number, manifest: SegmentStreamManifest) {
    const us = Math.max(0, time * 1e6)
    let index = 0

    for (let cursor = 0; cursor < manifest.segments.length; cursor += 1) {
      const segment = manifest.segments[cursor]
      if (us >= segment.startUs) index = cursor
      else break
    }

    return index
  }

  private async waitForPriorInterval(
    epoch: number,
    signal: AbortSignal,
  ) {
    const prior = this.intervalTask
    if (!prior) return

    try {
      await prior.promise
    } catch (cause) {
      if (prior.epoch !== epoch) {
        this.lifecycleReceipt.staleOperationSuppressedCount += 1
        return
      }
      throw cause
    }

    this.assertCurrent(epoch, signal)
  }

  private async appendIntervalPhysical(
    index: number,
    epoch: number,
    signal: AbortSignal,
    reason: FetchReason,
  ) {
    const manifest = this.manifest
    if (!manifest) {
      throw publicError('E_PUBLIC_SEGMENT_MANIFEST_NOT_READY')
    }

    if (
      index < 0 ||
      index >= manifest.segments.length ||
      this.loaded.has(index)
    ) {
      return
    }

    this.assertCurrent(epoch, signal)

    const handle = this.handle
    if (!handle) {
      throw publicError('E_PUBLIC_MEDIA_SOURCE_HANDLE_MISSING')
    }
    this.assertHandleCurrent(handle, epoch, signal)

    const segment = manifest.segments[index]
    this.receipt.segmentIntervalRequests += 1
    this.forwardBufferReceipt.intervalAdmissionCount += 1
    this.activeIntervalRequests += 1
    this.receipt.maxConcurrentIntervalRequests = Math.max(
      this.receipt.maxConcurrentIntervalRequests,
      this.activeIntervalRequests,
    )
    this.forwardBufferReceipt.maxConcurrentIntervals = Math.max(
      this.forwardBufferReceipt.maxConcurrentIntervals,
      this.activeIntervalRequests,
    )

    if (this.activeIntervalRequests > 1) {
      this.receipt.dataBudgetPass = false
      this.forwardBufferReceipt.forwardBudgetPass = false
      this.activeIntervalRequests -= 1
      throw publicError('E_PUBLIC_SEGMENT_INFLIGHT_BUDGET')
    }

    try {
      const pairAborter = new AbortController()
      const abortPair = () => pairAborter.abort()
      signal.addEventListener('abort', abortPair, { once: true })

      let videoBytes: Uint8Array<ArrayBuffer>
      let audioBytes: Uint8Array<ArrayBuffer> | null

      try {
        const videoPromise = this.fetchTrackBytes(
          absolute(this.manifestUrl, segment.video.path),
          pairAborter.signal,
          epoch,
          reason,
        )
        const audioPromise: Promise<Uint8Array<ArrayBuffer> | null> =
          segment.audio
            ? this.fetchTrackBytes(
                absolute(this.manifestUrl, segment.audio.path),
                pairAborter.signal,
                epoch,
                reason,
              )
            : Promise.resolve(null)

        ;[videoBytes, audioBytes] = await Promise.all([
          videoPromise,
          audioPromise,
        ])

        if (segment.audio) {
          this.forwardBufferReceipt.pairedTrackFetchCount += 1
        }
      } catch (cause) {
        pairAborter.abort()
        if (!this.isExpectedLifecycleFailure(cause) && segment.audio) {
          this.forwardBufferReceipt.pairFetchFailureCount += 1
        }
        throw cause
      } finally {
        signal.removeEventListener('abort', abortPair)
      }

      this.assertCurrent(epoch, signal)
      this.receipt.videoSegmentBytes += videoBytes.byteLength
      this.receipt.totalMediaBytesReceived += videoBytes.byteLength
      if (audioBytes) {
        this.receipt.audioSegmentBytes += audioBytes.byteLength
        this.receipt.totalMediaBytesReceived += audioBytes.byteLength
      }

      this.assertCurrent(epoch, signal)

      await this.appendOwnedPair(
        handle,
        epoch,
        signal,
        videoBytes,
        audioBytes,
        () => {
          this.loaded.add(index)
        },
      )
    } finally {
      this.activeIntervalRequests -= 1
    }
  }

  private async appendInterval(
    index: number,
    epoch: number,
    signal: AbortSignal,
    reason: FetchReason,
  ) {
    if (this.loaded.has(index)) return

    await this.waitForPriorInterval(epoch, signal)
    this.assertCurrent(epoch, signal)

    if (this.loaded.has(index)) return

    const task = this.appendIntervalPhysical(
      index,
      epoch,
      signal,
      reason,
    )
    const taskRecord: IntervalTask = {
      epoch,
      promise: task,
    }
    this.intervalTask = taskRecord

    try {
      await task
    } finally {
      if (this.intervalTask === taskRecord) {
        this.intervalTask = null
      }
    }
  }

  private capturePlayPromise(
    playPromise: Promise<void>,
    intentOrdinal: number,
    epoch: number,
  ): Promise<Error | null> {
    this.lifecycleReceipt.playPromiseCreatedCount += 1

    return playPromise.then(
      () => null,
      (cause) => {
        if (
          this.destroyed ||
          this.desiredPlayback !== 'playing' ||
          this.playIntentOrdinal !== intentOrdinal ||
          this.generation !== epoch
        ) {
          this.lifecycleReceipt.expectedPlayAbortSuppressedCount += 1
          return null
        }

        this.lifecycleReceipt.unexpectedPlayRejectCount += 1
        return publicError('E_PUBLIC_PLAYBACK_START_FAILED', cause)
      },
    )
  }

  async explicitPlay() {
    this.receipt.explicitPlayCount += 1
    this.lifecycleReceipt.playIntentCount += 1
    this.started = true
    this.destroyed = false
    this.desiredPlayback = 'playing'
    this.outsideViewport = false
    this.playIntentOrdinal += 1
    this.startupPriming = true

    const intentOrdinal = this.playIntentOrdinal
    const { epoch, signal } = this.advanceEpoch(true)

    try {
      const handle = this.attachMediaSource(epoch)

      let rawPlayPromise: Promise<void>
      try {
        rawPlayPromise = this.video.play()
      } catch (cause) {
        this.lifecycleReceipt.unexpectedPlayRejectCount += 1
        throw publicError('E_PUBLIC_PLAYBACK_START_FAILED', cause)
      }

      const playSettlement = this.capturePlayPromise(
        rawPlayPromise,
        intentOrdinal,
        epoch,
      )

      const manifest = await this.ensureManifest(signal, epoch, 'play')
      this.assertCurrent(epoch, signal)

      await this.primeMediaSource(
        handle,
        manifest,
        epoch,
        signal,
        'play',
      )
      this.assertCurrent(epoch, signal)

      const index = this.indexFor(this.video.currentTime, manifest)
      this.forwardBufferReceipt.startupPrimeCount += 1
      await this.appendInterval(index, epoch, signal, 'play')
      this.assertCurrent(epoch, signal)

      let bufferedAheadUs = this.samplePlayableBufferedAheadUs()
      const nextIndex = index + 1
      if (
        bufferedAheadUs < FORWARD_BUFFER_TARGET_US &&
        nextIndex < manifest.segments.length &&
        !this.loaded.has(nextIndex)
      ) {
        this.forwardBufferReceipt.forwardBufferDemandCount += 1
        if (
          this.canAdmitForwardInterval(
            nextIndex,
            bufferedAheadUs,
            manifest,
          )
        ) {
          await this.appendInterval(nextIndex, epoch, signal, 'play')
          this.assertCurrent(epoch, signal)
          bufferedAheadUs = this.samplePlayableBufferedAheadUs()
        } else {
          this.forwardBufferReceipt.hardMaxAdmissionBlockedCount += 1
        }
      }

      if (bufferedAheadUs >= FORWARD_BUFFER_TARGET_US) {
        this.forwardBufferReceipt.forwardBufferSatisfiedCount += 1
      }

      const playFailure = await playSettlement
      this.assertCurrent(epoch, signal)
      this.startupPriming = false
      if (playFailure) throw playFailure
    } catch (cause) {
      this.startupPriming = false
      if (this.suppressExpectedLifecycleFailure(cause)) return
      throw cause
    }
  }

  pause() {
    if (this.destroyed) return

    this.lifecycleReceipt.pauseIntentCount += 1
    this.receipt.pauseAbortCount += 1
    this.desiredPlayback = 'paused'
    this.outsideViewport = false
    this.playIntentOrdinal += 1
    this.advanceEpoch(false)
    this.startupPriming = false
    this.closeNetworkRebuffer(false)
    this.video.pause()
  }

  outOfView() {
    if (this.destroyed) return

    this.lifecycleReceipt.outOfViewIntentCount += 1
    this.receipt.outOfViewAbortCount += 1
    this.receipt.pauseAbortCount += 1
    this.desiredPlayback = 'paused'
    this.outsideViewport = true
    this.playIntentOrdinal += 1
    this.advanceEpoch(false)
    this.startupPriming = false
    this.closeNetworkRebuffer(false)
    this.video.pause()
  }

  async seek(time: number) {
    if (!Number.isFinite(time)) return

    this.video.currentTime = time

    if (!this.started || this.destroyed) return

    this.lifecycleReceipt.seekIntentCount += 1
    this.receipt.seekAbortCount += 1
    const reason: FetchReason = 'seek'
    const { epoch, signal } = this.advanceEpoch(true)

    try {
      const handle = this.handle
      if (!handle || handle.detached) {
        throw publicError('E_PUBLIC_MEDIA_SOURCE_HANDLE_MISSING')
      }
      handle.epoch = epoch

      const manifest = await this.ensureManifest(signal, epoch, reason)
      await this.primeMediaSource(
        handle,
        manifest,
        epoch,
        signal,
        reason,
      )

      this.assertCurrent(epoch, signal)
      const index = this.indexFor(time, manifest)
      await this.appendInterval(index, epoch, signal, reason)
      this.assertCurrent(epoch, signal)

      const bufferedAheadUs = this.samplePlayableBufferedAheadUs()
      const nextIndex = index + 1
      if (
        nextIndex < manifest.segments.length &&
        !this.loaded.has(nextIndex)
      ) {
        if (
          this.canAdmitForwardInterval(
            nextIndex,
            bufferedAheadUs,
            manifest,
          )
        ) {
          await this.appendInterval(nextIndex, epoch, signal, reason)
        } else {
          this.forwardBufferReceipt.hardMaxAdmissionBlockedCount += 1
        }
      }
    } catch (cause) {
      if (this.suppressExpectedLifecycleFailure(cause)) return
      throw cause
    }
  }

  async pump() {
    if (
      !this.started ||
      this.destroyed ||
      this.desiredPlayback !== 'playing' ||
      this.outsideViewport ||
      this.video.paused ||
      !this.manifest ||
      !this.aborter
    ) {
      return
    }

    this.forwardBufferReceipt.pumpInvocationCount += 1

    if (this.pumpTask) {
      this.forwardBufferReceipt.pumpCoalescedCount += 1
      try {
        await this.pumpTask
      } catch (cause) {
        if (this.suppressExpectedLifecycleFailure(cause)) return
        throw cause
      }
      return
    }

    const epoch = this.generation
    const signal = this.aborter.signal

    const task = (async () => {
      this.assertCurrent(epoch, signal)
      const manifest = this.manifest
      if (!manifest) return

      let admissions = 0

      while (admissions < MAX_PUMP_INTERVAL_ADMISSIONS) {
        this.assertCurrent(epoch, signal)
        const bufferedAheadUs = this.samplePlayableBufferedAheadUs()

        if (bufferedAheadUs >= FORWARD_BUFFER_TARGET_US) {
          this.forwardBufferReceipt.forwardBufferSatisfiedCount += 1
          return
        }

        this.forwardBufferReceipt.forwardBufferDemandCount += 1
        const currentIndex = this.indexFor(this.video.currentTime, manifest)
        const candidateIndex = this.nextMissingForwardIndex(
          currentIndex,
          manifest,
        )

        if (candidateIndex === null) return

        if (
          !this.canAdmitForwardInterval(
            candidateIndex,
            bufferedAheadUs,
            manifest,
          )
        ) {
          this.forwardBufferReceipt.hardMaxAdmissionBlockedCount += 1
          return
        }

        await this.appendInterval(
          candidateIndex,
          epoch,
          signal,
          'pump',
        )
        admissions += 1
        this.forwardBufferReceipt.pumpIntervalAdmissionCount += 1
        this.assertCurrent(epoch, signal)
      }

      const finalBufferedAheadUs = this.samplePlayableBufferedAheadUs()
      if (finalBufferedAheadUs >= FORWARD_BUFFER_TARGET_US) {
        this.forwardBufferReceipt.forwardBufferSatisfiedCount += 1
      }
    })()

    this.pumpTask = task

    try {
      await task
    } catch (cause) {
      if (this.suppressExpectedLifecycleFailure(cause)) return
      throw cause
    } finally {
      if (this.pumpTask === task) {
        this.pumpTask = null
      }
    }
  }

  destroy() {
    if (this.destroyed) return

    this.lifecycleReceipt.destroyCount += 1
    this.desiredPlayback = 'destroyed'
    this.outsideViewport = false
    this.playIntentOrdinal += 1
    this.destroyed = true

    this.generation += 1
    this.lifecycleReceipt.epochAdvanceCount += 1
    this.abortCurrentOperation()
    this.aborter = null

    const handle = this.handle
    if (handle && !handle.detached) {
      handle.epoch = this.generation
      handle.detached = true
      this.lifecycleReceipt.mediaSourceDetachCount += 1
    }

    this.handle = null
    this.started = false
    this.startupPriming = false
    this.closeNetworkRebuffer(false)
    this.video.removeEventListener('waiting', this.handleWaitingEvent)
    this.video.removeEventListener('stalled', this.handleStalledEvent)
    this.video.removeEventListener('playing', this.handlePlayingEvent)
    this.video.pause()
    this.video.removeAttribute('src')
    this.video.load()

    if (handle?.objectUrl) {
      URL.revokeObjectURL(handle.objectUrl)
    }

    this.loaded.clear()
    this.manifest = null
  }
}
