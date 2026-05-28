import fs from 'node:fs/promises'
import path from 'node:path'

export const VALID_ASSET_SYNC_MODES = new Set(['vacms', 'legacy-appscript', 'none'])

export function resolveAssetSyncMode(env = process.env) {
  const raw = String(env.SHEET_CMS_ASSET_SYNC_MODE || env.PUBLIC_SITE_ASSET_SYNC_MODE || 'vacms').trim().toLowerCase()
  if (!VALID_ASSET_SYNC_MODES.has(raw)) {
    throw new Error(`Invalid SHEET_CMS_ASSET_SYNC_MODE: ${raw}. Expected one of: ${Array.from(VALID_ASSET_SYNC_MODES).join(', ')}`)
  }
  return raw
}

export function resolveAssetManifestPath(env = process.env) {
  return env.DRIVE_ASSET_MANIFEST || env.SHEET_CMS_ASSET_MANIFEST || '.sheet-cms-cache/drive-assets.generated.json'
}

export async function readJsonIfExists(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf8')
    return JSON.parse(text)
  } catch (error) {
    if (error && error.code === 'ENOENT') return null
    throw error
  }
}

export async function writeJsonPretty(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export function createEmptyAssetManifest({ source = 'vacms-placeholder', warning = 'VACMS asset export is not configured yet.' } = {}) {
  return {
    generatedAt: new Date().toISOString(),
    source,
    schemaVersion: '1.0.0',
    assets: [],
    warnings: warning ? [warning] : [],
    errors: [],
  }
}

export function assertAssetManifestShape(manifest, filePath = 'asset manifest') {
  if (!manifest || typeof manifest !== 'object') throw new Error(`${filePath} must be a JSON object.`)
  if (!Array.isArray(manifest.assets)) throw new Error(`${filePath} must include an assets array.`)
  if (manifest.errors && !Array.isArray(manifest.errors)) throw new Error(`${filePath} errors must be an array when present.`)
  if (manifest.warnings && !Array.isArray(manifest.warnings)) throw new Error(`${filePath} warnings must be an array when present.`)
  return manifest
}
