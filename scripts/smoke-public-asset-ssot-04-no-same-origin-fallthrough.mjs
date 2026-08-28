#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const projectionPath = path.join(root, 'src', 'content', 'usePublicAssetProjection.ts')
const mountPath = path.join(root, 'src', 'markdown', 'mountMarkdownComponents.ts')
const pass = 'PASS_PUBLIC_ASSET_SSOT_04_NO_SAME_ORIGIN_STATIC_FALLTHROUGH'

function fail(code, message) {
  console.error(`FAIL_PUBLIC_ASSET_SSOT_04_NO_SAME_ORIGIN_STATIC_FALLTHROUGH: ${code}`)
  console.error(message)
  process.exit(1)
}

for (const file of [projectionPath, mountPath]) {
  if (!fs.existsSync(file)) fail('E_PUBLIC_ASSET_SSOT_04_REQUIRED_FILE_MISSING', path.relative(root, file))
}

const projection = fs.readFileSync(projectionPath, 'utf8')
const mount = fs.readFileSync(mountPath, 'utf8')

if (/const\s+src\s*=\s*String\(asset\.publicPath/.test(projection)) {
  fail('E_PUBLIC_ASSET_SSOT_04_RAW_PROJECTED_PATH_RETURN', 'Raw asset.publicPath is still promoted directly to runtime src.')
}
if (/src:\s*src\s*,/.test(projection)) {
  fail('E_PUBLIC_ASSET_SSOT_04_RAW_PROJECTED_SRC_RETURN', 'Projection consumer still returns a raw src variable.')
}
if (!projection.includes('src: srcResolution.url')) {
  fail('E_PUBLIC_ASSET_SSOT_04_PROXY_RUNTIME_SRC_MISSING', 'Runtime src must come from canonical proxy resolution.')
}
if (!projection.includes('VARUNTOOLS_STATIC_CONTENT_URL')) {
  fail('E_PUBLIC_ASSET_SSOT_04_SAME_ORIGIN_GUARD_MISSING', 'Same-origin /assets/content fallthrough guard is missing.')
}
if (!projection.includes('DIRECT_R2_URL')) {
  fail('E_PUBLIC_ASSET_SSOT_04_DIRECT_R2_GUARD_MISSING', 'Direct R2 URL guard is missing.')
}
if (!mount.includes('useAssetProjection') || !mount.includes('? projectedVideo.src')) {
  fail('E_PUBLIC_ASSET_SSOT_04_MARKDOWN_PROJECTED_VIDEO_HANDOFF_MISSING', 'Markdown video mount must consume projectedVideo.src.')
}
if (mount.includes('asset.publicPath')) {
  fail('E_PUBLIC_ASSET_SSOT_04_MOUNT_LAYER_PROJECTION_BYPASS', 'Mount layer must not reach into projection publicPath directly.')
}

console.log(pass)
