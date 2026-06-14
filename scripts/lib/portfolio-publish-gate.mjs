import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { readPortfolioPages, routeForPage } from './portfolio-seo.mjs'

export const PORTFOLIO_PUBLISH_REPORT_VERSION = 1

export const PUBLISH_DIAGNOSTIC_CODES = {
  MISSING_TITLE: 'PUBLISH_MISSING_TITLE',
  MISSING_SUMMARY: 'PUBLISH_MISSING_SUMMARY',
  MISSING_WORK_TYPE: 'PUBLISH_MISSING_WORK_TYPE',
  INVALID_STATUS: 'PUBLISH_INVALID_STATUS',
  MISSING_COVER: 'PUBLISH_MISSING_COVER',
  COVER_NOT_FOUND: 'PUBLISH_COVER_NOT_FOUND',
  RELATED_WORK_NOT_FOUND: 'PUBLISH_RELATED_WORK_NOT_FOUND',
  RELATED_WORK_PRIVATE: 'PUBLISH_RELATED_WORK_PRIVATE',
  ASSET_MISSING: 'PUBLISH_ASSET_MISSING',
  SEO_CANONICAL_INVALID: 'PUBLISH_SEO_CANONICAL_INVALID',
  PRIVATE_INDEXED: 'PUBLISH_PRIVATE_INDEXED',
  DRAFT_INDEXED: 'PUBLISH_DRAFT_INDEXED',
  MISSING_THUMB: 'PUBLISH_MISSING_THUMB',
  MISSING_ALT: 'PUBLISH_MISSING_ALT',
  MISSING_TAGS: 'PUBLISH_MISSING_TAGS',
  LOW_SUMMARY_LENGTH: 'PUBLISH_LOW_SUMMARY_LENGTH',
  MISSING_RELATED_WORKS: 'PUBLISH_MISSING_RELATED_WORKS',
  MISSING_METRIC: 'PUBLISH_MISSING_METRIC',
  LARGE_COVER_IMAGE: 'PUBLISH_LARGE_COVER_IMAGE',
  SEO_MISSING_IMAGE: 'PUBLISH_SEO_MISSING_IMAGE',
  SEARCH_TEXT_TOO_SHORT: 'PUBLISH_SEARCH_TEXT_TOO_SHORT',
  ARCHIVED_WORK: 'PUBLISH_ARCHIVED_WORK',
  FEATURED_WORK: 'PUBLISH_FEATURED_WORK',
  TAG_COUNT: 'PUBLISH_TAG_COUNT',
  RELATED_COUNT: 'PUBLISH_RELATED_COUNT',
}

const PUBLISH_TARGET_STATUSES = new Set(['published', 'archived', 'active'])
const NON_PUBLIC_STATUSES = new Set(['draft', 'private', 'hidden'])

function asString(value = '') {
  return String(value ?? '').trim()
}

function asArray(value) {
  if (Array.isArray(value)) return value.flatMap((item) => asArray(item))
  if (value && typeof value === 'object') return Object.values(value).flatMap((item) => asArray(item))
  const text = asString(value)
  if (!text) return []
  return text.split(/[|,]/).map((item) => item.trim()).filter(Boolean)
}

function unique(values) {
  return Array.from(new Set(values.map((item) => asString(item)).filter(Boolean)))
}

function readJson(pathname, fallback) {
  if (!existsSync(pathname)) return fallback
  try {
    return JSON.parse(readFileSync(pathname, 'utf8'))
  } catch {
    return fallback
  }
}

function normalizeSlashes(value) {
  return asString(value).replace(/\\/g, '/')
}

function workObject(page = {}) {
  const work = page.frontmatter?.work
  return work && typeof work === 'object' && !Array.isArray(work) ? work : {}
}

function productObject(page = {}) {
  const product = page.frontmatter?.product
  return product && typeof product === 'object' && !Array.isArray(product) ? product : {}
}

export function isPortfolioWorkPage(page = {}) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  const slug = asString(page.slug)
  const kind = asString(fm.kind).toLowerCase()
  if (slug === 'works') return false
  return Boolean(Object.keys(work).length) || kind === 'work' || slug.startsWith('works/')
}

function statusForPage(page = {}) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  return asString(work.status || fm.status || 'draft').toLowerCase()
}

function visibilityForPage(page = {}) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  return asString(work.visibility || fm.visibility || 'public').toLowerCase()
}

export function isPublishTarget(page = {}, options = {}) {
  if (!isPortfolioWorkPage(page)) return false
  const status = statusForPage(page)
  const visibility = visibilityForPage(page)
  if (visibility === 'private' || visibility === 'hidden') return false
  if (options.includeDraft && status === 'draft') return true
  return PUBLISH_TARGET_STATUSES.has(status)
}

