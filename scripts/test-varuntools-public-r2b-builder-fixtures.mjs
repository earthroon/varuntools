#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const builder = path.join(here, 'build-public-asset-manifest.mjs')
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'varuntools-r2b-builder-'))

function writeSidecar(videoPlayback) {
  const sidecar = {
    schemaVersion: 'vacms-public-projection@1',
    projectionRevision: 'CMS-207M-R1',
    page: { pageId: 'page_fixture' },
    assets: [
      {
        schemaVersion: 'vacms-public-asset@1', assetId: 'asset_image', pageId: 'page_fixture', role: 'cover',
        filename: 'cover.webp', mime: 'image/webp', publicPath: '/assets/content/page_fixture/asset_image/cover.webp',
        sizeBytes: 1000, hash: 'image-hash', presentation: { posterAssetId: null, posterPublicPath: null },
        media: { state: 'unobserved', mediaKind: 'image', width: 1600, height: 900 }, authority: { class: 'materialized_hint' },
      },
      {
        schemaVersion: 'vacms-public-asset@1', assetId: 'asset_video', pageId: 'page_fixture', role: 'video',
        filename: 'original.mp4', mime: 'video/mp4', publicPath: '/assets/content/page_fixture/asset_video/original.mp4',
        sizeBytes: 132710145, hash: null, presentation: { posterAssetId: null, posterPublicPath: null },
        playback: videoPlayback,
        media: { state: 'legacy_ready', mediaKind: 'video', width: 1080, height: 1920, durationMs: '56123' }, authority: { class: 'legacy_video' },
      },
    ],
  }
  const file = path.join(root, 'src/content/generated/vacms-pages/page_fixture.projection.json')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(sidecar, null, 2) + '\n')
}

function runBuilder() {
  return spawnSync(process.execPath, [builder], { cwd: root, encoding: 'utf8', shell: false })
}

try {
  writeSidecar({
    state: 'ready', variantId: 'variant_fixture', publicPath: '/assets/content/page_fixture/variant_fixture/playback.mp4',
    sourceIdentityDigest: 'source-id', sourceHash: 'source-hash', playbackHash: 'playback-hash',
    container: 'mp4', videoCodec: 'avc1.640028', audioCodec: 'mp4a.40.2', width: 1080, height: 1920,
    durationMs: '56123', sizeBytes: 30000000, policyRevision: 'BMR-02B',
  })
  const ready = runBuilder()
  if (ready.status !== 0) throw new Error(`${ready.stdout}\n${ready.stderr}`)
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/content/generated/publicAssetManifest.generated.json'), 'utf8'))
  assert.equal(manifest.schemaVersion, 'cms-207m-public-asset-manifest@2')
  assert.equal(manifest.assets.asset_image.delivery.class, 'direct_asset')
  assert.equal(manifest.assets.asset_video.delivery.class, 'playback_rendition')
  assert.equal(manifest.assets.asset_video.delivery.publicPath, '/assets/content/page_fixture/variant_fixture/playback.mp4')
  assert.equal(Object.prototype.hasOwnProperty.call(manifest.assets.asset_video, 'publicPath'), false)

  writeSidecar({
    state: 'ready', variantId: 'variant_fixture', publicPath: '/assets/content/page_fixture/asset_video/original.mp4',
    sourceIdentityDigest: 'source-id', sourceHash: 'source-hash', playbackHash: 'playback-hash',
    container: 'mp4', videoCodec: 'avc1.640028', audioCodec: null, width: 1080, height: 1920,
    durationMs: '56123', sizeBytes: 132710145, policyRevision: 'BMR-02B',
  })
  const rejected = runBuilder()
  assert.notEqual(rejected.status, 0)
  assert.match(`${rejected.stdout}\n${rejected.stderr}`, /E_VARUNTOOLS_R2B_PLAYBACK_EQUALS_SOURCE/)

  console.log('PASS_VARUNTOOLS_PUBLIC_R2B_BUILDER_FIXTURES')
} finally {
  fs.rmSync(root, { recursive: true, force: true })
}
