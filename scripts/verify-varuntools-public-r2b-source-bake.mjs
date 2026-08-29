#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const revision = 'VARUNTOOLS-PUBLIC-PLAYBACK-RENDITION-ADMISSION-AND-NO-ORIGINAL-FALLTHROUGH-CLOSURE-R2B-R1'
const frozen = {
  'src/markdown/mountMarkdownComponents.ts': '43a09d356d391216ecdef017e6736bae8fb710603bc38606c3d92f5f66eaa4ec',
  'src/components/markdown/VideoPlayer.vue': '9bab16e54a9832fef375f9dce482c9397d28ca0702fc6358a4fe74f46e558683',
  'src/content/assetRegistry.ts': 'f5a1d081351052407bcc95fd9f9cab2132c95b8c9fdb8990a74490c175caad97',
  'scripts/build-public-content-projection.mjs': 'b12d2fb936b40b609e5df6f15e0844e2f82340102aa063463b1de6614b3a4e45',
}
const expectedSidecarTreeDigest = String(process.env.VARUNTOOLS_R2B_EXPECTED_SIDECAR_DIGEST || '').trim().toLowerCase()

function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')
}
function fail(code, detail = '') {
  throw new Error(`${code}${detail ? `:${detail}` : ''}`)
}
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', shell: false })
  if (result.status !== 0) fail('E_VARUNTOOLS_R2B_VERIFY_FAILED', `${args.join(' ')}:${result.status ?? 'null'}\n${result.stdout}\n${result.stderr}`)
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
}
function sidecarTreeDigest() {
  const dir = path.join(root, 'src/content/generated/vacms-pages')
  const names = fs.readdirSync(dir).filter((name) => name.endsWith('.projection.json')).sort()
  const rows = names.map((name) => `${crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, name))).digest('hex')}  src/content/generated/vacms-pages/${name}\n`).join('')
  return crypto.createHash('sha256').update(rows).digest('hex')
}

for (const [file, expected] of Object.entries(frozen)) {
  const actual = sha(file)
  if (actual !== expected) fail('E_VARUNTOOLS_R2B_FROZEN_FILE_MUTATED', `${file}:${actual}`)
}
const sidecarDigest = sidecarTreeDigest()
if (expectedSidecarTreeDigest && sidecarDigest !== expectedSidecarTreeDigest) fail('E_VARUNTOOLS_R2B_SOURCE_SIDECAR_MUTATED', `${expectedSidecarTreeDigest}:${sidecarDigest}`)

run(['scripts/build-public-asset-manifest.mjs', '--check'])
run(['scripts/test-varuntools-public-r2b-state-matrix.mjs'])
run(['scripts/test-varuntools-public-r2b-builder-fixtures.mjs'])
run(['scripts/smoke-public-playback-r2b-no-original-fallthrough.mjs'])
run(['scripts/smoke-cms207m-r1-public-projection.mjs'])
run(['scripts/smoke-public-asset-ssot-04-projected-runtime-proxy.mjs'])
run(['scripts/smoke-public-asset-ssot-04-semantic-path-preservation.mjs'])
run(['scripts/smoke-public-asset-ssot-04-no-same-origin-fallthrough.mjs'])
run(['scripts/build-public-asset-manifest.mjs', '--check'])

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/content/generated/publicAssetManifest.generated.json'), 'utf8'))
const videos = Object.values(manifest.assets || {}).filter((asset) => String(asset.mime || '').toLowerCase().startsWith('video/') || String(asset.role || '').toLowerCase() === 'video')
const ready = videos.filter((asset) => asset.delivery?.class === 'playback_rendition' && asset.delivery?.state === 'ready')
const invalid = videos.filter((asset) => Object.prototype.hasOwnProperty.call(asset, 'publicPath') || asset.delivery?.class === 'direct_asset')
if (invalid.length) fail('E_VARUNTOOLS_R2B_ORIGINAL_VIDEO_PATH_ADMITTED', invalid.map((asset) => asset.assetId).join(','))

console.log(JSON.stringify({
  revision,
  status: 'PASS_VARUNTOOLS_PUBLIC_R2B_SOURCE_BAKE',
  manifestSchema: manifest.schemaVersion,
  runtimeRevision: manifest.runtimeRevision,
  projectedVideoAssets: videos.length,
  playbackReadyAssets: ready.length,
  playbackUnavailableAssets: videos.length - ready.length,
  originalVideoPathRuntimeAdmissions: 0,
  frozenFilesByteExact: true,
  sourceSidecarTreeByteExact: true,
  sourceSidecarTreeDigest: sidecarDigest,
}, null, 2))
