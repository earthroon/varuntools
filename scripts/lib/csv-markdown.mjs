import { parseOptionString, parseMetaString } from './csv-options.mjs'
import { diagnosticsToLegacyMessages } from './csv-diagnostics.mjs'
import { validateCsvRows, summarizeCsvRows } from './csv-block-schema.mjs'
import { validateCsvAssetReferences, summarizeAssetReferences } from './csv-asset-guard.mjs'
import { validatePortfolioLinks, summarizePortfolioLinks } from './portfolio-link-guard.mjs'

const REQUIRED_COLUMNS = ['block', 'title', 'body', 'src', 'alt', 'caption', 'thumb', 'layout', 'kind', 'options', 'meta']
const BOX_KINDS = new Set(['note', 'tip', 'warning', 'danger', 'quote', 'decision', 'ssot'])
const HEADING_LEVELS = { h1: '#', h2: '##', h3: '###', h4: '####' }
const VALID_PRODUCT_TYPES = new Set(['physical', 'digital', 'service', 'bundle', 'external'])
const VALID_PRODUCT_STATUSES = new Set(['draft', 'coming-soon', 'available', 'sold-out', 'hidden'])
const PRODUCT_OPTION_STRING_FIELDS = [
  'slug',
  'sku',
  'currency',
  'stock',
  'checkoutProvider',
  'checkoutMode',
  'successUrl',
  'failUrl',
  'claimRedirect',
  'checkoutUrl',
  'externalStoreUrl',
  'externalUrl',
  'downloadProvider',
  'downloadUrl',
  'license',
  'category',
  'subcategory',
  'series',
  'collection',
  'material',
  'size',
  'releaseDate',
  'shippingNote',
  'refundNote',
  'digitalDeliveryNote',
  'policyNote',
  'inquiryUrl',
]

function asString(value) {
  return String(value ?? '').trim()
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function escapeYamlString(value) {
  return String(value ?? '').replaceAll('"', '\\"')
}

function renderYamlValue(value, indent = '') {
  if (Array.isArray(value)) {
    if (!value.length) return `${indent}[]`
    return value.map((item) => `${indent}- ${renderInlineYamlValue(item)}`).join('\n')
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).map(([key, nested]) => {
      if (nested && typeof nested === 'object') {
        return `${indent}${key}:\n${renderYamlValue(nested, `${indent}  `)}`
      }
      return `${indent}${key}: ${renderInlineYamlValue(nested)}`
    }).join('\n')
  }
  return `${indent}${renderInlineYamlValue(value)}`
}

function renderInlineYamlValue(value) {
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value === null || value === undefined || value === '') return '""'
  const text = String(value)
  if (/^[A-Za-z0-9_./:-]+$/.test(text)) return text
  return `"${escapeYamlString(text)}"`
}


function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isEmptyFrontmatterValue(value) {
  if (value === undefined) return true
  if (value === null) return false
  if (Array.isArray(value)) return value.length === 0
  if (isPlainObject(value)) return Object.keys(value).length === 0
  return typeof value === 'string' && value.trim() === ''
}

function pruneEmptyFrontmatter(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => pruneEmptyFrontmatter(item))
      .filter((item) => !isEmptyFrontmatterValue(item))
  }
  if (isPlainObject(value)) {
    const output = {}
    for (const [key, nested] of Object.entries(value)) {
      const next = pruneEmptyFrontmatter(nested)
      if (!isEmptyFrontmatterValue(next)) output[key] = next
    }
    return output
  }
  return value
}

function setIfPresent(target, key, value) {
  const cleaned = pruneEmptyFrontmatter(value)
  if (!isEmptyFrontmatterValue(cleaned)) target[key] = cleaned
}

function toStringList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item ?? '').trim()).filter(Boolean)
  if (isPlainObject(value)) return Object.values(value).map((item) => String(item ?? '').trim()).filter(Boolean)
  return String(value ?? '').split('|').map((item) => item.trim()).filter(Boolean)
}

