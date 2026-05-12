#!/usr/bin/env node
import path from 'node:path'
import { readJson, writeJson } from './lib/write-json.mjs'

const DEFAULT_RAW_DIR = '.sheet-cms-cache/raw'
const DEFAULT_DRIVE_MANIFEST = '.sheet-cms-cache/drive-assets.generated.json'
const DEFAULT_OUT_DIR = 'src/content/generated'
const SCHEMA_VERSION = '1.0.0'
const PAGE_TYPES = new Set(['page', 'work', 'commission', 'product', 'catalog', 'doc', 'lab', 'tool'])
const BLOCK_KINDS = new Set(['text', 'callout', 'compare', 'image', 'cta', 'faq'])
const CALLOUT_TYPES = new Set(['note', 'tip', 'warning', 'danger', 'ssot', 'decision', 'quote'])
const PAGE_TYPE_FOLDER_MAP = {
  work: 'works',
  product: 'products',
  commission: 'works',
  catalog: 'works',
  tool: 'works',
  lab: 'lab-markdown-gallery',
  doc: 'guide',
  page: 'pages',
}
const FORBIDDEN_PUBLIC_KEYS = new Set([
  'memo',
  'internalMemo',
  'privateNote',
  'adminOnly',
  'driveFileId',
  'client_email',
  'private_key',
  'serviceAccount',
  'spreadsheetId',
])

function parseArgs(argv) {
  const out = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--raw-dir') out.rawDir = argv[++index]
    else if (arg === '--drive-manifest') out.driveManifestPath = argv[++index]
    else if (arg === '--out-dir') out.outDir = argv[++index]
    else if (arg === '--strict') out.strict = true
  }
  return out
}

function filled(value) {
  return String(value ?? '').trim().length > 0
}

function enabled(value) {
  return String(value ?? '').trim().toUpperCase() === 'Y'
}

function text(value) {
  const out = String(value ?? '').trim()
  return out || undefined
}

function requireText(value, label) {
  const out = text(value)
  if (!out) throw new Error(`${label} is required.`)
  return out
}

function toNumber(value, fallback = 9999) {
  const n = Number(String(value ?? '').trim())
  return Number.isFinite(n) ? n : fallback
}

function toBoolean(value, fallback = false) {
  if (!filled(value)) return fallback
  const source = String(value).trim().toLowerCase()
  if (['y', 'yes', 'true', '1'].includes(source)) return true
  if (['n', 'no', 'false', '0'].includes(source)) return false
  return fallback
}

function csvToArray(value) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function safeFolderSegment(value, fallback = '') {
  const segment = String(value ?? '').trim() || fallback
  if (!segment) return ''
  if (!/^[a-z0-9][a-z0-9-_]*$/.test(segment)) throw new Error(`Unsafe folder segment: ${segment}`)
  return segment
}

function pageTypeToFolder(type) {
  const normalized = String(type ?? '').trim().toLowerCase()
  if (!normalized) return 'pages'
  return PAGE_TYPE_FOLDER_MAP[normalized] || `${safeFolderSegment(normalized)}s`
}

function resolvePageFolder(row, type) {
  return safeFolderSegment(row.pageFolder || row.categoryFolder || '', pageTypeToFolder(type))
}

function parseOptionsJson(value, context, report) {
  const source = String(value ?? '').trim()
  if (!source) return {}
  try {
    const parsed = JSON.parse(source)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('optionsJson must be a JSON object.')
    }
    return parsed
  } catch (error) {
    report.errors.push({ code: 'optionsJson.invalid', context, message: error.message })
    return {}
  }
}

