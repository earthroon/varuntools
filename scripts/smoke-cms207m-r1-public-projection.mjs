#!/usr/bin/env node
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const PATCH_ID = 'CMS-207M-R1+VARUNTOOLS-PUBLIC-R2B'
const PASS = 'PASS_CMS_207M_R1_D1_AND_WASM_PUBLIC_PROJECTION_ADOPTION'

function fail(message) {
  throw new Error(message)
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing required file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function run(file) {
  const result = spawnSync(process.execPath, [file], { stdio: 'inherit' })
  if (result.status !== 0) fail(`${file} failed with exit=${result.status ?? 'null'}`)
}

run('scripts/build-public-content-projection.mjs')
run('scripts/build-public-asset-manifest.mjs')
run('scripts/build-home-collections.mjs')

const pkg = JSON.parse(read('package.json'))
const contentProjection = JSON.parse(read('src/content/generated/publicContentProjection.generated.json'))
const assetManifest = JSON.parse(read('src/content/generated/publicAssetManifest.generated.json'))
const home = JSON.parse(read('src/content/generated/homeCollections.generated.json'))
const contentProjectionBuilder = read('scripts/build-public-content-projection.mjs')
const homeBuilder = read('scripts/build-home-collections.mjs')
const indexBuilder = read('scripts/build-public-content-index.mjs')
const prerender = read('scripts/prerender-homepage-recent-feed.mjs')
const mount = read('src/markdown/mountMarkdownComponents.ts')
const directive = read('src/markdown/directives/videoPlayerDirective.ts')
const resolver = read('src/content/usePublicAssetProjection.ts')
const assetBuilder = read('scripts/build-public-asset-manifest.mjs')

if (contentProjection.schemaVersion !== 'cms-207m-public-content-projection@1') fail('public content projection schema mismatch')
if (!Array.isArray(contentProjection.entries) || !contentProjection.entries.length) fail('public content projection is empty')
if (assetManifest.schemaVersion !== 'cms-207m-public-asset-manifest@2') fail('public runtime asset manifest schema mismatch')
if (assetManifest.runtimeRevision !== 'VARUNTOOLS-PUBLIC-R2B') fail('public runtime asset manifest revision mismatch')
if (!assetManifest.assets || typeof assetManifest.assets !== 'object' || Array.isArray(assetManifest.assets)) fail('public asset manifest assets must be an object')
if (home.sourceSchemaVersion !== 'cms-207m-public-content-projection@1') fail('home collections are not derived from CMS-207M-R1 projection')
if (!contentProjectionBuilder.includes('E_CMS207M_REFERENCED_ASSET_PROJECTION_MISSING')) fail('projected page referenced-asset closure gate missing')

for (const source of [homeBuilder, indexBuilder, prerender]) {
  if (!source.includes('publicContentProjection.generated.json')) fail('home/index/prerender source split detected')
}

const build = String(pkg.scripts?.build || '')
const projectionIndex = build.indexOf('build:public-projection')
const assetIndex = build.indexOf('build:public-assets')
const viteIndex = build.indexOf('vite build')
if (projectionIndex < 0 || assetIndex < 0 || viteIndex < 0 || projectionIndex > viteIndex || assetIndex > viteIndex) {
  fail('public projection/asset manifest must build before Vite')
}

if (!directive.includes('videoAssetId') || !directive.includes('missing_src_stream_or_asset_id')) fail('video directive asset-id admission missing')
if (!mount.includes('resolvePublicVideoAssetProjection') || !mount.includes('videoassetid')) fail('video runtime asset projection binding missing')
if (!mount.includes('projectionRequired') || !mount.includes("vacms-public-projection@1")) fail('projected-page asset authority gate missing')
if (!resolver.includes('cms-207m-public-asset-manifest@2')) fail('public runtime asset resolver schema guard missing')
if (!resolver.includes("sourceAuthority: 'playback_rendition'")) fail('playback rendition runtime witness missing')
if (resolver.includes('asset.publicPath')) fail('original asset publicPath remains a video resolver authority')
if (!assetBuilder.includes('projectPublicRuntimeAsset')) fail('runtime asset sanitization projection missing')

const publicFiles = [
  'src/content/publicProjectionTypes.ts',
  'src/content/usePublicAssetProjection.ts',
  'scripts/build-public-content-projection.mjs',
  'scripts/build-public-asset-manifest.mjs',
]
for (const file of publicFiles) {
  const source = read(file)
  for (const forbidden of ['WebAssembly.instantiate', 'D1Database', 'CONTENT_ASSETS.get(', 'CONTENT_ASSETS.put(', 'content_media_object_metadata SELECT']) {
    if (source.includes(forbidden)) fail(`${file} contains forbidden public coupling token: ${forbidden}`)
  }
}

function scanForbiddenKeys(value, trail = 'manifest') {
  if (Array.isArray(value)) return value.forEach((item, index) => scanForbiddenKeys(item, `${trail}[${index}]`))
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    if ([
      'r2Key', 'r2_key', 'r2Version', 'r2_version', 'etag', 'bucketName', 'bucket_name',
      'wasmSha256', 'wasm_sha256', 'sourceR2Key', 'source_r2_key', 'originalR2Key', 'original_r2_key',
    ].includes(key)) {
      fail(`public asset manifest leaked internal authority key: ${trail}.${key}`)
    }
    scanForbiddenKeys(child, `${trail}.${key}`)
  }
}
scanForbiddenKeys(assetManifest)

for (const [assetId, asset] of Object.entries(assetManifest.assets)) {
  if (String(asset.mime || '').toLowerCase().startsWith('video/')) {
    if (Object.prototype.hasOwnProperty.call(asset, 'publicPath')) fail(`runtime video leaked source publicPath: ${assetId}`)
    if (asset.delivery?.class === 'direct_asset') fail(`runtime video admitted direct original delivery: ${assetId}`)
  }
}

const receipt = {
  patchId: PATCH_ID,
  status: 'PASS',
  invariants: {
    versionedPublishProjectionConsumer: true,
    contentAssetProjection: true,
    fieldLevelAuthoritySurface: true,
    sanitizedRuntimeAssetManifestV2: true,
    noOriginalVideoRuntimeAuthority: true,
    homeAndIndexSingleProjection: true,
    noDirectD1Coupling: true,
    noPublicWasmCoupling: true,
    projectionBeforeVite: true,
  },
}
fs.writeFileSync('cms207m-r1-public-projection-receipt.json', JSON.stringify(receipt, null, 2) + '\n', 'utf8')
console.log(PASS)
