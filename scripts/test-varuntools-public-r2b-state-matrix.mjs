#!/usr/bin/env node
import assert from 'node:assert/strict'
import { projectPublicRuntimeAsset } from './lib/varuntools-public-r2b-runtime-manifest.mjs'

function baseAsset(overrides = {}) {
  return {
    schemaVersion: 'vacms-public-asset@1',
    assetId: 'asset_video',
    pageId: 'page_a',
    role: 'video',
    filename: 'original.mp4',
    mime: 'video/mp4',
    publicPath: '/assets/content/page_a/asset_video/original.mp4',
    sizeBytes: 132710145,
    hash: null,
    presentation: { posterAssetId: null, posterPublicPath: null },
    media: { mediaKind: 'video', width: 1080, height: 1920, durationMs: '56123' },
    authority: { class: 'legacy_video', sourceCurrent: true, fieldSources: {} },
    ...overrides,
  }
}

function playback(overrides = {}) {
  return {
    state: 'ready',
    variantId: 'variant_playback',
    publicPath: '/assets/content/page_a/variant_playback/playback.mp4',
    sourceIdentityDigest: 'source-digest',
    sourceHash: 'source-hash',
    playbackHash: 'playback-hash',
    container: 'mp4',
    videoCodec: 'avc1.640028',
    audioCodec: 'mp4a.40.2',
    width: 1080,
    height: 1920,
    durationMs: '56123',
    sizeBytes: 32000000,
    policyRevision: 'BMR-02B',
    ...overrides,
  }
}

function expectError(code, fn) {
  assert.throws(fn, (error) => String(error?.message || '').includes(code))
}

const image = projectPublicRuntimeAsset(baseAsset({
  assetId: 'asset_image',
  role: 'cover',
  filename: 'cover.webp',
  mime: 'image/webp',
  publicPath: '/assets/content/page_a/asset_image/cover.webp',
  sizeBytes: 1024,
  media: { mediaKind: 'image', width: 1600, height: 900, durationMs: null },
}))
assert.equal(image.delivery.class, 'direct_asset')
assert.equal(image.delivery.state, 'ready')

const missing = projectPublicRuntimeAsset(baseAsset())
assert.equal(missing.delivery.class, 'none')
assert.equal(missing.delivery.state, 'unavailable')
assert.equal(missing.delivery.publicPath, null)
assert.equal(missing.delivery.reason, 'playback_rendition_missing')

const stale = projectPublicRuntimeAsset(baseAsset({ playback: playback({ state: 'stale', publicPath: null }) }))
assert.equal(stale.delivery.class, 'none')
assert.equal(stale.delivery.reason, 'playback_rendition_stale')

const unsupported = projectPublicRuntimeAsset(baseAsset({ playback: playback({ state: 'unsupported', publicPath: null }) }))
assert.equal(unsupported.delivery.class, 'none')
assert.equal(unsupported.delivery.reason, 'playback_rendition_unsupported')

const ready = projectPublicRuntimeAsset(baseAsset({ playback: playback() }))
assert.equal(ready.delivery.class, 'playback_rendition')
assert.equal(ready.delivery.state, 'ready')
assert.equal(ready.delivery.publicPath, '/assets/content/page_a/variant_playback/playback.mp4')
assert.notEqual(ready.delivery.publicPath, '/assets/content/page_a/asset_video/original.mp4')

expectError('E_VARUNTOOLS_R2B_PLAYBACK_EQUALS_SOURCE', () => projectPublicRuntimeAsset(baseAsset({
  playback: playback({ publicPath: '/assets/content/page_a/asset_video/original.mp4' }),
})))
expectError('E_VARUNTOOLS_R2B_PLAYBACK_DIRECT_R2_FORBIDDEN', () => projectPublicRuntimeAsset(baseAsset({
  playback: playback({ publicPath: 'https://bucket.r2.dev/playback.mp4' }),
})))
expectError('E_VARUNTOOLS_R2B_SAME_ORIGIN_STATIC_FALLTHROUGH', () => projectPublicRuntimeAsset(baseAsset({
  playback: playback({ publicPath: 'https://varun.tools/assets/content/page_a/variant_playback/playback.mp4' }),
})))
expectError('E_VARUNTOOLS_R2B_PLAYBACK_SOURCE_IDENTITY_COLLISION', () => projectPublicRuntimeAsset(baseAsset({
  playback: playback({ variantId: 'asset_video' }),
})))
expectError('E_VARUNTOOLS_R2B_PLAYBACK_SIZE_INVALID', () => projectPublicRuntimeAsset(baseAsset({
  playback: playback({ sizeBytes: 0 }),
})))

const largeOriginal = projectPublicRuntimeAsset(baseAsset({
  assetId: 'asset_c8f6a4897fb1cece8944d2ef',
  publicPath: '/assets/content/page_6b7a2b2b721c5e6f37fa59b5/asset_c8f6a4897fb1cece8944d2ef/mp4',
  sizeBytes: 132710145,
}))
assert.equal(largeOriginal.delivery.class, 'none')
assert.equal(largeOriginal.delivery.publicPath, null)

console.log(JSON.stringify({
  revision: 'VARUNTOOLS-PUBLIC-PLAYBACK-RENDITION-ADMISSION-AND-NO-ORIGINAL-FALLTHROUGH-CLOSURE-R2B',
  status: 'PASS_VARUNTOOLS_PUBLIC_R2B_STATE_MATRIX',
  fixtureCount: 11,
  originalVideoFallback: false,
}, null, 2))
