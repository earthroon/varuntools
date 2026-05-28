#!/usr/bin/env node
import { createEmptyAssetManifest, assertAssetManifestShape, readJsonIfExists, resolveAssetManifestPath, resolveAssetSyncMode, writeJsonPretty } from './lib/asset-sync-mode.mjs'

async function main() {
  const mode = resolveAssetSyncMode()
  const manifestPath = resolveAssetManifestPath()

  if (mode === 'legacy-appscript') {
    throw new Error('sync-vacms-assets.mjs must not be used in legacy-appscript mode.')
  }

  if (mode === 'none') {
    const manifest = createEmptyAssetManifest({ source: 'none-placeholder', warning: 'Asset sync is disabled for this publish run.' })
    await writeJsonPretty(manifestPath, manifest)
    console.log(`[sync:vacms-assets] mode=none wrote ${manifestPath}`)
    console.log('[sync:vacms-assets] success')
    return
  }

  const existing = await readJsonIfExists(manifestPath)
  if (existing) {
    assertAssetManifestShape(existing, manifestPath)
    console.log(`[sync:vacms-assets] preserved existing manifest ${manifestPath}`)
    console.log(`[sync:vacms-assets] assets: ${existing.assets.length}`)
    console.log('[sync:vacms-assets] success')
    return
  }

  const manifest = createEmptyAssetManifest({ source: 'vacms-placeholder', warning: 'VACMS asset export is not configured yet. Generated an empty asset manifest so public publish is not blocked by legacy AppScript.' })
  await writeJsonPretty(manifestPath, manifest)
  console.log(`[sync:vacms-assets] mode=vacms wrote placeholder ${manifestPath}`)
  console.log('[sync:vacms-assets] assets: 0')
  console.log('[sync:vacms-assets] success')
}

main().catch((error) => {
  console.error(`[sync:vacms-assets] failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
