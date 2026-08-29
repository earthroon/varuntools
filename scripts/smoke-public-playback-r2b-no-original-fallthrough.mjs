#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const manifestPath = path.join(root, 'src/content/generated/publicAssetManifest.generated.json')
const sidecarRoot = path.join(root, 'src/content/generated/vacms-pages')
const resolverPath = path.join(root, 'src/content/usePublicAssetProjection.ts')
const mountPath = path.join(root, 'src/markdown/mountMarkdownComponents.ts')

function fail(code, detail = '') {
  throw new Error(`${code}${detail ? `:${detail}` : ''}`)
}

if (!fs.existsSync(manifestPath)) fail('E_VARUNTOOLS_R2B_MANIFEST_MISSING')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
if (manifest.schemaVersion !== 'cms-207m-public-asset-manifest@2') fail('E_VARUNTOOLS_R2B_RUNTIME_MANIFEST_SCHEMA_INVALID')
if (manifest.runtimeRevision !== 'VARUNTOOLS-PUBLIC-R2B') fail('E_VARUNTOOLS_R2B_RUNTIME_REVISION_INVALID')

const sources = new Map()
for (const name of fs.readdirSync(sidecarRoot).filter((name) => name.endsWith('.projection.json')).sort()) {
  const payload = JSON.parse(fs.readFileSync(path.join(sidecarRoot, name), 'utf8'))
  for (const asset of Array.isArray(payload.assets) ? payload.assets : []) sources.set(String(asset.assetId), asset)
}

let projectedVideoAssets = 0
let playbackReadyAssets = 0
let playbackUnavailableAssets = 0
let originalVideoPathRuntimeAdmissions = 0
let directR2PlaybackAdmissions = 0
let sourceIdentityCollisions = 0

for (const [assetId, runtime] of Object.entries(manifest.assets || {})) {
  const source = sources.get(assetId)
  if (!source) fail('E_VARUNTOOLS_R2B_SOURCE_ASSET_MISSING', assetId)
  const isVideo = String(source.mime || '').toLowerCase().startsWith('video/') || String(source.role || '').toLowerCase() === 'video'
  if (!isVideo) continue
  projectedVideoAssets += 1

  if (Object.prototype.hasOwnProperty.call(runtime, 'publicPath')) {
    fail('E_VARUNTOOLS_R2B_SOURCE_PROJECTION_PROMOTED_DIRECTLY', assetId)
  }
  if (runtime.delivery?.class === 'direct_asset') fail('E_VARUNTOOLS_R2B_ORIGINAL_VIDEO_PATH_ADMITTED', assetId)

  if (runtime.delivery?.class === 'playback_rendition') {
    playbackReadyAssets += 1
    if (runtime.delivery?.state !== 'ready') fail('E_VARUNTOOLS_R2B_PLAYBACK_NOT_READY', assetId)
    if (!runtime.delivery?.publicPath) fail('E_VARUNTOOLS_R2B_PLAYBACK_PATH_INVALID', assetId)
    if (String(runtime.delivery.publicPath) === String(source.publicPath || '')) {
      originalVideoPathRuntimeAdmissions += 1
      fail('E_VARUNTOOLS_R2B_PLAYBACK_EQUALS_SOURCE', assetId)
    }
    if (/\.r2\.dev|\.r2\.cloudflarestorage\.com/i.test(String(runtime.delivery.publicPath))) {
      directR2PlaybackAdmissions += 1
      fail('E_VARUNTOOLS_R2B_PLAYBACK_DIRECT_R2_FORBIDDEN', assetId)
    }
    if (String(runtime.delivery.renditionId || '') === assetId) {
      sourceIdentityCollisions += 1
      fail('E_VARUNTOOLS_R2B_PLAYBACK_SOURCE_IDENTITY_COLLISION', assetId)
    }
  } else {
    playbackUnavailableAssets += 1
    if (runtime.delivery?.publicPath != null) fail('E_VARUNTOOLS_R2B_ORIGINAL_VIDEO_FALLBACK', assetId)
  }
}

const resolver = fs.readFileSync(resolverPath, 'utf8')
if (resolver.includes('asset.publicPath')) fail('E_VARUNTOOLS_R2B_ORIGINAL_VIDEO_FALLBACK', 'resolver-token')
if (!resolver.includes('delivery.publicPath')) fail('E_VARUNTOOLS_R2B_PLAYBACK_DELIVERY_AUTHORITY_MISSING')
if (!resolver.includes("sourceAuthority: 'playback_rendition'")) fail('E_VARUNTOOLS_R2B_PLAYBACK_WITNESS_MISSING')

const mount = fs.readFileSync(mountPath, 'utf8')
if (!mount.includes('projectionRequired') || !mount.includes('? projectedVideo.src')) {
  fail('E_VARUNTOOLS_R2B_RAW_MARKDOWN_PROJECTED_FALLBACK', 'mount-contract')
}
if (mount.includes('asset.publicPath')) fail('E_VARUNTOOLS_R2B_MOUNT_PROJECTION_BYPASS')

const fixture = manifest.assets?.asset_c8f6a4897fb1cece8944d2ef
if (fixture) {
  if (fixture.delivery?.class !== 'none' || fixture.delivery?.publicPath != null) {
    fail('E_VARUNTOOLS_R2B_LARGE_ORIGINAL_FIXTURE_ADMITTED')
  }
}

console.log(JSON.stringify({
  revision: 'VARUNTOOLS-PUBLIC-PLAYBACK-RENDITION-ADMISSION-AND-NO-ORIGINAL-FALLTHROUGH-CLOSURE-R2B',
  status: 'PASS_VARUNTOOLS_PUBLIC_R2B_NO_ORIGINAL_FALLTHROUGH',
  projectedVideoAssets,
  playbackReadyAssets,
  playbackUnavailableAssets,
  originalVideoPathRuntimeAdmissions,
  directR2PlaybackAdmissions,
  sourceIdentityCollisions,
}, null, 2))