async function maybeReadJson(filePath, fallback) {
  try {
    return await readJson(filePath)
  } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

async function readRaw(rawDir, name) {
  return maybeReadJson(path.join(rawDir, `${name}.raw.json`), { rows: [], warnings: [], errors: [] })
}

function byOrder(a, b) {
  if (a.order !== b.order) return a.order - b.order
  return String(a.id).localeCompare(String(b.id))
}

function collectEnums(rows, fallbackSet) {
  const values = new Set()
  for (const row of rows || []) {
    if (enabled(row.public) && filled(row.value)) values.add(String(row.value).trim())
  }
  return values.size ? values : fallbackSet
}

function collectCalloutDefs(rows) {
  const defs = new Map()
  for (const row of rows || []) {
    if (!enabled(row.public) || !filled(row.value)) continue
    defs.set(String(row.value).trim(), {
      value: String(row.value).trim(),
      tone: String(row.componentTone || row.value).trim(),
      defaultCollapsible: enabled(row.defaultCollapsible),
      defaultOpen: filled(row.defaultOpen) ? enabled(row.defaultOpen) : true,
    })
  }
  if (!defs.size) {
    for (const value of CALLOUT_TYPES) defs.set(value, { value, tone: value, defaultCollapsible: false, defaultOpen: true })
  }
  return defs
}

function publicAssetFromDrive(asset, rawAsset) {
  return {
    assetId: asset.assetId,
    src: asset.src,
    alt: text(rawAsset?.alt),
    caption: text(rawAsset?.caption),
    type: text(rawAsset?.type) || asset.type || 'image',
    role: text(rawAsset?.role) || asset.role,
    mimeType: text(asset.mimeType),
    pageId: text(asset.pageId) || text(rawAsset?.pageId),
    pageType: text(asset.pageType) || text(rawAsset?.pageType),
    pageFolder: text(asset.pageFolder) || text(rawAsset?.pageFolder),
    repoPath: text(asset.repoPath),
    external: asset.external === true || undefined,
    assetMode: text(asset.assetMode),
  }
}

function buildAssets({ rawAssetRows, driveManifest, baseAssets, report }) {
  const assetMap = new Map((baseAssets || []).map((asset) => [asset.assetId, asset]))
  const driveMap = new Map((driveManifest.assets || []).map((asset) => [asset.assetId, asset]))
  const seenRaw = new Set()
  let upserted = 0

  for (const row of rawAssetRows) {
    if (!enabled(row.visible)) continue
    try {
      const assetId = requireText(row.assetId, `assets row ${row.__rowNumber || '?'} assetId`)
      if (seenRaw.has(assetId)) throw new Error(`Duplicate assetId in raw assets: ${assetId}`)
      seenRaw.add(assetId)
      const type = requireText(row.type, `asset ${assetId} type`)
      const driveAsset = driveMap.get(assetId)
      const src = text(row.localPath) || driveAsset?.src
      if (!src) {
        report.errors.push({ code: 'asset.src.missing', assetId, message: `Asset ${assetId} has no generated src.` })
        continue
      }
      assetMap.set(assetId, publicAssetFromDrive({ ...(driveAsset || {}), assetId, src, type, role: row.role }, row))
      upserted += 1
    } catch (error) {
      report.errors.push({ code: 'asset.normalize.failed', rowNumber: row.__rowNumber, message: error.message })
    }
  }

  return { assets: [...assetMap.values()].sort((a, b) => a.assetId.localeCompare(b.assetId)), upserted }
}

function resolveAsset(assetId, assetMap, report, context) {
  const id = String(assetId ?? '').trim()
  const asset = assetMap.get(id)
  if (!asset) {
    report.errors.push({ code: 'asset.reference.missing', context, assetId: id, message: `Missing assetId: ${id}` })
    return null
  }
  return asset
}

function normalizeTextBlock(row) {
  if (!filled(row.body)) return null
  return {
    id: text(row.blockId),
    kind: 'text',
    order: toNumber(row.order),
    title: text(row.title),
    body: String(row.body).trim(),
  }
}

function normalizeCalloutBlock(row, calloutDefs, report, context) {
  const calloutType = text(row.calloutType)
  if (!calloutType) return null
  const def = calloutDefs.get(calloutType)
  if (!def) {
    report.errors.push({ code: 'callout.type.invalid', context, message: `Unknown calloutType: ${calloutType}` })
    return null
  }
  if (!filled(row.body)) {
    report.errors.push({ code: 'callout.body.missing', context, message: 'Callout body is required.' })
    return null
  }
  const options = parseOptionsJson(row.optionsJson, context, report)
  return {
    id: text(row.blockId),
    kind: 'callout',
    order: toNumber(row.order),
    type: calloutType,
    tone: def.tone,
    title: text(row.title),
    body: String(row.body).trim(),
    collapsible: typeof options.collapsible === 'boolean' ? options.collapsible : def.defaultCollapsible,
    defaultOpen: typeof options.defaultOpen === 'boolean' ? options.defaultOpen : def.defaultOpen,
  }
}

function normalizeCompareBlock(row, assetMap, report, context) {
  const beforeId = text(row.beforeAssetId)
  const afterId = text(row.afterAssetId)
  if (!beforeId && !afterId) return null
  if (!beforeId || !afterId) {
    report.errors.push({ code: 'compare.pair.incomplete', context, message: 'Compare block requires both beforeAssetId and afterAssetId.' })
    return null
  }
  const before = resolveAsset(beforeId, assetMap, report, `${context}.before`)
  const after = resolveAsset(afterId, assetMap, report, `${context}.after`)
  if (!before || !after) return null
  const options = parseOptionsJson(row.optionsJson, context, report)
  const initial = Math.min(100, Math.max(0, toNumber(options.initial, 50)))
  return {
    id: text(row.blockId),
    kind: 'compare',
    order: toNumber(row.order),
    title: text(row.title),
    before,
    after,
    initial,
    caption: text(row.caption),
    labels: typeof options.labels === 'boolean' ? options.labels : undefined,
  }
}

function normalizeImageBlock(row, assetMap, report, context) {
  const assetId = text(row.assetId)
  if (!assetId) return null
  const image = resolveAsset(assetId, assetMap, report, context)
  if (!image) return null
  return {
    id: text(row.blockId),
    kind: 'image',
    order: toNumber(row.order),
    title: text(row.title),
    image,
    caption: text(row.caption) || image.caption,
  }
}

function normalizeCtaBlock(row, report, context) {
  const buttonLabel = text(row.buttonLabel)
  const buttonUrl = text(row.buttonUrl)
  if (!buttonLabel && !buttonUrl) return null
  if (!buttonLabel || !buttonUrl) {
    report.warnings.push({ code: 'cta.incomplete', context, message: 'CTA skipped because buttonLabel or buttonUrl is blank.' })
    return null
  }
  const options = parseOptionsJson(row.optionsJson, context, report)
  return {
    id: text(row.blockId),
    kind: 'cta',
    order: toNumber(row.order),
    title: text(row.title),
    body: text(row.body),
    buttonLabel,
    buttonUrl,
    variant: ['primary', 'secondary', 'ghost'].includes(options.variant) ? options.variant : 'primary',
  }
}

function normalizeFaqBlock(row, report, context) {
  if (!filled(row.title) || !filled(row.body)) {
    report.errors.push({ code: 'faq.incomplete', context, message: 'FAQ requires title(question) and body(answer).' })
    return null
  }
  return {
    id: text(row.blockId),
    kind: 'faq',
    order: toNumber(row.order),
    question: String(row.title).trim(),
    answer: String(row.body).trim(),
  }
}

function normalizeBlock(row, context) {
  const kind = text(row.kind)
  if (!kind || !enabled(row.visible)) return null
  if (!context.blockKinds.has(kind)) {
    context.report.errors.push({ code: 'block.kind.invalid', context: `blocks row ${row.__rowNumber || '?'}`, message: `Unsupported block kind: ${kind}` })
    return null
  }
  const baseContext = `${row.pageId || 'unknown'}/${row.blockId || `row-${row.__rowNumber || '?'}`}`
  let block = null
  if (kind === 'text') block = normalizeTextBlock(row)
  else if (kind === 'callout') block = normalizeCalloutBlock(row, context.calloutDefs, context.report, baseContext)
  else if (kind === 'compare') block = normalizeCompareBlock(row, context.assetMap, context.report, baseContext)
  else if (kind === 'image') block = normalizeImageBlock(row, context.assetMap, context.report, baseContext)
  else if (kind === 'cta') block = normalizeCtaBlock(row, context.report, baseContext)
  else if (kind === 'faq') block = normalizeFaqBlock(row, context.report, baseContext)

  if (!block) return null
  block.id = block.id || `${String(row.pageId || 'page').trim()}-${kind}-${row.__rowNumber || Math.random().toString(16).slice(2)}`
  return block
}

function clonePage(page) {
  return JSON.parse(JSON.stringify(page))
}

function buildPages({ rawPageRows, rawBlockRows, basePages, assetMap, blockKinds, calloutDefs, report }) {
  const pageMap = new Map((basePages || []).map((page) => [page.id, clonePage(page)]))
  const blocksByPage = new Map()
  for (const row of rawBlockRows || []) {
    if (!enabled(row.visible) || !filled(row.pageId)) continue
    const pageId = String(row.pageId).trim()
    if (!blocksByPage.has(pageId)) blocksByPage.set(pageId, [])
    blocksByPage.get(pageId).push(row)
  }

  let upserted = 0
  let deleted = 0
  let blocksUpdatedOnly = 0

  for (const row of rawPageRows || []) {
    if (!enabled(row.visible)) continue
    const status = String(row.status ?? '').trim()
    try {
      const pageId = requireText(row.pageId, `pages row ${row.__rowNumber || '?'} pageId`)
      if (['archived', 'hidden'].includes(status)) {
        if (pageMap.delete(pageId)) deleted += 1
        continue
      }
      if (status !== 'published') continue
      const type = requireText(row.type, `page ${pageId} type`)
      if (!PAGE_TYPES.has(type)) throw new Error(`Unsupported page type: ${type}`)
      const cover = filled(row.coverAssetId) ? resolveAsset(row.coverAssetId, assetMap, report, `${pageId}.cover`) : undefined
      const slug = requireText(row.slug, `page ${pageId} slug`)
      const folder = resolvePageFolder(row, type)
      const contentDir = `${folder}/${pageId}`
      const page = {
        id: pageId,
        slug,
        type,
        title: requireText(row.title, `page ${pageId} title`),
        desc: text(row.desc),
        template: text(row.template) || type,
        tags: csvToArray(row.tags),
        featured: enabled(row.featured),
        order: toNumber(row.order, 9999),
        folder,
        contentDir,
        contentPath: `src/content/pages/${contentDir}`,
        cover: cover || undefined,
        blocks: [],
      }
      page.blocks = normalizeBlocksForPage(pageId, blocksByPage.get(pageId) || [], { assetMap, blockKinds, calloutDefs, report })
      pageMap.set(pageId, page)
      upserted += 1
    } catch (error) {
      report.errors.push({ code: 'page.normalize.failed', rowNumber: row.__rowNumber, message: error.message })
    }
  }

  // Staging-console mode: blocks can patch an already published page without repeating the page row.
  for (const [pageId, blockRows] of blocksByPage.entries()) {
    const hasPageCommand = (rawPageRows || []).some((row) => enabled(row.visible) && String(row.pageId || '').trim() === pageId)
    if (hasPageCommand) continue
    const page = pageMap.get(pageId)
    if (!page) continue
    page.blocks = normalizeBlocksForPage(pageId, blockRows, { assetMap, blockKinds, calloutDefs, report })
    blocksUpdatedOnly += 1
  }

  for (const page of pageMap.values()) {
    page.blocks.sort(byOrder)
  }
  const pages = [...pageMap.values()].sort(byOrder)
  return { pages, upserted, deleted, blocksUpdatedOnly }
}

function normalizeBlocksForPage(pageId, rows, context) {
  const out = []
  const seen = new Set()
  for (const row of rows) {
    const block = normalizeBlock(row, context)
    if (!block) continue
    if (seen.has(block.id)) {
      context.report.errors.push({ code: 'block.id.duplicate', context: pageId, message: `Duplicate block id: ${block.id}` })
      continue
    }
    seen.add(block.id)
    out.push(block)
  }
  return out.sort(byOrder)
}

function normalizeSettings(rawRows, baseSettings) {
  const settings = { ...(baseSettings || {}) }
  for (const row of rawRows || []) {
    if (!filled(row.key)) continue
    const key = String(row.key).trim()
    const value = String(row.value ?? '').trim()
    if (['commissionOpen'].includes(key)) settings[key] = enabled(value)
    else settings[key] = value
  }
  return settings
}

function assertNoForbiddenKeys(value, report, pathLabel = '$') {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, report, `${pathLabel}[${index}]`))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_PUBLIC_KEYS.has(key)) {
      report.errors.push({ code: 'public.forbiddenKey', path: `${pathLabel}.${key}`, message: `Forbidden public key: ${key}` })
    }
    assertNoForbiddenKeys(child, report, `${pathLabel}.${key}`)
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const rawDir = args.rawDir || process.env.SHEET_CMS_RAW_DIR || DEFAULT_RAW_DIR
  const driveManifestPath = args.driveManifestPath || process.env.DRIVE_ASSET_MANIFEST || DEFAULT_DRIVE_MANIFEST
  const outDir = args.outDir || process.env.SHEET_CMS_GENERATED_OUT_DIR || DEFAULT_OUT_DIR

  const generatedAt = new Date().toISOString()
  const report = {
    generatedAt,
    source: 'sheet-cms-generator',
    schemaVersion: SCHEMA_VERSION,
    lifecycle: {
      mode: 'staging-console',
      rawRetention: 'ephemeral-cache-only',
      publishedStore: 'repo-generated-json',
    },
    warnings: [],
    errors: [],
  }

  const rawPages = await readRaw(rawDir, 'pages')
  const rawBlocks = await readRaw(rawDir, 'blocks')
  const rawAssets = await readRaw(rawDir, 'assets')
  const rawSettings = await readRaw(rawDir, 'settings')
  const rawBlockEnums = await readRaw(rawDir, 'enums_block_types')
  const rawCalloutEnums = await readRaw(rawDir, 'enums_callout_types')
  const driveManifest = await maybeReadJson(driveManifestPath, { assets: [], warnings: [], errors: [] })

  const basePagesFile = await maybeReadJson(path.join(outDir, 'pages.generated.json'), { pages: [] })
  const baseAssetsFile = await maybeReadJson(path.join(outDir, 'assets.generated.json'), { assets: [] })
  const baseSettingsFile = await maybeReadJson(path.join(outDir, 'settings.generated.json'), { settings: {} })

  const blockKinds = collectEnums(rawBlockEnums.rows, BLOCK_KINDS)
  const calloutDefs = collectCalloutDefs(rawCalloutEnums.rows)

  const assetBuild = buildAssets({
    rawAssetRows: rawAssets.rows || [],
    driveManifest,
    baseAssets: baseAssetsFile.assets || [],
    report,
  })
  const assetMap = new Map(assetBuild.assets.map((asset) => [asset.assetId, asset]))

  const pageBuild = buildPages({
    rawPageRows: rawPages.rows || [],
    rawBlockRows: rawBlocks.rows || [],
    basePages: basePagesFile.pages || [],
    assetMap,
    blockKinds,
    calloutDefs,
    report,
  })

  const settings = normalizeSettings(rawSettings.rows || [], baseSettingsFile.settings || {})

  const pagesFile = {
    generatedAt,
    source: 'sheet-cms-staging-console',
    schemaVersion: SCHEMA_VERSION,
    pages: pageBuild.pages,
  }
  const assetsFile = {
    generatedAt,
    source: 'sheet-cms-staging-console',
    schemaVersion: SCHEMA_VERSION,
    assets: assetBuild.assets,
  }
  const settingsFile = {
    generatedAt,
    source: 'sheet-cms-staging-console',
    schemaVersion: SCHEMA_VERSION,
    settings,
  }
  const manifestFile = {
    generatedAt,
    source: 'sheet-cms-staging-console',
    schemaVersion: SCHEMA_VERSION,
    lifecycle: report.lifecycle,
    includedPages: pageBuild.pages.length,
    includedBlocks: pageBuild.pages.reduce((sum, page) => sum + page.blocks.length, 0),
    includedAssets: assetBuild.assets.length,
    upsertedPages: pageBuild.upserted,
    deletedPages: pageBuild.deleted,
    blockOnlyPageUpdates: pageBuild.blocksUpdatedOnly,
    upsertedAssets: assetBuild.upserted,
    warnings: report.warnings,
    errors: report.errors,
  }

  assertNoForbiddenKeys(pagesFile, report, 'pages.generated.json')
  assertNoForbiddenKeys(assetsFile, report, 'assets.generated.json')
  assertNoForbiddenKeys(settingsFile, report, 'settings.generated.json')
  manifestFile.errors = report.errors
  manifestFile.warnings = report.warnings

  await writeJson(path.join(outDir, 'pages.generated.json'), pagesFile)
  await writeJson(path.join(outDir, 'assets.generated.json'), assetsFile)
  await writeJson(path.join(outDir, 'settings.generated.json'), settingsFile)
  await writeJson(path.join(outDir, 'manifest.generated.json'), manifestFile)

  console.log(`[generate:content-json] pages: ${manifestFile.includedPages}`)
  console.log(`[generate:content-json] blocks: ${manifestFile.includedBlocks}`)
  console.log(`[generate:content-json] assets: ${manifestFile.includedAssets}`)
  console.log(`[generate:content-json] warnings: ${manifestFile.warnings.length}`)
  console.log(`[generate:content-json] errors: ${manifestFile.errors.length}`)

  if (manifestFile.errors.length > 0) {
    for (const error of manifestFile.errors) {
      console.error(`[error:${error.code}] ${error.message}`)
    }
    process.exit(1)
  }

  console.log('[generate:content-json] success')
}

main().catch((error) => {
  console.error(`[generate:content-json] failed: ${error.message}`)
  process.exit(1)
})
