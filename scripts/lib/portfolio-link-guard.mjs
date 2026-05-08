import { parseOptionString } from './csv-options.mjs'
import { createDiagnostic, diagnosticSeverityCounts } from './csv-diagnostics.mjs'

const RELATED_BLOCK = 'related-works'
const HIDDEN_STATUSES = new Set(['private'])
const DRAFT_STATUSES = new Set(['draft'])
const ARCHIVED_STATUSES = new Set(['archived'])

function asString(value) { return String(value ?? '').trim() }
function asArray(value) {
  if (Array.isArray(value)) return value.flatMap((item) => asArray(item))
  if (value && typeof value === 'object') return Object.values(value).flatMap((item) => asArray(item))
  const text = asString(value)
  if (!text) return []
  return text.split(/[|,\n]/).map((item) => item.trim()).filter(Boolean)
}

export function normalizeRelatedWorkSlug(value) {
  const raw = asString(value)
  if (!raw) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw
  let slug = raw.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')
  if (slug.startsWith('works/')) slug = slug.slice('works/'.length)
  if (slug.startsWith('content/pages/')) slug = slug.slice('content/pages/'.length)
  return slug.replace(/\/+$/, '')
}

function isExternalUrl(value) { return /^[a-z][a-z0-9+.-]*:/i.test(asString(value)) }
function statusOf(entry = {}) { return asString(entry.workStatus || entry.status || entry.visibility || 'published') || 'published' }
function relatedOf(entry = {}) {
  return asArray(entry.related || entry.relatedWorks || entry.work?.related || entry.frontmatter?.related || entry.frontmatter?.work?.related)
    .map(normalizeRelatedWorkSlug)
    .filter(Boolean)
}
function entrySlug(entry = {}) { return normalizeRelatedWorkSlug(entry.slug || entry.href || entry.path || entry.id || entry.frontmatter?.slug) }

export function buildPortfolioPageIndex(pages = []) {
  const values = Array.isArray(pages) ? pages : Object.values(pages || {})
  const bySlug = new Map()
  for (const item of values) {
    const frontmatter = item.frontmatter || {}
    const work = frontmatter.work || item.work || {}
    const slug = entrySlug(item) || entrySlug(frontmatter)
    if (!slug) continue
    const resolvedStatus = statusOf({ ...item, ...frontmatter, workStatus: work.status || item.workStatus })
    bySlug.set(slug, {
      slug,
      href: item.href || `/${slug}`,
      status: resolvedStatus,
      workStatus: resolvedStatus,
      visibility: asString(frontmatter.visibility || item.visibility || 'public'),
      related: relatedOf(item),
      raw: item,
    })
  }
  return bySlug
}

function getCurrentSlug(context = {}) {
  const explicit = normalizeRelatedWorkSlug(context.currentSlug || context.slug)
  if (explicit) return explicit
  const source = asString(context.sourceCsvPath || context.sourcePath || context.source)
  if (!source) return ''
  const parts = source.replace(/\\/g, '/').split('/').filter(Boolean)
  const pageIndex = parts.lastIndexOf('page.csv')
  if (pageIndex > 0) return normalizeRelatedWorkSlug(parts[pageIndex - 1])
  const indexMd = parts.lastIndexOf('index.md')
  if (indexMd > 0) return normalizeRelatedWorkSlug(parts[indexMd - 1])
  return ''
}

function levelFor(code, context = {}) {
  const strict = Boolean(context.strict)
  switch (code) {
    case 'PORTFOLIO_RELATED_WORK_NOT_FOUND':
    case 'PORTFOLIO_RELATED_WORK_SELF_REFERENCE':
    case 'PORTFOLIO_RELATED_WORK_DRAFT':
      return strict ? 'error' : 'warning'
    case 'PORTFOLIO_RELATED_WORK_HIDDEN':
    case 'PORTFOLIO_RELATED_WORK_EXTERNAL_URL':
    case 'PORTFOLIO_INTERNAL_LINK_UNSAFE':
      return 'error'
    case 'PORTFOLIO_RELATED_WORK_ARCHIVED':
    case 'PORTFOLIO_RELATED_WORK_DUPLICATE':
    case 'PORTFOLIO_RELATED_WORK_CYCLE':
      return 'warning'
    default:
      return 'info'
  }
}
function diagnostic(code, reference, message, context = {}, hint = '') {
  return createDiagnostic({ level: levelFor(code, context), code, message, rowNumber: reference.rowNumber, block: reference.block, field: reference.field, optionKey: reference.optionKey, hint })
}