function resolvePageAssetPath(page, assetPath, projectRoot) {
  const raw = asString(assetPath)
  if (!raw) return { raw, absolutePath: '', exists: false, normalizedPath: '' }
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return { raw, absolutePath: raw, exists: true, normalizedPath: raw }
  const sourcePath = asString(page.sourcePath || page.projectPath)
  const baseDir = sourcePath ? path.dirname(path.resolve(projectRoot, sourcePath)) : projectRoot
  const absolutePath = path.resolve(baseDir, raw)
  return {
    raw,
    absolutePath,
    exists: existsSync(absolutePath),
    normalizedPath: normalizeSlashes(path.relative(projectRoot, absolutePath)),
  }
}

function titleForEntry(page) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  return asString(fm.title || fm.cardTitle || work.title || page.slug)
}

function summaryForEntry(page) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  return asString(fm.description || fm.summary || fm.cardDescription || work.summary || work.description)
}

function typeForEntry(page) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  return asString(work.type || fm.type || fm.kind)
}

function coverForEntry(page) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  return asString(work.cover || fm.cover || fm.cardCover || fm.ogImage || fm.image)
}

function thumbForEntry(page) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  return asString(work.thumb || work.thumbnail || fm.thumb || fm.thumbnail || fm.cardThumb)
}

function altForEntry(page) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  return asString(work.alt || work.coverAlt || work.imageAlt || fm.alt || fm.coverAlt || fm.imageAlt)
}

function tagsForEntry(page) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  return unique([...asArray(work.tags), ...asArray(fm.tags)])
}

function relatedForEntry(page) {
  const fm = page.frontmatter || {}
  const work = workObject(page)
  return unique([...asArray(work.related), ...asArray(fm.related), ...asArray(fm.relatedWorks)])
}

function diagnostic(level, code, message, details = {}) {
  return { level, code, message, ...details }
}

function manifestMaps(manifests = {}) {
  const seoPages = manifests.seo?.pages || []
  const searchPages = manifests.search?.pages || []
  const tagEntries = manifests.tags?.tags || []
  const assetEntries = manifests.assets?.assets || []
  return {
    seoBySlug: new Map(seoPages.map((entry) => [entry.slug, entry])),
    searchBySlug: new Map(searchPages.map((entry) => [entry.slug, entry])),
    tagEntries,
    assetsByPageSlug: assetEntries.reduce((map, asset) => {
      const list = map.get(asset.pageSlug) || []
      list.push(asset)
      map.set(asset.pageSlug, list)
      return map
    }, new Map()),
  }
}

export function createPublishEntry(page, context = {}) {
  const projectRoot = context.projectRoot || process.cwd()
  const slug = asString(page.slug)
  const cover = coverForEntry(page)
  const thumb = thumbForEntry(page)
  const coverResolved = resolvePageAssetPath(page, cover, projectRoot)
  const thumbResolved = resolvePageAssetPath(page, thumb, projectRoot)
  return {
    slug,
    href: page.href || routeForPage(page),
    title: titleForEntry(page),
    summary: summaryForEntry(page),
    type: typeForEntry(page),
    status: statusForPage(page),
    visibility: visibilityForPage(page),
    cover,
    coverResolved,
    thumb,
    thumbResolved,
    alt: altForEntry(page),
    tags: tagsForEntry(page),
    related: relatedForEntry(page),
    featured: page.frontmatter?.work?.featured === true || page.frontmatter?.featured === true,
    sourcePath: page.sourcePath || page.projectPath || '',
  }
}

function validateRelated(entry, pagesBySlug) {
  const diagnostics = []
  if (!entry.related.length) {
    diagnostics.push(diagnostic('warning', PUBLISH_DIAGNOSTIC_CODES.MISSING_RELATED_WORKS, 'Published work has no related works.', { field: 'related' }))
    return diagnostics
  }
  for (const related of entry.related) {
    const slug = asString(related).replace(/^\/+/, '').replace(/^works\//, 'works/')
    const target = pagesBySlug.get(slug) || pagesBySlug.get(`works/${slug}`)
    if (!target) {
      diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.RELATED_WORK_NOT_FOUND, `Related work not found: ${related}`, { field: 'related', value: related }))
      continue
    }
    const targetStatus = statusForPage(target)
    const targetVisibility = visibilityForPage(target)
    if (NON_PUBLIC_STATUSES.has(targetStatus) || targetVisibility === 'private' || targetVisibility === 'hidden') {
      diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.RELATED_WORK_PRIVATE, `Related work is not public: ${related}`, { field: 'related', value: related }))
    }
  }
  return diagnostics
}

