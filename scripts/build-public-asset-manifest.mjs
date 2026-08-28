#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import {
  CMS207M_R1_ASSET_MANIFEST_SCHEMA,
  loadVacmsProjectionSidecars,
  stableJson,
} from './lib/cms207m-public-projection.mjs'

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
const assets = new Map()
for (const { payload } of sidecars.values()) {
  for (const asset of Array.isArray(payload.assets) ? payload.assets : []) {
    const assetId = String(asset?.assetId || '').trim()
    if (!assetId) throw new Error('E_CMS207M_PUBLIC_ASSET_ID_MISSING')
    assertNoForbiddenKeys(asset, `assets.${assetId}`)
    const existing = assets.get(assetId)
    if (existing && stableJson(existing) !== stableJson(asset)) {
      throw new Error(`E_CMS207M_PUBLIC_ASSET_CONFLICT:${assetId}`)
    }
    assets.set(assetId, asset)
  }
}

const sortedAssets = Object.fromEntries([...assets.entries()].sort(([a], [b]) => a.localeCompare(b)))
const payload = {
  schemaVersion: CMS207M_R1_ASSET_MANIFEST_SCHEMA,
  projectionRevision: 'CMS-207M-R1',
  assets: sortedAssets,
}
const next = stableJson(payload)

if (CHECK) {
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : ''
  if (current !== next) {
    console.error('E_CMS207M_PUBLIC_ASSET_MANIFEST_STALE')
    process.exit(1)
  }
  console.log('PASS_CMS_207M_R1_PUBLIC_ASSET_MANIFEST_CHECK')
} else {
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, next, 'utf8')
  console.log('PASS_CMS_207M_R1_PUBLIC_ASSET_MANIFEST_BUILD')
  console.log(`assetCount=${assets.size}`)
}
