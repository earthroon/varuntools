#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { readJson, writeJson } from './lib/write-json.mjs'

const DEFAULT_GENERATED_DIR = 'src/content/generated'
const SCHEMA_VERSION = '1.0.0'
const PAGE_TYPES = new Set(['page', 'work', 'commission', 'product', 'catalog', 'doc', 'lab', 'tool'])
const BLOCK_KINDS = new Set(['text', 'callout', 'compare', 'image', 'cta', 'faq'])
const CALLOUT_TYPES = new Set(['note', 'tip', 'warning', 'danger', 'ssot', 'decision', 'quote'])
const ASSET_TYPES = new Set(['image', 'video', 'file', 'embed'])
const CTA_VARIANTS = new Set(['primary', 'secondary', 'ghost'])
const FORBIDDEN_PUBLIC_KEYS = new Set([
  'driveFileId',
  'memo',
  'internalMemo',
  'privateNote',
  'adminOnly',
  'GOOGLE_SERVICE_ACCOUNT_JSON',
  'GITHUB_DISPATCH_TOKEN',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'serviceAccount',
  'private_key',
  'client_email',
  'spreadsheetId',
  'spreadsheetUrl',
])

function parseArgs(argv) {
  const out = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--dir') out.generatedDir = argv[++index]
    else if (arg === '--report') out.reportPath = argv[++index]
    else if (arg === '--strict') out.strict = true
  }
  return out
}

function createReport() {
  return {
    generatedAt: new Date().toISOString(),
    source: 'validate:generated-content',
    schemaVersion: SCHEMA_VERSION,
    status: 'unknown',
    checked: {
      pages: 0,
      blocks: 0,
      assets: 0,
    },
    warnings: [],
    errors: [],
  }
}

function addError(report, code, message, details = {}) {
  report.errors.push({ code, message, ...details })
}

function addWarning(report, code, message, details = {}) {
  report.warnings.push({ code, message, ...details })
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function filled(value) {
  return String(value ?? '').trim().length > 0
}

function isString(value) {
  return typeof value === 'string'
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function isBoolean(value) {
  return typeof value === 'boolean'
}

async function readRequiredJson(generatedDir, name, report) {
  const filePath = path.join(generatedDir, name)
  try {
    return await readJson(filePath)
  } catch (error) {
    if (error.code === 'ENOENT') {
      addError(report, 'file.missing', `Missing generated file: ${name}`, { file: filePath })
      return null
    }
    addError(report, 'json.parse.failed', `Failed to parse generated JSON: ${name}. ${error.message}`, { file: filePath })
    return null
  }
}

function validateTopLevel(file, fileName, arrayKey, report) {
  if (!isObject(file)) {
    addError(report, 'schema.topLevel.invalid', `${fileName} must be an object.`, { file: fileName })
    return false
  }
  for (const key of ['generatedAt', 'source', 'schemaVersion', arrayKey]) {
    if (!(key in file)) addError(report, 'schema.topLevel.missingKey', `${fileName} is missing top-level key: ${key}`, { file: fileName, key })
  }
  if (!Array.isArray(file[arrayKey])) {
    addError(report, 'schema.topLevel.invalidArray', `${fileName}.${arrayKey} must be an array.`, { file: fileName, key: arrayKey })
    return false
  }
  return true
}

function validateSettingsTopLevel(settingsFile, report) {
  if (!isObject(settingsFile)) {
    addError(report, 'schema.settings.invalid', 'settings.generated.json must be an object.')
    return false
  }
  for (const key of ['generatedAt', 'source', 'schemaVersion', 'settings']) {
    if (!(key in settingsFile)) addError(report, 'schema.settings.missingKey', `settings.generated.json is missing top-level key: ${key}`, { key })
  }
  if (!isObject(settingsFile.settings)) {
    addError(report, 'schema.settings.invalidObject', 'settings.generated.json.settings must be an object.')
    return false
  }
  return true
}

function validateManifest(manifestFile, actualCounts, report) {
  if (!isObject(manifestFile)) {
    addError(report, 'schema.manifest.invalid', 'manifest.generated.json must be an object.')
    return
  }
  for (const key of ['generatedAt', 'source', 'schemaVersion', 'includedPages', 'includedBlocks', 'includedAssets', 'warnings', 'errors']) {
    if (!(key in manifestFile)) addError(report, 'schema.manifest.missingKey', `manifest.generated.json is missing top-level key: ${key}`, { key })
  }
  const expected = {
    includedPages: actualCounts.pages,
    includedBlocks: actualCounts.blocks,
    includedAssets: actualCounts.assets,
  }
  for (const [key, value] of Object.entries(expected)) {
    if (manifestFile[key] !== value) {
      addError(report, 'manifest.countMismatch', `${key} mismatch. manifest=${manifestFile[key]} actual=${value}`, { key, manifestValue: manifestFile[key], actualValue: value })
    }
  }
}

function findForbiddenKeys(value, report, pathLabel = '$') {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((item, index) => findForbiddenKeys(item, report, `${pathLabel}[${index}]`))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_PUBLIC_KEYS.has(key)) {
      addError(report, 'publicLeak.forbiddenKey', `Forbidden key found in public generated JSON: ${key}`, { path: `${pathLabel}.${key}`, key })
    }
    findForbiddenKeys(child, report, `${pathLabel}.${key}`)
  }
}