export function validatePublishWork(entry, context = {}) {
  const diagnostics = []
  const { seoBySlug, searchBySlug, tagEntries, assetsByPageSlug } = manifestMaps(context.manifests || {})
  const pagesBySlug = context.pagesBySlug || new Map()

  if (!entry.title) diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.MISSING_TITLE, 'Published work is missing a title.', { field: 'title' }))
  if (!entry.summary) diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.MISSING_SUMMARY, 'Published work is missing description or summary.', { field: 'summary' }))
  else if (entry.summary.length < 24) diagnostics.push(diagnostic('warning', PUBLISH_DIAGNOSTIC_CODES.LOW_SUMMARY_LENGTH, 'Published work summary is very short.', { field: 'summary' }))
  if (!entry.type) diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.MISSING_WORK_TYPE, 'Published work is missing work.type or kind.', { field: 'work.type' }))
  if (!PUBLISH_TARGET_STATUSES.has(entry.status) && entry.status !== 'draft') diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.INVALID_STATUS, `Invalid publish status: ${entry.status}`, { field: 'work.status' }))

  if (!entry.cover) diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.MISSING_COVER, 'Published work is missing cover image.', { field: 'cover' }))
  else if (!entry.coverResolved.exists) diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.COVER_NOT_FOUND, `Cover image not found: ${entry.cover}`, { field: 'cover', value: entry.cover }))

  if (!entry.thumb) diagnostics.push(diagnostic('warning', PUBLISH_DIAGNOSTIC_CODES.MISSING_THUMB, 'Published work is missing thumbnail.', { field: 'thumbnail' }))
  if (!entry.alt) diagnostics.push(diagnostic('warning', PUBLISH_DIAGNOSTIC_CODES.MISSING_ALT, 'Published work is missing cover alt text.', { field: 'alt' }))
  if (!entry.tags.length) diagnostics.push(diagnostic('warning', PUBLISH_DIAGNOSTIC_CODES.MISSING_TAGS, 'Published work has no tags.', { field: 'tags' }))

  diagnostics.push(...validateRelated(entry, pagesBySlug))

  const assetEntries = assetsByPageSlug.get(entry.slug) || []
  for (const asset of assetEntries) {
    if (!asset.exists) diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.ASSET_MISSING, `Asset is missing: ${asset.src}`, { field: asset.field, value: asset.src }))
    if ((asset.warningCodes || []).some((code) => code.startsWith('PORTFOLIO_ASSET_LARGE_')) && asset.role === 'cover') {
      diagnostics.push(diagnostic('warning', PUBLISH_DIAGNOSTIC_CODES.LARGE_COVER_IMAGE, `Cover asset is large: ${asset.src}`, { field: asset.field, value: asset.src }))
    }
  }

  const seoEntry = seoBySlug.get(entry.slug)
  if (!seoEntry) {
    diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.SEO_CANONICAL_INVALID, 'Published work is missing SEO manifest entry.', { field: 'seo' }))
  } else {
    if (!seoEntry.canonicalUrl || !/^https:\/\//.test(seoEntry.canonicalUrl)) diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.SEO_CANONICAL_INVALID, 'SEO canonical URL is invalid.', { field: 'canonicalUrl' }))
    if (seoEntry.status === 'private' && seoEntry.indexable) diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.PRIVATE_INDEXED, 'Private work is indexable in SEO manifest.', { field: 'seo.indexable' }))
    if (seoEntry.status === 'draft' && seoEntry.indexable) diagnostics.push(diagnostic('error', PUBLISH_DIAGNOSTIC_CODES.DRAFT_INDEXED, 'Draft work is indexable in SEO manifest.', { field: 'seo.indexable' }))
    if ((seoEntry.warningCodes || []).includes('PORTFOLIO_SEO_MISSING_IMAGE')) diagnostics.push(diagnostic('warning', PUBLISH_DIAGNOSTIC_CODES.SEO_MISSING_IMAGE, 'SEO image is missing or using default fallback.', { field: 'seo.image' }))
  }

  const searchEntry = searchBySlug.get(entry.slug)
  if (!searchEntry || !searchEntry.indexable) diagnostics.push(diagnostic('warning', PUBLISH_DIAGNOSTIC_CODES.SEARCH_TEXT_TOO_SHORT, 'Published work is not present in the site page search index.', { field: 'page-search-index' }))
  else if (asString(searchEntry.text).length < 80) diagnostics.push(diagnostic('warning', PUBLISH_DIAGNOSTIC_CODES.SEARCH_TEXT_TOO_SHORT, 'Published work search text is very short.', { field: 'page-search-index.text' }))

  if (entry.tags.length) {
    const tagWorks = new Set(tagEntries.flatMap((tag) => tag.works || []))
    if (!tagWorks.has(entry.slug)) diagnostics.push(diagnostic('warning', PUBLISH_DIAGNOSTIC_CODES.MISSING_TAGS, 'Published work tags are not represented in tag index.', { field: 'portfolio-tag-index' }))
  }

  if (entry.status === 'archived') diagnostics.push(diagnostic('info', PUBLISH_DIAGNOSTIC_CODES.ARCHIVED_WORK, 'Archived work is included in publish gate.', { field: 'work.status' }))
  if (entry.featured) diagnostics.push(diagnostic('info', PUBLISH_DIAGNOSTIC_CODES.FEATURED_WORK, 'Work is featured.', { field: 'work.featured' }))
  diagnostics.push(diagnostic('info', PUBLISH_DIAGNOSTIC_CODES.TAG_COUNT, `Work has ${entry.tags.length} tags.`, { field: 'tags', count: entry.tags.length }))
  diagnostics.push(diagnostic('info', PUBLISH_DIAGNOSTIC_CODES.RELATED_COUNT, `Work has ${entry.related.length} related works.`, { field: 'related', count: entry.related.length }))

  return diagnostics
}