function toNumberOrUndefined(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const text = asString(value)
  if (!text) return undefined
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toBooleanOrUndefined(value) {
  if (typeof value === 'boolean') return value
  if (String(value).toLowerCase() === 'true') return true
  if (String(value).toLowerCase() === 'false') return false
  return undefined
}

function mergeObjects(base = {}, next = {}) {
  const output = { ...base }
  for (const [key, value] of Object.entries(next || {})) {
    if (value === undefined) continue
    if (isPlainObject(value) && isPlainObject(output[key])) output[key] = mergeObjects(output[key], value)
    else output[key] = value
  }
  return output
}

function normalizeWorkMetadata(input = {}) {
  const work = {}
  for (const key of ['type', 'status', 'period', 'client', 'category', 'summary']) setIfPresent(work, key, asString(input[key]))
  setIfPresent(work, 'featured', toBooleanOrUndefined(input.featured))
  setIfPresent(work, 'weight', toNumberOrUndefined(input.weight))
  setIfPresent(work, 'year', toNumberOrUndefined(input.year))
  for (const key of ['role', 'stack', 'tools', 'tags']) setIfPresent(work, key, toStringList(input[key]))

  const mood = mergeObjects(input.mood || {}, {
    tone: input.tone,
    density: input.density,
    color: input.color,
  })
  setIfPresent(work, 'mood', {
    tone: asString(mood.tone),
    density: asString(mood.density),
    color: asString(mood.color),
  })
  setIfPresent(work, 'links', {
    demo: input.links?.demo ?? input.demo,
    repo: input.links?.repo ?? input.repo,
    caseStudy: input.links?.caseStudy ?? input.caseStudy,
  })
  return pruneEmptyFrontmatter(work)
}

function pickPortfolioHeroFallback(rows = []) {
  const heroRow = rows.find((row) => asString(row.block) === 'portfolio-hero')
  if (!heroRow) return {}
  const options = parseOptionString(heroRow.options)
  return normalizeWorkMetadata({
    type: asString(heroRow.kind) || 'case-study',
    status: options.status,
    featured: options.featured,
    weight: options.weight,
    year: options.year,
    period: options.period,
    client: options.client,
    role: options.role,
    stack: options.stack,
    tools: options.tools,
    tags: options.tags,
    category: options.category,
    summary: options.summary || heroRow.body,
    tone: options.tone,
    density: options.density,
  })
}

function buildLegacyWorkMetadata(pageRow, pageOptions, shouldUseLegacy) {
  if (!shouldUseLegacy) return {}
  return normalizeWorkMetadata({
    type: pageOptions.kind === 'work' || pageRow.kind === 'work' ? 'case-study' : pageOptions.type,
    status: pageOptions.status,
    featured: pageOptions.featured,
    weight: pageOptions.weight,
    year: pageOptions.year,
    period: pageOptions.period,
    client: pageOptions.client,
    role: pageOptions.role,
    stack: pageOptions.stack,
    tools: pageOptions.tools,
    tags: pageOptions.tags,
    category: pageOptions.category,
    summary: pageOptions.summary,
    mood: pageOptions.mood,
  })
}

function buildWorkFrontmatter(rows, pageRow, pageOptions, context) {
  const explicit = normalizeWorkMetadata(pageOptions.work || {})
  const hasExplicit = Object.keys(explicit).length > 0
  const heroFallback = pickPortfolioHeroFallback(rows)
  const hasHeroFallback = Object.keys(heroFallback).length > 0
  const pageLooksLikeWork = asString(pageOptions.kind) === 'work' || asString(pageRow.kind) === 'work' || asString(pageOptions.work?.type)
  const legacy = buildLegacyWorkMetadata(pageRow, pageOptions, hasExplicit || hasHeroFallback || pageLooksLikeWork)
  let work = mergeObjects(heroFallback, legacy)
  work = mergeObjects(work, explicit)
  work = pruneEmptyFrontmatter(work)

  if (!Object.keys(work).length) return null

  const validTypes = new Set(['case-study', 'tool', 'visual', 'service', 'experiment', 'store', 'system'])
  const validStatuses = new Set(['draft', 'published', 'archived', 'private'])
  if (work.type && !validTypes.has(work.type)) context.warnings.push(`line ${pageRow.__line}: work.type should be one of case-study, tool, visual, service, experiment, store, system`)
  if (work.status && !validStatuses.has(work.status)) context.warnings.push(`line ${pageRow.__line}: work.status should be one of draft, published, archived, private`)
  return work
}

function normalizeProductOptions(row, context) {
  const options = parseOptionString(row.options)
  const type = asString(options.type) || 'physical'
  const status = asString(options.status) || 'coming-soon'

  if (!VALID_PRODUCT_TYPES.has(type)) context.warnings.push(`line ${row.__line}: product.type should be one of physical, digital, service, bundle, external`)
  if (!VALID_PRODUCT_STATUSES.has(status)) context.warnings.push(`line ${row.__line}: product.status should be one of draft, coming-soon, available, sold-out, hidden`)
  if (status === 'available' && !asString(options.checkoutUrl) && !asString(options.externalStoreUrl) && !asString(options.inquiryUrl)) {
    context.warnings.push(`line ${row.__line}: available product should set checkoutUrl, externalStoreUrl, or inquiryUrl`)
  }
  if (type === 'service' && status === 'available' && options.priceVisible === false && !asString(options.inquiryUrl) && !asString(options.checkoutUrl) && !asString(options.externalStoreUrl)) {
    context.warnings.push(`line ${row.__line}: inquiry service should set inquiryUrl when priceVisible=false`)
  }
  if (type === 'digital' && status === 'available' && !asString(options.downloadUrl)) {
    context.warnings.push(`line ${row.__line}: available digital product should set downloadUrl for Cloudflare delivery`)
  }

  const product = {
    type,
    status,
    price: hasOwn(options, 'price') ? options.price : 0,
    priceVisible: hasOwn(options, 'priceVisible') ? Boolean(options.priceVisible) : true,
    shippingRequired: hasOwn(options, 'shippingRequired') ? Boolean(options.shippingRequired) : type === 'physical',
    showWhenUnavailable: hasOwn(options, 'showWhenUnavailable') ? Boolean(options.showWhenUnavailable) : true,
    isDemo: hasOwn(options, 'isDemo') ? Boolean(options.isDemo) : false,
    readyForCatalog: hasOwn(options, 'readyForCatalog') ? Boolean(options.readyForCatalog) : false,
  }

  for (const field of PRODUCT_OPTION_STRING_FIELDS) {
    if (hasOwn(options, field)) product[field] = asString(options[field])
  }

  if (!hasOwn(product, 'currency')) product.currency = 'KRW'
  if (!hasOwn(product, 'stock')) product.stock = 'unknown'
  if (!hasOwn(product, 'checkoutProvider')) product.checkoutProvider = 'none'
  if (!hasOwn(product, 'checkoutMode')) product.checkoutMode = 'disabled'
  if (!hasOwn(product, 'successUrl')) product.successUrl = ''
  if (!hasOwn(product, 'failUrl')) product.failUrl = ''
  if (!hasOwn(product, 'claimRedirect')) product.claimRedirect = '/claim'
  if (!hasOwn(product, 'downloadProvider')) product.downloadProvider = 'cloudflare'

  return product
}

function renderFrontmatter(row, context, productRow = null, rows = []) {
  const options = parseOptionString(row.options)
  const title = asString(row.title)
  const description = asString(row.body)
  const cover = asString(row.src)
  const thumbnail = asString(row.thumb) || cover

  if (!title) context.errors.push(`line ${row.__line}: page title is required`)
  if (!description) context.warnings.push(`line ${row.__line}: page description is recommended`)

  const data = { title, description, thumbnail }
  if (cover) data.cover = cover
  Object.assign(data, options)
  const work = buildWorkFrontmatter(rows, row, options, context)
  if (work) data.work = work
  if (productRow) data.product = normalizeProductOptions(productRow, context)

  const cleanedData = pruneEmptyFrontmatter(data)
  const lines = ['---']
  for (const [key, value] of Object.entries(cleanedData)) {
    if (value && typeof value === 'object') {
      lines.push(`${key}:`)
      lines.push(renderYamlValue(value, '  '))
    } else {
      lines.push(`${key}: ${renderInlineYamlValue(value)}`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}

function renderHeading(row) {
  const kind = asString(row.kind) || 'h2'
  const marker = HEADING_LEVELS[kind] || HEADING_LEVELS.h2
  return `${marker} ${asString(row.title) || 'Untitled'}`
}

function renderParagraph(row) { return asString(row.body) }

function renderBox(row) {
  const kind = BOX_KINDS.has(asString(row.kind)) ? asString(row.kind) : 'note'
  return ['::markdown-box', `type: ${kind}`, `title: ${asString(row.title) || 'Note'}`, '::', asString(row.body), '::'].join('\n')
}

function renderImage(row, context) {
  const src = asString(row.src)
  const alt = asString(row.alt)
  const caption = asString(row.caption)
  if (!src) context.errors.push(`line ${row.__line}: image src is required`)
  if (!alt) context.warnings.push(`line ${row.__line}: image alt is recommended`)
  if (!caption) context.warnings.push(`line ${row.__line}: image caption is recommended`)
  const title = caption ? ` "${caption.replaceAll('"', '&quot;')}"` : ''
  return `![${alt || 'Image'}](${src}${title})`
}

function renderSectionGap() { return ['::section-gap', '::'].join('\n') }

function renderProductCta() { return ['::product-cta', '::'].join('\n') }

function renderProductTrust() { return ['::product-trust', '::'].join('\n') }

function renderBeforeAfter(row, context) {
  const options = parseOptionString(row.options)
  const before = asString(row.src)
  const after = asString(options.after)
  if (!before) context.errors.push(`line ${row.__line}: before-after src is required and maps to before`)
  if (!after) context.errors.push(`line ${row.__line}: before-after options.after is required`)
  const lines = ['::before-after', `before: ${before}`, `after: ${after}`]
  if (asString(row.caption)) lines.push(`caption: ${asString(row.caption)}`)
  if (options.initial !== undefined) lines.push(`initial: ${options.initial}`)
  lines.push('::')
  return lines.join('\n')
}

function renderVideo(row, context) {
  const options = parseOptionString(row.options)
  const src = asString(row.src)
  const poster = asString(row.thumb)
  if (!src) context.errors.push(`line ${row.__line}: video src is required`)
  if (!poster) context.warnings.push(`line ${row.__line}: video poster is recommended`)
  if (options.autoplay === true && options.muted !== true) context.warnings.push(`line ${row.__line}: autoplay=true should also set muted=true`)
  const lines = ['::video-player', `src: ${src}`]
  if (poster) lines.push(`poster: ${poster}`)
  if (asString(row.title)) lines.push(`title: ${asString(row.title)}`)
  if (asString(row.caption)) lines.push(`caption: ${asString(row.caption)}`)
  for (const [key, value] of Object.entries(options)) lines.push(`${key}: ${value}`)
  lines.push('::')
  return lines.join('\n')
}

function renderGalleryBlock(startRow, itemRows, context) {
  const options = parseOptionString(startRow.options)
  const layout = asString(startRow.layout) || 'strip'
  if (!itemRows.length) context.warnings.push(`line ${startRow.__line}: gallery has no items`)
  const lines = ['::gallery-strip']
  if (asString(startRow.title)) lines.push(`title: ${asString(startRow.title)}`)
  if (asString(startRow.body)) lines.push(`caption: ${asString(startRow.body)}`)
  lines.push(`layout: ${layout}`)
  for (const [key, value] of Object.entries(options)) lines.push(`${key}: ${value}`)
  lines.push('::')
  for (const item of itemRows) {
    const src = asString(item.src)
    const caption = asString(item.caption)
    const thumb = asString(item.thumb)
    const meta = asString(item.meta)
    if (!src) context.errors.push(`line ${item.__line}: gallery-item src is required`)
    const parts = [src, caption, thumb]
    if (meta) parts.push(meta)
    lines.push(`- ${parts.join(' | ')}`)
  }
  lines.push('::')
  return lines.join('\n')
}


function isEmptyOptionValue(value) {
  if (Array.isArray(value)) return value.length === 0
  if (value && typeof value === 'object') return Object.keys(value).length === 0
  return !asString(value)
}

function asList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item ?? '').trim()).filter(Boolean)
  if (value && typeof value === 'object') return Object.entries(value).map(([key, item]) => `${key}: ${String(item ?? '').trim()}`).filter(Boolean)
  return String(value ?? '').split('|').map((item) => item.trim()).filter(Boolean)
}

function renderMarkdownList(label, value) {
  const items = asList(value)
  if (!items.length) return []
  return [`**${label}**`, ...items.map((item) => `- ${item}`)]
}

function renderOptionSummary(options, labels = {}) {
  const lines = []
  for (const [key, value] of Object.entries(options || {})) {
    if (isEmptyOptionValue(value)) continue
    const label = labels[key] || key
    if (Array.isArray(value) || (value && typeof value === 'object')) {
      lines.push(...renderMarkdownList(label, value))
    } else {
      lines.push(`**${label}:** ${String(value)}`)
    }
  }
  return lines
}

function renderMarkdownBoxBlock({ type = 'note', title = 'Note', body = '', tone = '', extraLines = [] }) {
  const lines = ['::markdown-box', `type: ${type}`, `title: ${title}`]
  if (tone) lines.push(`tone: ${tone}`)
  lines.push('::')
  const content = [body, ...extraLines].filter((line) => String(line ?? '').trim()).join('\n\n')
  if (content) lines.push(content)
  lines.push('::')
  return lines.join('\n')
}

function directiveValue(value) {
  if (value === undefined || value === null) return ''
  if (Array.isArray(value) || (value && typeof value === 'object')) return JSON.stringify(value)
  return String(value)
}

function addDirectiveField(lines, key, value) {
  const cleaned = directiveValue(value).trim()
  if (!cleaned) return
  lines.push(`${key}: ${cleaned}`)
}

function renderPortfolioDirective(name, attrs = {}, body = '') {
  const lines = [`::${name}`]
  for (const [key, value] of Object.entries(attrs)) addDirectiveField(lines, key, value)
  lines.push('::')
  if (String(body ?? '').trim()) lines.push(String(body).trim())
  lines.push('::')
  return lines.join('\n')
}

function jsonField(value) {
  const items = asList(value)
  return items.length ? items : undefined
}

function renderPortfolioHero(row) {
  const options = parseOptionString(row.options)
  const title = asString(row.title) || 'Portfolio Case Study'
  return renderPortfolioDirective('portfolio-hero', {
    title,
    src: asString(row.src),
    alt: asString(row.alt),
    thumb: asString(row.thumb),
    layout: asString(row.layout) || 'split',
    'role-json': jsonField(options.role),
    'stack-json': jsonField(options.stack),
    year: options.year,
    period: options.period,
    client: options.client,
    featured: options.featured,
    'tags-json': jsonField(options.tags),
  }, asString(row.body))
}

function renderWorkSummary(row) {
  const options = parseOptionString(row.options)
  return renderPortfolioDirective('work-summary', {
    title: asString(row.title) || '작업 개요',
    'role-json': jsonField(options.role),
    'stack-json': jsonField(options.stack),
    period: options.period,
    client: options.client,
    'scope-json': jsonField(options.scope),
    status: options.status,
  }, asString(row.body))
}

function renderRoleStack(row) {
  const options = parseOptionString(row.options)
  return renderPortfolioDirective('role-stack', {
    title: asString(row.title) || '역할과 스택',
    'role-json': jsonField(options.role),
    'stack-json': jsonField(options.stack),
    'tools-json': jsonField(options.tools),
    'responsibility-json': jsonField(options.responsibility),
  }, asString(row.body))
}

function renderCaseSection(row, type) {
  const options = parseOptionString(row.options)
  const title = asString(row.title) || ({ problem: '문제', solution: '해결', process: '과정', decision: '판단', result: '결과' }[type] || type)
  return renderPortfolioDirective('case-section', {
    type,
    title,
    kind: asString(row.kind),
    weight: options.weight,
    risk: options.risk,
    axis: options.axis,
    ssot: options.ssot,
    tradeoff: options.tradeoff,
    impact: options.impact,
  }, asString(row.body))
}

function renderMetric(row) {
  const options = parseOptionString(row.options)
  return renderPortfolioDirective('metric-card', {
    title: asString(row.title) || 'Metric',
    value: options.value,
    unit: options.unit,
    label: options.label,
    delta: options.delta,
    tone: options.tone,
  }, asString(row.body))
}

function renderToolStack(row) {
  const options = parseOptionString(row.options)
  return renderPortfolioDirective('tool-stack', {
    title: asString(row.title) || 'Tool Stack',
    'stack-json': jsonField(options.stack),
    'tools-json': jsonField(options.tools),
    'language-json': jsonField(options.language),
    'runtime-json': jsonField(options.runtime),
    'storage-json': jsonField(options.storage),
  }, asString(row.body))
}

function renderQuote(row) {
  const options = parseOptionString(row.options)
  return renderPortfolioDirective('quote-block', {
    by: asString(options.by) || asString(row.title),
    tone: options.tone,
    size: options.size,
  }, asString(row.body))
}

function renderRelatedWorks(row) {
  const options = parseOptionString(row.options)
  return renderPortfolioDirective('related-works', {
    title: asString(row.title) || asString(options.title) || '관련 작업',
    'items-json': jsonField(options.items || row.body),
    layout: options.layout,
    showStatus: options.showStatus,
    limit: options.limit,
  }, asString(row.body))
}


function pushCaseGalleryMediaMeta(metaParts, options = {}, rawMeta = '') {
  const media = options.media && typeof options.media === 'object' ? options.media : {}
  const pairs = [
    ['media.ewaPreset', media.ewaPreset ?? options.ewaPreset],
    ['media.ewaMode', media.ewaMode ?? options.ewaMode],
    ['media.pixelSafe', media.pixelSafe ?? options.pixelSafe],
    ['media.ewaEnabled', media.ewaEnabled ?? options.ewaEnabled],
    ['media.ewaNote', media.ewaNote ?? options.ewaNote],
  ]
  for (const [key, value] of pairs) {
    if (value === undefined || value === null || String(value).trim() === '') continue
    metaParts.push(`${key}=${String(value).replaceAll(';', '\\;').replaceAll('|', '\\|')}`)
  }
  if (asString(rawMeta)) metaParts.push(asString(rawMeta))
}

function renderCaseGalleryBlock(startRow, itemRows, context) {
  const options = parseOptionString(startRow.options)
  const layout = asString(startRow.layout) || asString(options.variant) || 'framed'
  if (!itemRows.length) context.warnings.push(`line ${startRow.__line}: case-gallery has no items`)
  const lines = ['::case-gallery']
  addDirectiveField(lines, 'title', asString(startRow.title))
  addDirectiveField(lines, 'caption', asString(startRow.body))
  addDirectiveField(lines, 'variant', layout)
  addDirectiveField(lines, 'columns', options.columns)
  addDirectiveField(lines, 'captionStyle', options.captionStyle)
  lines.push('::')
  for (const item of itemRows) {
    const src = asString(item.src)
    const caption = asString(item.caption || item.body)
    const thumb = asString(item.thumb)
    const metaParts = []
    if (asString(item.alt)) metaParts.push(`alt=${asString(item.alt)}`)
    const itemOptions = parseOptionString(item.options)
    if (itemOptions.label) metaParts.push(`label=${itemOptions.label}`)
    if (itemOptions.focus) metaParts.push(`focus=${itemOptions.focus}`)
    pushCaseGalleryMediaMeta(metaParts, itemOptions, item.meta)
    if (!src) context.errors.push(`line ${item.__line}: case-gallery-item src is required`)
    const parts = [src, caption, thumb]
    if (metaParts.length) parts.push(metaParts.join('; '))
    lines.push(`- ${parts.join(' | ')}`)
  }
  lines.push('::')
  return lines.join('\n')
}

function validateHeader(rows, context) {
  if (!rows.length) {
    context.errors.push('CSV is empty')
    return
  }
  const missing = REQUIRED_COLUMNS.filter((column) => !(column in rows[0]))
  for (const column of missing) context.errors.push(`CSV header is missing column: ${column}`)
}

export function csvRowsToMarkdown(rows, options = {}) {
  const context = {
    sourceCsvPath: options.sourceCsvPath || 'page.csv',
    outputMarkdownPath: options.outputMarkdownPath || 'index.md',
    warnings: [],
    errors: [],
  }

  const validationContext = {
    strict: Boolean(options.strict),
    sourceCsvPath: context.sourceCsvPath,
    sourcePath: context.sourceCsvPath,
    outputMarkdownPath: context.outputMarkdownPath,
    projectRoot: options.projectRoot || process.cwd(),
    currentSlug: options.currentSlug,
    portfolioIndex: options.portfolioIndex,
    portfolioPages: options.portfolioPages || options.pages,
  }

  context.diagnostics = [
    ...validateCsvRows(rows, validationContext),
    ...validateCsvAssetReferences(rows, validationContext),
    ...validatePortfolioLinks(rows, validationContext),
  ]
  context.warnings.push(...diagnosticsToLegacyMessages(context.diagnostics, 'warning'))
  context.errors.push(...diagnosticsToLegacyMessages(context.diagnostics, 'error'))

  const blocks = []
  const pageRows = rows.filter((row) => asString(row.block) === 'page')
  const productRows = rows.filter((row) => asString(row.block) === 'product')
  if (pageRows.length === 0) context.errors.push('CSV must contain exactly one page block')
  if (pageRows.length > 1) context.errors.push('CSV must not contain more than one page block')
  if (productRows.length > 1) context.errors.push('CSV must not contain more than one product block')
  if (pageRows[0]) blocks.push(renderFrontmatter(pageRows[0], context, productRows[0] || null, rows))

  let galleryStart = null
  let galleryItems = []
  let caseGalleryStart = null
  let caseGalleryItems = []

  for (const row of rows) {
    const block = asString(row.block)
    if (!block || block === 'page' || block === 'product') continue

    if (galleryStart && block !== 'gallery-item' && block !== 'gallery-end') {
      context.errors.push(`line ${row.__line}: gallery-start must be closed with gallery-end before ${block}`)
    }
    if (caseGalleryStart && block !== 'case-gallery-item' && block !== 'case-gallery-end') {
      context.errors.push(`line ${row.__line}: case-gallery-start must be closed with case-gallery-end before ${block}`)
    }

    switch (block) {
      case 'heading': blocks.push(renderHeading(row)); break
      case 'paragraph': blocks.push(renderParagraph(row)); break
      case 'box': blocks.push(renderBox(row)); break
      case 'image': blocks.push(renderImage(row, context)); break
      case 'section-gap': blocks.push(renderSectionGap()); break
      case 'product-cta': blocks.push(renderProductCta()); break
      case 'product-trust': blocks.push(renderProductTrust()); break
      case 'before-after': blocks.push(renderBeforeAfter(row, context)); break
      case 'video': blocks.push(renderVideo(row, context)); break
      case 'raw':
        context.warnings.push(`line ${row.__line}: raw block bypasses CSV authoring safety`)
        blocks.push(asString(row.body))
        break
      case 'portfolio-hero': blocks.push(renderPortfolioHero(row)); break
      case 'work-summary': blocks.push(renderWorkSummary(row)); break
      case 'role-stack': blocks.push(renderRoleStack(row)); break
      case 'problem': blocks.push(renderCaseSection(row, 'problem')); break
      case 'solution': blocks.push(renderCaseSection(row, 'solution')); break
      case 'process': blocks.push(renderCaseSection(row, 'process')); break
      case 'decision': blocks.push(renderCaseSection(row, 'decision')); break
      case 'result': blocks.push(renderCaseSection(row, 'result')); break
      case 'metric': blocks.push(renderMetric(row)); break
      case 'tool-stack': blocks.push(renderToolStack(row)); break
      case 'quote': blocks.push(renderQuote(row)); break
      case 'related-works': blocks.push(renderRelatedWorks(row)); break
      case 'case-gallery-start':
        if (caseGalleryStart) context.errors.push(`line ${row.__line}: nested case-gallery-start is not allowed`)
        caseGalleryStart = row
        caseGalleryItems = []
        break
      case 'case-gallery-item':
        if (!caseGalleryStart) context.errors.push(`line ${row.__line}: case-gallery-item appeared without case-gallery-start`)
        else caseGalleryItems.push(row)
        break
      case 'case-gallery-end':
        if (!caseGalleryStart) {
          context.errors.push(`line ${row.__line}: case-gallery-end appeared without case-gallery-start`)
        } else {
          blocks.push(renderCaseGalleryBlock(caseGalleryStart, caseGalleryItems, context))
          caseGalleryStart = null
          caseGalleryItems = []
        }
        break
      case 'gallery-start':
        if (galleryStart) context.errors.push(`line ${row.__line}: nested gallery-start is not allowed`)
        galleryStart = row
        galleryItems = []
        break
      case 'gallery-item':
        if (!galleryStart) context.errors.push(`line ${row.__line}: gallery-item appeared without gallery-start`)
        else galleryItems.push(row)
        break
      case 'gallery-end':
        if (!galleryStart) {
          context.errors.push(`line ${row.__line}: gallery-end appeared without gallery-start`)
        } else {
          blocks.push(renderGalleryBlock(galleryStart, galleryItems, context))
          galleryStart = null
          galleryItems = []
        }
        break
      default:
        context.errors.push(`line ${row.__line}: unknown block type: ${block}`)
    }
  }

  if (galleryStart) context.errors.push(`line ${galleryStart.__line}: gallery-start missing gallery-end`)
  if (caseGalleryStart) context.errors.push(`line ${caseGalleryStart.__line}: case-gallery-start missing case-gallery-end`)

  const relativeSource = options.sourceCsvPath ? options.sourceCsvPath.replace(/\\/g, '/') : 'page.csv'
  const marker = ['<!--', `GENERATED FROM ${relativeSource}.`, 'Do not edit this file directly.', `Run: npm run csv:page -- ${relativeSource}`, '-->'].join('\n')

  const renderedBlocks = blocks.filter((block) => String(block || '').trim())
  const [firstBlock, ...restBlocks] = renderedBlocks
  const markdown = String(firstBlock || '').startsWith('---')
    ? `${firstBlock}\n\n${marker}\n\n${restBlocks.join('\n\n')}\n`
    : `${marker}\n\n${renderedBlocks.join('\n\n')}\n`

  const allDiagnostics = [
    ...(context.diagnostics || []),
    ...context.warnings
      .filter((message) => !String(message).includes('[CSV_'))
      .map((message) => ({ level: 'warning', code: 'CSV_RENDER_WARNING', message, rowNumber: null, block: '', field: '', optionKey: '', hint: '' })),
    ...context.errors
      .filter((message) => !String(message).includes('[CSV_'))
      .map((message) => ({ level: 'error', code: 'CSV_RENDER_ERROR', message, rowNumber: null, block: '', field: '', optionKey: '', hint: '' })),
  ]

  return {
    markdown,
    warnings: context.warnings,
    errors: context.errors,
    diagnostics: allDiagnostics,
    summary: {
      ...summarizeCsvRows(rows, allDiagnostics, {
        sourceCsvPath: context.sourceCsvPath,
        outputMarkdownPath: context.outputMarkdownPath,
      }),
      assetSummary: summarizeAssetReferences(rows, {
        strict: Boolean(options.strict),
        sourceCsvPath: context.sourceCsvPath,
        sourcePath: context.sourceCsvPath,
        projectRoot: options.projectRoot || process.cwd(),
      }),
      portfolioLinksSummary: summarizePortfolioLinks(rows, validationContext),
    },
  }

}
