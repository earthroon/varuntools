#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import {
  loadVacmsProjectionSidecars,
  stableJson,
} from './lib/cms207m-public-projection.mjs'
import {
  VARUNTOOLS_PUBLIC_R2B_RUNTIME_MANIFEST_SCHEMA,
  VARUNTOOLS_PUBLIC_R2B_RUNTIME_REVISION,
  projectPublicRuntimeAsset,
} from './lib/varuntools-public-r2b-runtime-manifest.mjs'

const ROOT = process.cwd()
const SIDECAR_ROOT = path.join(ROOT, 'src', 'content', 'generated', 'vacms-pages')
const OUT_FILE = path.join(ROOT, 'src', 'content', 'generated', 'publicAssetManifest.generated.json')
const CHECK = process.argv.includes('--check')
const FORBIDDEN_PUBLIC_KEYS = new Set([
  'r2Key',
  'r2_key',
  'r2Version',
  'r2_version',
  'etag',
  'bucketName',
  'bucket_name',
  'uploadId',
  'upload_id',
  'wasmSha256',
  'wasm_sha256',
  'sourceR2Key',
  'source_r2_key',
  'sourceObjectKey',
  'source_object_key',
  'originalR2Key',
  'original_r2_key',
  'originalObjectKey',
  'original_object_key',
])

function assertNoForbiddenKeys(value, trail = 'asset') {
  if (Array.isArray(value)) {
    value.forEach((child, index) => assertNoForbiddenKeys(child, `${trail}[${index}]`))
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_PUBLIC_KEYS.has(key)) throw new Error(`E_CMS207M_PUBLIC_ASSET_FORBIDDEN_KEY:${trail}.${key}`)
    assertNoForbiddenKeys(child, `${trail}.${key}`)
  }
}

const sidecars = loadVacmsProjectionSidecars(SIDECAR_ROOT)
const sourceAssets = new Map()
for (const { payload } of sidecars.values()) {
  for (const asset of Array.isArray(payload.assets) ? payload.assets : []) {
    const assetId = String(asset?.assetId || '').trim()
    if (!assetId) throw new Error('E_CMS207M_PUBLIC_ASSET_ID_MISSING')
    assertNoForbiddenKeys(asset, `assets.${assetId}`)
    const existing = sourceAssets.get(assetId)
    if (existing && stableJson(existing) !== stableJson(asset)) {
      throw new Error(`E_CMS207M_PUBLIC_ASSET_CONFLICT:${assetId}`)
    }
    sourceAssets.set(assetId, asset)
  }
}

const runtimeAssets = new Map()
for (const [assetId, sourceAsset] of sourceAssets.entries()) {
  const runtimeAsset = projectPublicRuntimeAsset(sourceAsset)
  assertNoForbiddenKeys(runtimeAsset, `runtimeAssets.${assetId}`)
  runtimeAssets.set(assetId, runtimeAsset)
}

const sortedAssets = Object.fromEntries([...runtimeAssets.entries()].sort(([a], [b]) => a.localeCompare(b)))
const payload = {
  schemaVersion: VARUNTOOLS_PUBLIC_R2B_RUNTIME_MANIFEST_SCHEMA,
  projectionRevision: 'CMS-207M-R1',
  runtimeRevision: VARUNTOOLS_PUBLIC_R2B_RUNTIME_REVISION,
  assets: sortedAssets,
}
const next = stableJson(payload)

if (CHECK) {
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : ''
  if (current !== next) {
    console.error('E_VARUNTOOLS_R2B_PUBLIC_ASSET_MANIFEST_STALE')
    process.exit(1)
  }
  console.log('PASS_VARUNTOOLS_PUBLIC_R2B_ASSET_MANIFEST_CHECK')
} else {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, next, 'utf8')
  const videoAssets = [...runtimeAssets.values()].filter((asset) => asset.delivery.class === 'playback_rendition' || asset.delivery.producerPlaybackState !== 'unsupported')
  const playbackReady = videoAssets.filter((asset) => asset.delivery.class === 'playback_rendition' && asset.delivery.state === 'ready')
  console.log('PASS_VARUNTOOLS_PUBLIC_R2B_ASSET_MANIFEST_BUILD')
  console.log(`assetCount=${runtimeAssets.size}`)
  console.log(`projectedVideoCount=${videoAssets.length}`)
  console.log(`playbackReadyCount=${playbackReady.length}`)
  console.log(`playbackUnavailableCount=${videoAssets.length - playbackReady.length}`)
}
