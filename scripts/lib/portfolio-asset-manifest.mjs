import fs from 'node:fs'
import path from 'node:path'
import { parseCsv, csvRowsToObjects } from './csv.mjs'
import { collectAssetReferences, resolveAssetPath } from './csv-asset-guard.mjs'

const IMAGE_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.svg', '.avif', '.gif'])
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov'])
const LARGE_IMAGE_BYTES = 800 * 1024
const LARGE_VIDEO_BYTES = 5 * 1024 * 1024
const LARGE_SVG_BYTES = 300 * 1024

function asString(value) {
  return String(value ?? '').trim()
}

function normalizeSlashes(value) {
  return String(value ?? '').replace(/\\/g, '/')
}

function isExternalUrl(value) {
  return /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(asString(value))
}

function extensionOf(value) {
  const raw = asString(value)
  try {
    if (isExternalUrl(raw)) return path.extname(new URL(raw).pathname).toLowerCase()
  } catch {}
  return path.extname(raw.split(/[?#]/)[0]).toLowerCase()
}

function assetKind(extension) {
  if (IMAGE_EXTENSIONS.has(extension)) return 'image'
  if (VIDEO_EXTENSIONS.has(extension)) return 'video'
  return 'unknown'
}

function roleForReference(reference) {
  const block = asString(reference.block)
  const field = asString(reference.field)
  const optionKey = asString(reference.optionKey)

  if (block === 'video' && field === 'src') return 'video'
  if (block === 'video' && (field === 'thumb' || optionKey === 'poster')) return 'poster'
  if (block === 'before-after' || optionKey === 'before' || optionKey === 'after') return 'before-after'
  if (field === 'thumb') return 'thumb'
  if (block === 'gallery-item' || block === 'case-gallery-item' || block === 'image') return 'gallery'
  if ((block === 'page' || block === 'portfolio-hero' || block === 'product') && field === 'src') return 'cover'
  return 'inline'
}

function priorityFor(reference, role) {
  if (asString(reference.block) === 'portfolio-hero' && role === 'cover') return 'high'
  if (asString(reference.block) === 'page' && role === 'cover') return 'high'
  if (role === 'cover' || role === 'thumb') return 'normal'
  return 'low'
}

function loadingFor(reference, role) {
  if (asString(reference.block) === 'portfolio-hero' && role === 'cover') return 'eager'
  return 'lazy'
}

function pageSlugFromCsvPath(sourceCsvPath) {
  const normalized = normalizeSlashes(sourceCsvPath)
  const marker = 'src/content/pages/'
  const index = normalized.indexOf(marker)
  if (index === -1) return path.basename(path.dirname(normalized))
  return normalized.slice(index + marker.length).replace(/\/page\.csv$/, '')
}

function normalizedPathFor(reference, context = {}, resolved = null) {
  const value = asString(reference.value)
  if (!value) return ''
  if (isExternalUrl(value)) return value
  const root = path.resolve(context.projectRoot || process.cwd())
  if (resolved?.absolutePath) return normalizeSlashes(path.relative(root, resolved.absolutePath))
  return normalizeSlashes(value)
}

function warningCodesFor(reference, entry) {
  const warnings = []
  if (entry.kind === 'unknown' && entry.extension) warnings.push('PORTFOLIO_ASSET_UNKNOWN_EXTENSION')
  if (isExternalUrl(reference.value)) warnings.push('PORTFOLIO_ASSET_EXTERNAL_UNMANAGED')
  if (entry.sizeBytes) {
    if (entry.kind === 'image' && entry.extension === '.svg' && entry.sizeBytes > LARGE_SVG_BYTES) warnings.push('PORTFOLIO_ASSET_LARGE_SVG')
    else if (entry.kind === 'image' && entry.sizeBytes > LARGE_IMAGE_BYTES) warnings.push('PORTFOLIO_ASSET_LARGE_IMAGE')
    else if (entry.kind === 'video' && entry.sizeBytes > LARGE_VIDEO_BYTES) warnings.push('PORTFOLIO_ASSET_LARGE_VIDEO')
  }
  return warnings
}

export function createPortfolioAssetEntry(reference, context = {}) {
  const extension = extensionOf(reference.value)
  const kind = assetKind(extension)
  const role = roleForReference(reference)
  const resolved = resolveAssetPath(reference, context)
  const external = isExternalUrl(reference.value)
  const exists = external ? true : Boolean(resolved?.absolutePath && fs.existsSync(resolved.absolutePath))
  const sizeBytes = exists && !external && resolved?.absolutePath ? fs.statSync(resolved.absolutePath).size : undefined
  const entry = {
    sourcePath: normalizeSlashes(context.sourceCsvPath || reference.sourcePath || ''),
    pageSlug: pageSlugFromCsvPath(context.sourceCsvPath || reference.sourcePath || ''),
    block: asString(reference.block),
    field: reference.optionKey ? `${reference.field}.${reference.optionKey}` : asString(reference.field),
    src: asString(reference.value),
    normalizedPath: normalizedPathFor(reference, context, resolved),
    exists,
    kind,
    role,
    priority: priorityFor(reference, role),
    loading: loadingFor(reference, role),
    decoding: kind === 'image' ? 'async' : undefined,
    sizeBytes,
    extension,
    warningCodes: [],
  }
  entry.warningCodes = warningCodesFor(reference, entry)
  return entry
}

export function summarizePortfolioAssets(assets = []) {
  const summary = { total: assets.length, cover: 0, thumb: 0, gallery: 0, video: 0, missing: 0, large: 0, external: 0 }
  for (const asset of assets) {
    if (asset.role === 'cover') summary.cover += 1
    if (asset.role === 'thumb') summary.thumb += 1
    if (asset.role === 'gallery' || asset.role === 'before-after') summary.gallery += 1
    if (asset.kind === 'video' || asset.role === 'video') summary.video += 1
    if (!asset.exists) summary.missing += 1
    if (asset.src && isExternalUrl(asset.src)) summary.external += 1
    if ((asset.warningCodes || []).some((code) => code.startsWith('PORTFOLIO_ASSET_LARGE_'))) summary.large += 1
  }
  return summary
}

export function collectPortfolioAssetEntriesFromCsv(sourceCsvPath, context = {}) {
  const projectRoot = path.resolve(context.projectRoot || process.cwd())
  const absoluteCsvPath = path.resolve(projectRoot, sourceCsvPath)
  const rows = csvRowsToObjects(parseCsv(fs.readFileSync(absoluteCsvPath, 'utf8')), { sourcePath: sourceCsvPath })
  const references = collectAssetReferences(rows, { ...context, sourceCsvPath, sourcePath: sourceCsvPath, projectRoot })
  return references
    .filter((reference) => asString(reference.value))
    .map((reference) => createPortfolioAssetEntry(reference, { ...context, sourceCsvPath, sourcePath: sourceCsvPath, projectRoot }))
}

export function buildPortfolioAssetManifest(input = {}) {
  const projectRoot = path.resolve(input.projectRoot || process.cwd())
  const csvPaths = input.csvPaths || []
  const assets = []
  for (const sourceCsvPath of csvPaths) {
    assets.push(...collectPortfolioAssetEntriesFromCsv(sourceCsvPath, { ...input, projectRoot }))
  }
  return {
    version: 1,
    generatedAt: input.generatedAt || new Date().toISOString(),
    assets,
    summary: summarizePortfolioAssets(assets),
  }
}

export function findPortfolioCsvFiles(input = {}) {
  const projectRoot = path.resolve(input.projectRoot || process.cwd())
  const pagesRoot = path.resolve(projectRoot, input.pagesRoot || 'src/content/pages')
  const files = []
  function walk(dir) {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && entry.name === 'page.csv') files.push(normalizeSlashes(path.relative(projectRoot, full)))
    }
  }
  walk(pagesRoot)
  return files.sort()
}