function validateSlug(slug, pageId, report) {
  if (!filled(slug)) {
    addError(report, 'page.slug.missing', `Page slug is required: ${pageId}`, { pageId })
    return
  }
  if (slug !== slug.trim()) addError(report, 'page.slug.whitespace', `Page slug has surrounding whitespace: ${slug}`, { pageId, slug })
  const badPatterns = ['//', '..', '\\', '#', '?']
  for (const pattern of badPatterns) {
    if (slug.includes(pattern)) addError(report, 'page.slug.unsafe', `Page slug contains unsafe pattern "${pattern}": ${slug}`, { pageId, slug, pattern })
  }
  if (/^https?:\/\//i.test(slug)) addError(report, 'page.slug.absoluteUrl', `Page slug must not be an absolute URL: ${slug}`, { pageId, slug })
  if (!/^[a-z0-9][a-z0-9/-]*$/.test(slug)) {
    addWarning(report, 'page.slug.nonCanonical', `Page slug is not canonical lowercase path: ${slug}`, { pageId, slug })
  }
}

function validateAssetSrc(asset, report) {
  const src = asset?.src
  if (!filled(src)) {
    addError(report, 'asset.src.missing', `Asset src is required: ${asset?.assetId || 'unknown'}`, { assetId: asset?.assetId })
    return
  }
  if (/^file:/i.test(src) || /^[A-Za-z]:\\/.test(src) || src.includes('../')) {
    addError(report, 'asset.src.unsafe', `Asset src is unsafe: ${src}`, { assetId: asset.assetId, src })
  }
  if (/drive\.google\.com|docs\.google\.com/i.test(src)) {
    addError(report, 'asset.src.driveUrlLeak', `Asset src must not be a Google Drive/Docs URL: ${src}`, { assetId: asset.assetId, src })
  }
  const allowed = src.startsWith('/assets/generated/') || src.startsWith('/images/') || src.startsWith('./images/') || src.startsWith('./media/') || /^https:\/\//i.test(src)
  if (!allowed) addWarning(report, 'asset.src.nonCanonical', `Asset src is not in a canonical public location: ${src}`, { assetId: asset.assetId, src })
}

function validateAssets(assets, report) {
  const assetMap = new Map()
  const referenced = new Set()
  for (const asset of assets) {
    if (!isObject(asset)) {
      addError(report, 'asset.invalid', 'Asset must be an object.')
      continue
    }
    const assetId = asset.assetId
    if (!filled(assetId)) {
      addError(report, 'asset.id.missing', 'assetId is required.')
      continue
    }
    if (assetMap.has(assetId)) addError(report, 'asset.id.duplicate', `Duplicated assetId: ${assetId}`, { assetId })
    assetMap.set(assetId, asset)
    if (!ASSET_TYPES.has(asset.type)) addError(report, 'asset.type.invalid', `Invalid asset type for ${assetId}: ${asset.type}`, { assetId, type: asset.type })
    validateAssetSrc(asset, report)
    if (asset.type === 'image' && !filled(asset.alt)) addWarning(report, 'asset.alt.missing', `Image asset alt is blank: ${assetId}`, { assetId })
  }
  return { assetMap, referenced }
}

function validateGeneratedAssetRef(ref, assetMap, report, context) {
  if (!isObject(ref)) {
    addError(report, 'assetRef.invalid', `Asset ref must be an object: ${context}`, { context })
    return null
  }
  if (!filled(ref.assetId)) {
    addError(report, 'assetRef.assetId.missing', `Asset ref assetId is required: ${context}`, { context })
    return null
  }
  const asset = assetMap.get(ref.assetId)
  if (!asset) {
    addError(report, 'assetRef.notFound', `Asset ref not found: ${ref.assetId}`, { context, assetId: ref.assetId })
    return null
  }
  if (!filled(ref.src)) addError(report, 'assetRef.src.missing', `Asset ref src is blank: ${context}`, { context, assetId: ref.assetId })
  return asset
}

function validateUrl(url, report, context) {
  if (!filled(url)) {
    addError(report, 'url.missing', `URL is required: ${context}`, { context })
    return
  }
  const source = String(url).trim()
  if (/^(javascript|data):/i.test(source)) addError(report, 'url.unsafeProtocol', `Unsafe URL protocol: ${source}`, { context, url: source })
  const allowed = source.startsWith('/') || /^https:\/\//i.test(source) || /^mailto:/i.test(source)
  if (!allowed) addWarning(report, 'url.nonCanonical', `URL is not a canonical internal/https/mailto URL: ${source}`, { context, url: source })
}

function validateTextBlock(block, report, context) {
  if (!filled(block.body)) addError(report, 'block.text.body.missing', `Text block body is required: ${context}`, { context })
}

function validateCalloutBlock(block, report, context) {
  if (!CALLOUT_TYPES.has(block.type)) addError(report, 'block.callout.type.invalid', `Invalid callout type: ${block.type}`, { context, type: block.type })
  if (!filled(block.body)) addError(report, 'block.callout.body.missing', `Callout body is required: ${context}`, { context })
  if (!isBoolean(block.collapsible)) addError(report, 'block.callout.collapsible.invalid', `Callout collapsible must be boolean: ${context}`, { context })
  if (!isBoolean(block.defaultOpen)) addError(report, 'block.callout.defaultOpen.invalid', `Callout defaultOpen must be boolean: ${context}`, { context })
}

function validateCompareBlock(block, assetMap, referenced, report, context) {
  const before = validateGeneratedAssetRef(block.before, assetMap, report, `${context}.before`)
  const after = validateGeneratedAssetRef(block.after, assetMap, report, `${context}.after`)
  if (before) referenced.add(before.assetId)
  if (after) referenced.add(after.assetId)
  if (!isNumber(block.initial) || block.initial < 0 || block.initial > 100) {
    addError(report, 'block.compare.initial.invalid', `Compare initial must be between 0 and 100: ${context}`, { context, initial: block.initial })
  }
  if (before && before.type !== 'image') addWarning(report, 'block.compare.before.notImage', `Compare before asset is not image: ${context}`, { context, assetId: before.assetId, type: before.type })
  if (after && after.type !== 'image') addWarning(report, 'block.compare.after.notImage', `Compare after asset is not image: ${context}`, { context, assetId: after.assetId, type: after.type })
}

function validateImageBlock(block, assetMap, referenced, report, context) {
  const image = validateGeneratedAssetRef(block.image, assetMap, report, `${context}.image`)
  if (image) referenced.add(image.assetId)
}

function validateCtaBlock(block, report, context) {
  if (!filled(block.buttonLabel)) addError(report, 'block.cta.label.missing', `CTA buttonLabel is required: ${context}`, { context })
  if (!filled(block.buttonUrl)) addError(report, 'block.cta.url.missing', `CTA buttonUrl is required: ${context}`, { context })
  else validateUrl(block.buttonUrl, report, `${context}.buttonUrl`)
  if (block.variant && !CTA_VARIANTS.has(block.variant)) addError(report, 'block.cta.variant.invalid', `Invalid CTA variant: ${block.variant}`, { context, variant: block.variant })
  if (['클릭', '더보기', '바로가기'].includes(String(block.buttonLabel || '').trim())) {
    addWarning(report, 'a11y.cta.weakLabel', `CTA label is vague: ${block.buttonLabel}`, { context, buttonLabel: block.buttonLabel })
  }
}

function validateFaqBlock(block, report, context) {
  if (!filled(block.question)) addError(report, 'block.faq.question.missing', `FAQ question is required: ${context}`, { context })
  if (!filled(block.answer)) addError(report, 'block.faq.answer.missing', `FAQ answer is required: ${context}`, { context })
}

function validateBlock(block, page, assetMap, referenced, report) {
  const context = `${page.id}/${block?.id || 'unknown'}`
  if (!isObject(block)) {
    addError(report, 'block.invalid', `Block must be an object: ${context}`, { pageId: page.id })
    return
  }
  if (!filled(block.id)) addError(report, 'block.id.missing', `Block id is required: ${context}`, { context })
  if (!BLOCK_KINDS.has(block.kind)) {
    addError(report, 'block.kind.unsupported', `Unsupported block kind: ${block.kind}`, { context, kind: block.kind })
    return
  }
  if (!isNumber(block.order)) addError(report, 'block.order.invalid', `Block order must be a number: ${context}`, { context })
  if (block.kind === 'text') validateTextBlock(block, report, context)
  else if (block.kind === 'callout') validateCalloutBlock(block, report, context)
  else if (block.kind === 'compare') validateCompareBlock(block, assetMap, referenced, report, context)
  else if (block.kind === 'image') validateImageBlock(block, assetMap, referenced, report, context)
  else if (block.kind === 'cta') validateCtaBlock(block, report, context)
  else if (block.kind === 'faq') validateFaqBlock(block, report, context)
}

function validatePages(pages, assetMap, referenced, report) {
  const pageIds = new Set()
  const slugs = new Set()
  let blockCount = 0

  for (const page of pages) {
    if (!isObject(page)) {
      addError(report, 'page.invalid', 'Page must be an object.')
      continue
    }
    const pageId = page.id
    if (!filled(pageId)) addError(report, 'page.id.missing', 'Page id is required.')
    else if (pageIds.has(pageId)) addError(report, 'page.id.duplicate', `Duplicated page id: ${pageId}`, { pageId })
    else pageIds.add(pageId)

    if (!PAGE_TYPES.has(page.type)) addError(report, 'page.type.invalid', `Invalid page type for ${pageId}: ${page.type}`, { pageId, type: page.type })
    validateSlug(page.slug, pageId, report)
    if (filled(page.slug)) {
      if (slugs.has(page.slug)) addError(report, 'page.slug.duplicate', `Duplicated page slug: ${page.slug}`, { pageId, slug: page.slug })
      else slugs.add(page.slug)
    }
    if (!filled(page.title)) addError(report, 'page.title.missing', `Page title is required: ${pageId}`, { pageId })
    if (!filled(page.template)) addError(report, 'page.template.missing', `Page template is required: ${pageId}`, { pageId })
    if (!Array.isArray(page.tags)) addError(report, 'page.tags.invalid', `Page tags must be an array: ${pageId}`, { pageId })
    if (!isBoolean(page.featured)) addError(report, 'page.featured.invalid', `Page featured must be boolean: ${pageId}`, { pageId })
    if (!isNumber(page.order)) addError(report, 'page.order.invalid', `Page order must be number: ${pageId}`, { pageId })
    if (!Array.isArray(page.blocks)) addError(report, 'page.blocks.invalid', `Page blocks must be an array: ${pageId}`, { pageId })
    else if (!page.blocks.length) addWarning(report, 'page.blocks.empty', `Public page has no blocks: ${pageId}`, { pageId })
    if (!filled(page.desc)) addWarning(report, 'seo.page.desc.missing', `Page desc is blank: ${pageId}`, { pageId })
    if (['work', 'product', 'commission'].includes(page.type) && !page.cover) addWarning(report, 'seo.page.cover.missing', `Page cover is blank: ${pageId}`, { pageId })
    if (page.cover) {
      const cover = validateGeneratedAssetRef(page.cover, assetMap, report, `${pageId}.cover`)
      if (cover) referenced.add(cover.assetId)
    }

    const blockIds = new Set()
    for (const block of page.blocks || []) {
      blockCount += 1
      if (filled(block?.id)) {
        if (blockIds.has(block.id)) addError(report, 'block.id.duplicate', `Duplicated block id in page ${pageId}: ${block.id}`, { pageId, blockId: block.id })
        else blockIds.add(block.id)
      }
      validateBlock(block, page, assetMap, referenced, report)
    }
  }

  return blockCount
}

function validateUnusedAssets(assetMap, referenced, report) {
  for (const asset of assetMap.values()) {
    if (referenced.has(asset.assetId)) continue
    if (['og', 'reserved'].includes(asset.role)) continue
    addWarning(report, 'asset.unused', `Generated asset is not referenced by any page/block: ${asset.assetId}`, { assetId: asset.assetId })
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const generatedDir = args.generatedDir || process.env.SHEET_CMS_GENERATED_OUT_DIR || DEFAULT_GENERATED_DIR
  const reportPath = args.reportPath || process.env.SHEET_CMS_VALIDATION_REPORT || path.join(generatedDir, 'validation.generated.json')
  const strict = args.strict || String(process.env.SHEET_CMS_STRICT ?? '').toLowerCase() === 'true'
  const report = createReport()

  const pagesFile = await readRequiredJson(generatedDir, 'pages.generated.json', report)
  const assetsFile = await readRequiredJson(generatedDir, 'assets.generated.json', report)
  const settingsFile = await readRequiredJson(generatedDir, 'settings.generated.json', report)
  const manifestFile = await readRequiredJson(generatedDir, 'manifest.generated.json', report)

  if (pagesFile) validateTopLevel(pagesFile, 'pages.generated.json', 'pages', report)
  if (assetsFile) validateTopLevel(assetsFile, 'assets.generated.json', 'assets', report)
  if (settingsFile) validateSettingsTopLevel(settingsFile, report)

  const pages = Array.isArray(pagesFile?.pages) ? pagesFile.pages : []
  const assets = Array.isArray(assetsFile?.assets) ? assetsFile.assets : []
  report.checked.pages = pages.length
  report.checked.assets = assets.length

  findForbiddenKeys(pagesFile, report, 'pages.generated.json')
  findForbiddenKeys(assetsFile, report, 'assets.generated.json')
  findForbiddenKeys(settingsFile, report, 'settings.generated.json')
  findForbiddenKeys(manifestFile, report, 'manifest.generated.json')

  const { assetMap, referenced } = validateAssets(assets, report)
  const blockCount = validatePages(pages, assetMap, referenced, report)
  report.checked.blocks = blockCount
  validateUnusedAssets(assetMap, referenced, report)
  if (manifestFile) validateManifest(manifestFile, report.checked, report)

  if (strict && report.warnings.length) {
    addError(report, 'strict.warningsRejected', `Strict mode rejected ${report.warnings.length} warnings.`)
  }

  report.status = report.errors.length ? 'failed' : 'success'
  await writeJson(reportPath, report)

  console.log(`[validate:generated-content] pages: ${report.checked.pages}`)
  console.log(`[validate:generated-content] blocks: ${report.checked.blocks}`)
  console.log(`[validate:generated-content] assets: ${report.checked.assets}`)
  console.log(`[validate:generated-content] warnings: ${report.warnings.length}`)
  console.log(`[validate:generated-content] errors: ${report.errors.length}`)
  for (const warning of report.warnings) console.warn(`[warning:${warning.code}] ${warning.message}`)
  for (const error of report.errors) console.error(`[error:${error.code}] ${error.message}`)

  if (report.errors.length) {
    console.error('[validate:generated-content] failed')
    process.exit(1)
  }
  console.log('[validate:generated-content] success')
}

main().catch((error) => {
  console.error(`[validate:generated-content] failed: ${error.message}`)
  process.exit(1)
})
