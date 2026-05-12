#!/usr/bin/env node
import fs from 'node:fs/promises'
import { callAppsScriptGateway } from './lib/appscript-gateway-client.mjs'
import { readJson, writeJson } from './lib/write-json.mjs'
import { safeAssetId, generatedFileName, generatedContentAssetPaths, pageTypeToFolder, safePageId, resolveOriginalExtension } from './lib/asset-filename.mjs'
import { assertAllowedAssetMime } from './lib/mime-policy.mjs'
import { optimizeImageBufferToWebp } from './lib/image-webp-optimizer.mjs'

function parseArgs(argv) {
  const out = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--assets-raw') out.assetsRawPath = argv[++index]
    else if (arg === '--out-dir') out.outDir = argv[++index]
    else if (arg === '--manifest') out.manifestPath = argv[++index]
    else if (arg === '--pages-raw') out.pagesRawPath = argv[++index]
    else if (arg === '--base-pages') out.basePagesPath = argv[++index]
    else if (arg === '--content-pages-dir') out.contentPagesDir = argv[++index]
    else if (arg === '--fixture') out.fixturePath = argv[++index]
  }
  return out
}

function filled(value) {
  return String(value ?? '').trim().length > 0
}

function enabled(value) {
  return String(value ?? '').trim().toUpperCase() === 'Y'
}


function buildPageTypeMap({ rawPages, basePages }) {
  const map = new Map()
  for (const page of basePages?.pages ?? []) {
    if (filled(page.id) && filled(page.type)) map.set(String(page.id).trim(), String(page.type).trim())
  }
  for (const row of rawPages?.rows ?? []) {
    if (filled(row.pageId) && filled(row.type)) map.set(String(row.pageId).trim(), String(row.type).trim())
  }
  return map
}

function resolveAssetPageType(row, pageTypeMap) {
  const explicit = String(row.pageType ?? row.pageCategory ?? row.category ?? '').trim()
  if (explicit) return explicit
  const pageId = String(row.pageId ?? '').trim()
  return pageTypeMap.get(pageId) || 'work'
}

function resolveAssetPageFolder(row, pageType) {
  const explicit = String(row.pageFolder ?? row.categoryFolder ?? '').trim()
  if (explicit) return explicit
  return pageTypeToFolder(pageType)
}

function normalizeAssetMode(row) {
  const explicit = String(row.assetMode ?? row.mode ?? '').trim().toLowerCase()
  const type = String(row.type ?? '').trim().toLowerCase()
  if (explicit) return explicit
  if (type === 'video') return 'video-large'
  return 'inline'
}

function externalSrc(row) {
  return String(row.externalUrl ?? row.embedUrl ?? row.url ?? row.localPath ?? '').trim()
}

function selectAssetRows(rawAssets, pageTypeMap) {
  const rows = rawAssets?.rows ?? []
  const selected = []
  const external = []
  const warnings = []
  const errors = []
  const seen = new Set()

  for (const row of rows) {
    if (!enabled(row.visible)) continue
    try {
      const assetId = safeAssetId(row.assetId)
      if (seen.has(assetId)) throw new Error(`Duplicated assetId: ${assetId}`)
      seen.add(assetId)
      if (!filled(row.type)) throw new Error(`visible=Y asset is missing type: ${assetId}`)

      const type = String(row.type).trim().toLowerCase()
      const pageId = safePageId(row.pageId)
      const pageType = resolveAssetPageType(row, pageTypeMap)
      const pageFolder = resolveAssetPageFolder(row, pageType)
      const assetMode = normalizeAssetMode(row)
      const normalized = {
        pageId,
        pageType,
        pageFolder,
        assetId,
        type,
        role: String(row.role ?? '').trim(),
        assetMode,
        driveFileId: String(row.driveFileId ?? '').trim(),
        fileName: String(row.fileName ?? row.driveFileName ?? '').trim(),
        externalUrl: externalSrc(row),
      }

      if (assetMode === 'external' || assetMode === 'video-large') {
        if (!filled(normalized.externalUrl)) {
          throw new Error(`${assetMode} asset requires externalUrl/embedUrl/localPath: ${assetId}`)
        }
        external.push(normalized)
        continue
      }

      if (type === 'video') {
        throw new Error(`Video assets must use assetMode=video-large or external: ${assetId}`)
      }

      if (!filled(normalized.driveFileId) && !filled(normalized.pageId)) {
        throw new Error(`inline asset requires driveFileId or pageId folder lookup: ${assetId}`)
      }

      selected.push(normalized)
    } catch (error) {
      errors.push({ code: 'asset.row.invalid', rowNumber: row.__rowNumber, message: error.message })
    }
  }

  return { selected, external, warnings, errors }
}