export function collectRelatedWorkReferences(rows = [], context = {}) {
  const currentSlug = getCurrentSlug(context)
  const references = []
  for (const row of rows) {
    if (asString(row.block) !== RELATED_BLOCK) continue
    const options = parseOptionString(row.options)
    const rawItems = options.items !== undefined ? options.items : row.body
    const items = asArray(rawItems)
    for (const value of items) {
      references.push({
        rowNumber: row.__rowNumber || row.__line || null,
        block: RELATED_BLOCK,
        field: options.items !== undefined ? 'options' : 'body',
        optionKey: options.items !== undefined ? 'items' : '',
        value,
        normalizedSlug: normalizeRelatedWorkSlug(value),
        currentSlug,
        sourcePath: row.__source || context.sourcePath || context.sourceCsvPath || '',
      })
    }
  }
  return references
}

export function validateRelatedWorkReference(reference, index, context = {}) {
  const diagnostics = []
  const value = asString(reference.value)
  const slug = reference.normalizedSlug
  if (!value || !slug) return diagnostics
  if (isExternalUrl(value)) {
    diagnostics.push(diagnostic('PORTFOLIO_RELATED_WORK_EXTERNAL_URL', reference, `related-works item "${value}" is an external URL. Use work.links.* for external links instead.`, context))
    return diagnostics
  }
  if (reference.currentSlug && slug === reference.currentSlug) {
    diagnostics.push(diagnostic('PORTFOLIO_RELATED_WORK_SELF_REFERENCE', reference, `related-works item "${slug}" points to the current page.`, context))
  }
  if (!index || !index.size) return diagnostics
  const target = index.get(slug)
  if (!target) {
    diagnostics.push(diagnostic('PORTFOLIO_RELATED_WORK_NOT_FOUND', reference, `related-works item "${slug}" does not match a known portfolio page.`, context))
    return diagnostics
  }
  const status = statusOf(target)
  if (target.visibility === 'hidden' || HIDDEN_STATUSES.has(status)) diagnostics.push(diagnostic('PORTFOLIO_RELATED_WORK_HIDDEN', reference, `related-works item "${slug}" points to a hidden/private page.`, context))
  else if (DRAFT_STATUSES.has(status)) diagnostics.push(diagnostic('PORTFOLIO_RELATED_WORK_DRAFT', reference, `related-works item "${slug}" points to a draft page.`, context))
  else if (ARCHIVED_STATUSES.has(status)) diagnostics.push(diagnostic('PORTFOLIO_RELATED_WORK_ARCHIVED', reference, `related-works item "${slug}" points to an archived page.`, context))
  const targetRelated = relatedOf(target)
  if (reference.currentSlug && targetRelated.includes(reference.currentSlug)) {
    diagnostics.push(diagnostic('PORTFOLIO_RELATED_WORK_CYCLE', reference, `related-works item "${slug}" creates a direct two-way related-work cycle.`, context))
  }
  return diagnostics
}

export function validatePortfolioLinks(rows = [], context = {}) {
  const references = collectRelatedWorkReferences(rows, context)
  const diagnostics = []
  if (!references.length) return diagnostics
  const index = context.portfolioIndex instanceof Map ? context.portfolioIndex : buildPortfolioPageIndex(context.portfolioPages || context.pages || [])
  if (!index.size) {
    diagnostics.push(createDiagnostic({ level: 'info', code: 'PORTFOLIO_LINK_INDEX_UNAVAILABLE', message: 'Portfolio link index is unavailable; related-works references were collected but not resolved.', rowNumber: references[0]?.rowNumber || null, block: RELATED_BLOCK, field: 'options', optionKey: 'items' }))
  }
  const seen = new Set()
  for (const reference of references) {
    const key = reference.normalizedSlug
    if (key && seen.has(key)) {
      diagnostics.push(diagnostic('PORTFOLIO_RELATED_WORK_DUPLICATE', reference, `related-works item "${key}" is listed more than once.`, context))
      continue
    }
    if (key) seen.add(key)
    diagnostics.push(...validateRelatedWorkReference(reference, index, context))
  }
  return diagnostics
}

export function summarizePortfolioLinks(rows = [], context = {}) {
  const references = collectRelatedWorkReferences(rows, context)
  const index = context.portfolioIndex instanceof Map ? context.portfolioIndex : buildPortfolioPageIndex(context.portfolioPages || context.pages || [])
  const diagnostics = validatePortfolioLinks(rows, context)
  const counts = diagnosticSeverityCounts(diagnostics)
  let resolved = 0, missing = 0, hidden = 0, duplicates = 0
  const seen = new Set()
  for (const reference of references) {
    const slug = reference.normalizedSlug
    if (!slug) continue
    if (seen.has(slug)) duplicates += 1
    seen.add(slug)
    if (isExternalUrl(reference.value)) continue
    const target = index.get(slug)
    if (!target) { if (index.size) missing += 1; continue }
    const status = statusOf(target)
    if (target.visibility === 'hidden' || HIDDEN_STATUSES.has(status) || DRAFT_STATUSES.has(status)) hidden += 1
    else resolved += 1
  }
  return { relatedRefs: references.length, resolved, missing, hidden, duplicates, warnings: counts.warning, errors: counts.error, indexAvailable: index.size > 0 }
}
