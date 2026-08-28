#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const target = path.join(root, 'src', 'content', 'usePublicAssetProjection.ts')
const registryPath = path.join(root, 'src', 'content', 'assetRegistry.ts')
const pass = 'PASS_PUBLIC_ASSET_SSOT_04_PROJECTED_RUNTIME_PROXY_RESOLUTION'

function fail(code, message) {
  console.error(`FAIL_PUBLIC_ASSET_SSOT_04_PROJECTED_RUNTIME_PROXY_RESOLUTION: ${code}`)
  console.error(message)
  process.exit(1)
}

for (const file of [target, registryPath]) {
  if (!fs.existsSync(file)) fail('E_PUBLIC_ASSET_SSOT_04_REQUIRED_FILE_MISSING', path.relative(root, file))
}

const source = fs.readFileSync(target, 'utf8')
const registry = fs.readFileSync(registryPath, 'utf8')

const required = [
  "import { resolveContentAsset } from '@/content/assetRegistry'",
  'function resolveProjectedRuntimeAssetPath',
  'const resolved = resolveContentAsset({ source: semanticPath })',
  "resolved.kind !== 'content_asset'",
  "resolved.reason !== 'content_asset_proxy'",
  'asset.publicPath',
  'asset.presentation?.posterPublicPath',
  'src: srcResolution.url',
  "reason: 'asset_projection_public_path_invalid'",
  "reason: 'asset_projection_proxy_resolution_failed'",
  "reason: 'asset_projection_same_origin_static_fallthrough'",
  "reason: 'asset_projection_direct_r2_url_forbidden'",
]
for (const token of required) {
  if (!source.includes(token)) fail('E_PUBLIC_ASSET_SSOT_04_PROJECTED_RESOLVER_MARKER_MISSING', token)
}

const forbiddenInProjectionConsumer = [
  "'https://varuntools-admin-api.ragoon703.workers.dev'",
  'r2.dev/assets/content',
  'r2.cloudflarestorage.com/assets/content',
]
for (const token of forbiddenInProjectionConsumer) {
  if (source.includes(token)) fail('E_PUBLIC_ASSET_SSOT_04_DUPLICATE_DELIVERY_ORIGIN_AUTHORITY', token)
}

for (const token of [
  "'https://varuntools-admin-api.ragoon703.workers.dev'",
  "kind: 'content_asset'",
  "reason: 'content_asset_proxy'",
  'url: resolveRuntimeContentAssetUrl(source)',
]) {
  if (!registry.includes(token)) fail('E_PUBLIC_ASSET_SSOT_04_CANONICAL_REGISTRY_AUTHORITY_MISSING', token)
}

console.log(pass)