async function loadAssetPayloads({ selected, fixturePath }) {
  if (!selected.length) return []

  if (fixturePath) {
    const fixture = await readJson(fixturePath)
    return Array.isArray(fixture.assets) ? fixture.assets : fixture
  }

  const response = await callAppsScriptGateway({
    action: 'assets',
    payload: {
      assets: selected.map((asset) => ({
        pageId: asset.pageId || undefined,
        pageType: asset.pageType || undefined,
        pageFolder: asset.pageFolder || undefined,
        assetId: asset.assetId,
        type: asset.type,
        role: asset.role || undefined,
        driveFileId: asset.driveFileId || undefined,
        fileName: asset.fileName || undefined,
      })),
    },
  })

  if (!Array.isArray(response.assets)) {
    throw new Error('Apps Script assets response must include an assets array.')
  }
  return response.assets
}

function normalizeAssetPayload(payload, selectedAsset) {
  const assetId = safeAssetId(payload.assetId || selectedAsset.assetId)
  const mimeType = String(payload.mimeType ?? '').trim() || 'application/octet-stream'
  const type = String(payload.type ?? selectedAsset.type ?? '').trim() || 'image'
  const originalExt = String(payload.extension ?? '').trim().replace(/^\./, '') || resolveOriginalExtension({ fileName: payload.fileName, mimeType, fallback: type === 'image' ? 'img' : 'bin' })
  const base64 = String(payload.base64 ?? payload.data ?? '').trim()
  if (!base64) throw new Error(`Asset payload is missing base64 for ${assetId}.`)
  assertAllowedAssetMime({ type, mimeType, assetId })
  return {
    pageId: String(payload.pageId ?? selectedAsset.pageId ?? '').trim() || undefined,
    pageType: String(payload.pageType ?? selectedAsset.pageType ?? '').trim() || undefined,
    pageFolder: String(payload.pageFolder ?? selectedAsset.pageFolder ?? '').trim() || undefined,
    assetId,
    base64,
    originalExt,
    mimeType,
    type,
    role: String(payload.role ?? selectedAsset.role ?? '').trim() || undefined,
    size: Number(payload.size ?? Buffer.byteLength(base64, 'base64')),
    fileName: String(payload.fileName ?? '').trim() || undefined,
  }
}