export function summarizePublishDiagnostics(diagnostics = []) {
  return {
    errors: diagnostics.filter((item) => item.level === 'error').length,
    warnings: diagnostics.filter((item) => item.level === 'warning').length,
    infos: diagnostics.filter((item) => item.level === 'info').length,
  }
}

function splitDiagnostics(diagnostics = []) {
  return {
    errors: diagnostics.filter((item) => item.level === 'error'),
    warnings: diagnostics.filter((item) => item.level === 'warning'),
    infos: diagnostics.filter((item) => item.level === 'info'),
  }
}

export function buildPublishGateEntries(context = {}) {
  const projectRoot = context.projectRoot || process.cwd()
  const pages = context.pages || readPortfolioPages({ projectRoot })
  return pages.filter((page) => isPublishTarget(page, context)).map((page) => createPublishEntry(page, { ...context, projectRoot }))
}

export function loadPublishManifests(context = {}) {
  const projectRoot = context.projectRoot || process.cwd()
  const generatedRoot = path.join(projectRoot, 'src', 'content', 'generated')
  return {
    assets: readJson(path.join(generatedRoot, 'portfolio-asset-manifest.json'), { assets: [], summary: {} }),
    seo: readJson(path.join(generatedRoot, 'portfolio-seo-manifest.json'), { pages: [], summary: {} }),
    tags: readJson(path.join(generatedRoot, 'portfolio-tag-index.json'), { tags: [], summary: {} }),
    search: readJson(path.join(generatedRoot, 'page-search-index.json'), { pages: [], summary: {} }),
  }
}

export function createPublishReport(entries, diagnosticsBySlug, context = {}) {
  const strictWarnings = Boolean(context.strictWarnings)
  const works = entries.map((entry) => {
    const diagnostics = diagnosticsBySlug.get(entry.slug) || []
    const split = splitDiagnostics(diagnostics)
    return {
      slug: entry.slug,
      href: entry.href,
      title: entry.title,
      status: entry.status,
      passed: split.errors.length === 0 && (!strictWarnings || split.warnings.length === 0),
      errors: split.errors,
      warnings: split.warnings,
      infos: split.infos,
    }
  })
  const totals = works.reduce((acc, work) => {
    acc.errors += work.errors.length
    acc.warnings += work.warnings.length
    acc.infos += work.infos.length
    if (work.passed) acc.passed += 1
    else acc.failed += 1
    return acc
  }, { passed: 0, failed: 0, errors: 0, warnings: 0, infos: 0 })
  return {
    version: PORTFOLIO_PUBLISH_REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    summary: {
      checked: works.length,
      ...totals,
    },
    works,
  }
}

export function buildPortfolioPublishReport(context = {}) {
  const projectRoot = context.projectRoot || process.cwd()
  const pages = context.pages || readPortfolioPages({ projectRoot })
  const pagesBySlug = new Map(pages.map((page) => [page.slug, page]))
  const entries = context.entries || pages.filter((page) => isPublishTarget(page, context)).map((page) => createPublishEntry(page, { ...context, projectRoot }))
  const manifests = context.manifests || loadPublishManifests({ projectRoot })
  const diagnosticsBySlug = new Map()
  for (const entry of entries) {
    diagnosticsBySlug.set(entry.slug, validatePublishWork(entry, { ...context, pagesBySlug, manifests }))
  }
  return createPublishReport(entries, diagnosticsBySlug, context)
}

export function writePortfolioPublishReport(report, context = {}) {
  const projectRoot = context.projectRoot || process.cwd()
  const outPath = context.outPath || path.join(projectRoot, 'src', 'content', 'generated', 'portfolio-publish-report.json')
  mkdirSync(path.dirname(outPath), { recursive: true })
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`)
  return outPath
}
