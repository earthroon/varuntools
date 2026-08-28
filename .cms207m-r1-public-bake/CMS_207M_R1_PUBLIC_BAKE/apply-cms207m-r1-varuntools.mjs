#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const PATCH = 'CMS-207M-R1'
const ROOT = process.cwd()
const HERE = path.dirname(fileURLToPath(import.meta.url))
const PAYLOAD = path.join(HERE, 'payload', 'varuntools')
const DRY = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')

const modified = {
  'package.json': 'f9b89f8e58d373e0b4256ebb766627e44d0aa20210ced6606211713ad978d072',
  '.github/workflows/publish-admin-content.yml': 'd38525b5923151a847c1ab28eff9cca5d1fde6e170517ce5711188b54ffa3e5d',
  'scripts/commit-vacms-materialized-source.mjs': '5793562470bf64ce08838e732a91633a81d99fe40242b29b6af1622cb995ffa5',
  'scripts/cms207a-incremental-source-commit-smoke.mjs': 'f97f3c2b28d0b257c5a91997676a694273ed27cb4c359db1ef6325bafbee9cd7',
  'scripts/cms-204as-live-materialized-source-commit-back-guard.mjs': '025198245fdb51e41fbe76193dc15c7d42b13c87554d9aa0c1d43a66c0bd7014',
  'scripts/build-home-collections.mjs': '1591a3989019a2350989302fde3fe7279a110fcf509f5112c52831b9501e859d',
  'scripts/build-public-content-index.mjs': '2c8adff3a971c4935d487461b51597032c7dbddfa74b24aeaaf708e021d751c4',
  'scripts/prerender-homepage-recent-feed.mjs': '009294db32e9a08dae6eaf0b1efcab2dbfb08515c338ed0963c2f2dede03c3e1',
  'scripts/cms207h-home-runtime-index-contract-smoke.mjs': '5169639badd9739a5fcbbd6be0e2930a42d84cc3d0c5a1f2fbaa0a3c94e31773',
  'scripts/cms207f-homepage-recent-public-content-smoke.mjs': '2af595a5a395ff3f3622947851708b012f2e73b9b014b8ede296b632dd4738c3',
  'scripts/cms207f-homepage-no-featured-works-only-smoke.mjs': 'e52329daf4d68de718e1c07f5f223a176d1dd0e6e28cb444b16fe106b498892b',
  'src/markdown/directives/videoPlayerDirective.ts': 'd6945837d6c22454fa711dc52443bda97234037f473b1c633a1f0efc74b50785',
  'src/markdown/mountMarkdownComponents.ts': '356a7b3b710a3b85eca444841a0d72a2797ecad0afd552a559711bd00eff6e1d',
  'src/content/generated/homeCollections.generated.json': 'c06963bd11c38439fd335e137b694b41682363ca63f5a62d083d888a4b8bc953',
}

const created = [
  'scripts/lib/cms207m-public-projection.mjs',
  'scripts/build-public-content-projection.mjs',
  'scripts/build-public-asset-manifest.mjs',
  'scripts/smoke-cms207m-r1-public-projection.mjs',
  'src/content/publicProjectionTypes.ts',
  'src/content/usePublicAssetProjection.ts',
  'src/content/generated/publicContentProjection.generated.json',
  'src/content/generated/publicAssetManifest.generated.json',
]