async function writeInlineAsset({ normalized, contentPagesDir }) {
  const sourceBuffer = Buffer.from(normalized.base64, 'base64')

  if (normalized.type === 'image') {
    const webpBuffer = normalized.mimeType === 'image/webp'
      ? sourceBuffer
      : await optimizeImageBufferToWebp({ buffer: sourceBuffer, assetId: normalized.assetId, sourceExt: normalized.originalExt })
    const fileName = generatedFileName({ assetId: normalized.assetId, ext: 'webp' })
    const paths = generatedContentAssetPaths({
      contentPagesDir,
      pageFolder: normalized.pageFolder,
      pageId: normalized.pageId,
      type: normalized.type,
      fileName,
    })
    await fs.mkdir(paths.dir, { recursive: true })
    await fs.writeFile(paths.filePath, webpBuffer)
    return {
      fileName,
      src: paths.src,
      repoPath: paths.repoPath,
      mimeType: 'image/webp',
      optimizedFrom: normalized.mimeType,
      size: webpBuffer.byteLength,
    }
  }

  const fileName = generatedFileName({ assetId: normalized.assetId, ext: normalized.originalExt })
  const paths = generatedContentAssetPaths({
    contentPagesDir,
    pageFolder: normalized.pageFolder,
    pageId: normalized.pageId,
    type: normalized.type,
    fileName,
  })
  await fs.mkdir(paths.dir, { recursive: true })
  await fs.writeFile(paths.filePath, sourceBuffer)
  return {
    fileName,
    src: paths.src,
    repoPath: paths.repoPath,
    mimeType: normalized.mimeType,
    optimizedFrom: undefined,
    size: sourceBuffer.byteLength,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const assetsRawPath = args.assetsRawPath || process.env.SHEET_CMS_ASSETS_RAW || '.sheet-cms-cache/raw/assets.raw.json'
  const legacyOutDir = args.outDir || process.env.DRIVE_ASSET_OUT_DIR || ''
  if (legacyOutDir) console.warn('[sync:appscript-assets] DRIVE_ASSET_OUT_DIR is ignored in page-owned asset mode. Use SHEET_CMS_CONTENT_PAGES_DIR.')
  const manifestPath = args.manifestPath || process.env.DRIVE_ASSET_MANIFEST || '.sheet-cms-cache/drive-assets.generated.json'
  const pagesRawPath = args.pagesRawPath || process.env.SHEET_CMS_PAGES_RAW || '.sheet-cms-cache/raw/pages.raw.json'
  const basePagesPath = args.basePagesPath || process.env.SHEET_CMS_BASE_PAGES || 'src/content/generated/pages.generated.json'
  const contentPagesDir = args.contentPagesDir || process.env.SHEET_CMS_CONTENT_PAGES_DIR || 'src/content/pages'
  const fixturePath = args.fixturePath || process.env.SHEET_CMS_ASSET_FIXTURE || ''

  const rawAssets = await readJson(assetsRawPath)
  let rawPages = { rows: [] }
  let basePages = { pages: [] }
  try { rawPages = await readJson(pagesRawPath) } catch (error) { if (error.code !== 'ENOENT') throw error }
  try { basePages = await readJson(basePagesPath) } catch (error) { if (error.code !== 'ENOENT') throw error }
  const pageTypeMap = buildPageTypeMap({ rawPages, basePages })
  const { selected, external, warnings, errors } = selectAssetRows(rawAssets, pageTypeMap)
  console.log(`[sync:appscript-assets] selected inline assets: ${selected.length}`)
  console.log(`[sync:appscript-assets] selected external assets: ${external.length}`)

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: fixturePath ? 'fixture' : 'apps-script-gateway',
    schemaVersion: '1.0.0',
    assets: [],
    warnings,
    errors,
  }

  for (const asset of external) {
    manifest.assets.push({
      assetId: asset.assetId,
      src: asset.externalUrl,
      type: asset.type,
      role: asset.role || undefined,
      pageId: asset.pageId || undefined,
      pageType: asset.pageType || undefined,
      pageFolder: asset.pageFolder || undefined,
      assetMode: asset.assetMode,
      external: true,
      downloadedAt: new Date().toISOString(),
    })
  }

  if (errors.length) {
    await writeJson(manifestPath, manifest)
    for (const error of errors) console.error(`[error:${error.code}] ${error.message}`)
    process.exit(1)
  }

  const payloads = await loadAssetPayloads({ selected, fixturePath })
  const payloadMap = new Map(payloads.map((payload) => [String(payload.assetId ?? '').trim(), payload]))

  for (const asset of selected) {
    try {
      const payload = payloadMap.get(asset.assetId)
      if (!payload) throw new Error(`Apps Script did not return asset payload for ${asset.assetId}.`)
      const normalized = normalizeAssetPayload(payload, asset)
      const written = await writeInlineAsset({ normalized, contentPagesDir })
      manifest.assets.push({
        pageId: normalized.pageId || undefined,
        assetId: normalized.assetId,
        src: written.src,
        repoPath: written.repoPath,
        pageType: normalized.pageType || asset.pageType || undefined,
        pageFolder: normalized.pageFolder || asset.pageFolder || undefined,
        type: normalized.type,
        role: normalized.role || asset.role || undefined,
        mimeType: written.mimeType,
        size: written.size,
        optimizedFrom: written.optimizedFrom || undefined,
        downloadedAt: new Date().toISOString(),
      })
      console.log(`[sync:appscript-assets] wrote ${written.src}`)
    } catch (error) {
      manifest.errors.push({ code: 'asset.payload.failed', assetId: asset.assetId, message: error.message })
      console.error(`[sync:appscript-assets] failed ${asset.assetId}: ${error.message}`)
    }
  }

  await writeJson(manifestPath, manifest)
  console.log(`[sync:appscript-assets] wrote ${manifestPath}`)
  console.log(`[sync:appscript-assets] warnings: ${manifest.warnings.length}`)
  console.log(`[sync:appscript-assets] errors: ${manifest.errors.length}`)

  if (manifest.errors.length) process.exit(1)
  console.log('[sync:appscript-assets] success')
}

main().catch((error) => {
  console.error(`[sync:appscript-assets] failed: ${error.message}`)
  process.exit(1)
})