function fail(message) { throw new Error(`${PATCH}: ${message}`) }
function abs(rel) { return path.join(ROOT, rel) }
function payload(rel) { return path.join(PAYLOAD, rel) }
function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex') }
function readBytes(rel) { if (!fs.existsSync(abs(rel))) fail(`missing ${rel}`); return fs.readFileSync(abs(rel)) }
function isApplied(rel) {
  if (!fs.existsSync(abs(rel))) return false
  const source = fs.readFileSync(abs(rel), 'utf8')
  const markers = {
    'package.json': 'smoke:cms207m:r1',
    '.github/workflows/publish-admin-content.yml': 'Build CMS-207M-R1 source projections',
    'scripts/commit-vacms-materialized-source.mjs': 'projectionDerivedFiles',
    'scripts/cms207a-incremental-source-commit-smoke.mjs': 'projectionSidecarPath',
    'scripts/cms-204as-live-materialized-source-commit-back-guard.mjs': 'projectionSidecarPath',
    'scripts/build-home-collections.mjs': 'CMS_207M_R1_HOME_COLLECTIONS_SINGLE_PROJECTION',
    'scripts/build-public-content-index.mjs': 'cms-207m-public-content-projection',
    'scripts/prerender-homepage-recent-feed.mjs': 'CMS_207M_PUBLIC_CONTENT_PROJECTION_MISSING',
    'scripts/cms207h-home-runtime-index-contract-smoke.mjs': 'publicContentProjection.generated.json',
    'scripts/cms207f-homepage-recent-public-content-smoke.mjs': 'generated-home-collections',
    'scripts/cms207f-homepage-no-featured-works-only-smoke.mjs': 'useHomeCollections',
    'src/markdown/directives/videoPlayerDirective.ts': 'missing_src_stream_or_asset_id',
    'src/markdown/mountMarkdownComponents.ts': 'resolvePublicVideoAssetProjection',
    'src/content/generated/homeCollections.generated.json': 'CMS-207M-R1',
  }
  return source.includes(markers[rel] || '__never__')
}

for (const [rel, expected] of Object.entries(modified)) {
  if (isApplied(rel)) continue
  const actual = sha256(readBytes(rel))
  if (actual !== expected && !FORCE) fail(`base sha256 mismatch ${rel} expected=${expected} actual=${actual}; do not use --force without manual review`)
}
for (const rel of created) {
  if (!fs.existsSync(payload(rel))) fail(`payload missing ${rel}`)
  if (fs.existsSync(abs(rel)) && !FORCE) {
    const current = sha256(fs.readFileSync(abs(rel)))
    const next = sha256(fs.readFileSync(payload(rel)))
    if (current !== next) fail(`new-path collision ${rel}; do not use --force without manual review`)
  }
}

if (DRY) {
  console.log(`${PATCH}: VARUNTOOLS DRY RUN PASS`)
  for (const rel of [...Object.keys(modified), ...created]) console.log(`[dry-run] ${rel}`)
  process.exit(0)
}

const backups = new Map()
for (const rel of Object.keys(modified)) backups.set(rel, fs.readFileSync(abs(rel)))
const createdBefore = new Set(created.filter((rel) => fs.existsSync(abs(rel))))

try {
  for (const rel of [...Object.keys(modified), ...created]) {
    fs.mkdirSync(path.dirname(abs(rel)), { recursive: true })
    fs.copyFileSync(payload(rel), abs(rel))
  }

  const checks = [
    ['scripts/smoke-cms207m-r1-public-projection.mjs'],
    ['scripts/build-public-content-index.mjs'],
    ['scripts/cms207h-public-content-index-smoke.mjs'],
    ['scripts/cms207h-home-runtime-index-contract-smoke.mjs'],
    ['scripts/cms207f-homepage-recent-public-content-smoke.mjs'],
    ['scripts/cms207f-homepage-no-featured-works-only-smoke.mjs'],
    ['scripts/smoke-public-asset-ssot-04m-b1-mobile-entry-fast-path.mjs'],
    ['scripts/smoke-public-asset-ssot-04m-b3-r2-home-critical-render-stability.mjs'],
    ['scripts/cms207a-incremental-source-commit-smoke.mjs'],
  ]
  for (const args of checks) {
    const result = spawnSync(process.execPath, args.map((arg) => abs(arg)), { cwd: ROOT, stdio: 'inherit' })
    if (result.status !== 0) fail(`smoke failed ${args.join(' ')} exit=${result.status ?? 'null'}`)
  }

  fs.mkdirSync(abs('_patch_reports'), { recursive: true })
  fs.writeFileSync(abs('_patch_reports/CMS_207M_R1_VARUNTOOLS_APPLY_RECEIPT.json'), JSON.stringify({
    patchId: PATCH,
    status: 'APPLIED_STATIC_SMOKE_PASS',
    files: [...Object.keys(modified), ...created],
  }, null, 2) + '\n', 'utf8')
  console.log(`${PATCH}: VARUNTOOLS APPLY PASS`)
} catch (error) {
  for (const [rel, bytes] of backups) fs.writeFileSync(abs(rel), bytes)
  for (const rel of created) if (!createdBefore.has(rel) && fs.existsSync(abs(rel))) fs.rmSync(abs(rel), { force: true })
  throw error
}
