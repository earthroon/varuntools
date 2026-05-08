import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseFrontmatter, readPortfolioPages, routeForPage, isIndexablePortfolioPage } from './portfolio-seo.mjs'

export const PAGE_SEARCH_VERSION = 1
export const INTERNAL_DOCS_SEARCH_VERSION = 1

const EXCLUDED_DIR_PARTS = new Set(['generated', '__fixtures__'])
const TYPE_PRIORITY = { work: 4, product: 3, page: 2, doc: 1 }
const objectLeakToken = '[' + 'object Object' + ']'

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

export function normalizePageSearchText(value) {
  if (Array.isArray(value)) return normalizePageSearchText(value.join(' '))
  if (value === null || value === undefined) return ''
  return String(value).normalize('NFKC').toLowerCase().trim().replace(/\s+/g, ' ')
}

export function extractPageSearchText(markdown = '') {
  return String(markdown || '')
    .replace(/---[\s\S]*?---/, ' ')
    .replace(/:::[\s\S]*?:::/g, ' ')
    .replace(/::[\s\S]*?::/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/[>*_`#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isExcludedPath(sourcePath = '') {
  const parts = String(sourcePath || '').split(/[\\/]/).filter(Boolean)
  return parts.some((part) => EXCLUDED_DIR_PARTS.has(part))
}

function normalizeRoutePath(value = '/') {
  const raw = String(value || '/').trim()
  if (!raw || raw === 'home') return '/'
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`
  return withSlash === '/' ? '/' : withSlash.replace(/\/+$/, '')
}

function loadPageInventory(projectRoot = process.cwd()) {
  const inventoryPath = path.join(projectRoot, 'generated', 'page-inventory.json')
  if (!existsSync(inventoryPath)) return null
  try {
    return JSON.parse(readFileSync(inventoryPath, 'utf8'))
  } catch {
    return null
  }
}

function inventoryBySource(projectRoot = process.cwd()) {
  const inventory = loadPageInventory(projectRoot)
  const map = new Map()
  for (const page of inventory?.pages || []) map.set(String(page.source || ''), page)
  return map
}

function isInternalPreviewPage(page = {}) {
  const haystack = `${page.source || ''} ${page.routePath || ''} ${page.slug || ''}`.toLowerCase()
  return haystack.includes('editorial-showcase') || haystack.includes('visual-qa')
}

function isDummyOrPlaygroundPage(page = {}) {
  const haystack = `${page.source || ''} ${page.routePath || ''} ${page.slug || ''}`.toLowerCase()
  return /dummy|playground|spec/.test(haystack)
}

export function shouldIncludeInventoryPageInPublicSearch(page = {}) {
  if (page.visibility && page.visibility !== 'public') return false
  if (page.status && page.status !== 'active') return false
  if (page.noindex) return false
  if (['checkout', 'qa', 'policies', 'claim', 'inquiry'].includes(page.section)) return false
  if (isInternalPreviewPage(page)) return false
  if (isDummyOrPlaygroundPage(page)) return false
  return true
}

export function classifyPageType(page) {
  const fm = page.frontmatter || {}
  const work = fm.work && typeof fm.work === 'object' ? fm.work : null
  const product = fm.product && typeof fm.product === 'object' ? fm.product : null
  const kind = asString(fm.kind).toLowerCase()
  const slug = asString(page.slug)
  const sourcePath = asString(page.sourcePath || page.projectPath)
  if (sourcePath.startsWith('docs/')) return 'doc'
  if (product || kind === 'product' || slug.startsWith('products/')) return 'product'
  if (work || slug.startsWith('works/')) return slug === 'works' ? 'page' : 'work'
  if (kind === 'doc' || kind === 'guide') return 'doc'
  return 'page'
}

export function isSearchIndexablePage(page, context = {}) {
  if (!page) return false
  const sourcePath = page.sourcePath || page.projectPath || ''
  if (String(sourcePath).startsWith('docs/')) return false
  if (isExcludedPath(sourcePath)) return false

  const projectRoot = context.projectRoot || process.cwd()
  const inventoryMap = context.inventoryMap || inventoryBySource(projectRoot)
  const inventoryPage = inventoryMap.get(String(sourcePath))
  if (inventoryPage) return shouldIncludeInventoryPageInPublicSearch(inventoryPage)

  const fm = page.frontmatter || {}
  const work = fm.work && typeof fm.work === 'object' ? fm.work : {}
  const product = fm.product && typeof fm.product === 'object' ? fm.product : {}
  const status = asString(work.status || product.status || fm.status).toLowerCase()
  const visibility = asString(work.visibility || fm.visibility).toLowerCase()
  const robots = asString(fm.robots).toLowerCase()
  const route = normalizeRoutePath(page.href || routeForPage(page))
  if (fm.noindex === true || fm.draft === true) return false
  if (status === 'draft' || status === 'private' || status === 'hidden') return false
  if (visibility === 'hidden' || visibility === 'private') return false
  if (robots.startsWith('noindex')) return false
  if (/\/checkout\//.test(route) || route.startsWith('/qa/')) return false
  if (route === '/claim' || route === '/inquiry') return false
  if (/\/policies(\/|$)/.test(route)) return false
  if (isDummyOrPlaygroundPage({ source: sourcePath, routePath: route, slug: page.slug })) return false
  if (isInternalPreviewPage({ source: sourcePath, routePath: route, slug: page.slug })) return false
  if (page.sourcePath?.startsWith('src/content/pages/')) return isIndexablePortfolioPage(page)
  return true
}

function titleForPage(page) {
  const fm = page.frontmatter || {}
  const work = fm.work && typeof fm.work === 'object' ? fm.work : {}
  return asString(fm.searchTitle || fm.title || fm.cardTitle || work.title || page.slug)
}

function descriptionForPage(page) {
  const fm = page.frontmatter || {}
  const work = fm.work && typeof fm.work === 'object' ? fm.work : {}
  const excerpt = asString(page.excerpt || extractPageSearchText(page.content || '').slice(0, 180))
  return asString(fm.searchDescription || fm.description || fm.summary || fm.cardDescription || work.summary || excerpt)
}

function tagsForPage(page) {
  const fm = page.frontmatter || {}
  const work = fm.work && typeof fm.work === 'object' ? fm.work : {}
  const product = fm.product && typeof fm.product === 'object' ? fm.product : {}
  return unique([
    ...asArray(fm.tags),
    ...asArray(work.tags),
    ...asArray(work.stack),
    ...asArray(work.role),
    ...asArray(work.tools),
    ...asArray(product.tags),
    asString(product.category),
    asString(product.subcategory),
  ])
}

function keywordsForPage(page) {
  const fm = page.frontmatter || {}
  const work = fm.work && typeof fm.work === 'object' ? fm.work : {}
  const product = fm.product && typeof fm.product === 'object' ? fm.product : {}
  return unique([
    ...asArray(fm.keywords),
    ...asArray(work.keywords),
    ...asArray(product.keywords),
    asString(work.type),
    asString(fm.kind),
    asString(fm.collection),
    asString(work.category),
    asString(work.series || fm.series),
  ])
}

function routeForDoc(doc) {
  return `/${String(doc.slug || '').replace(/^\/+/, '')}`
}

function entryFromPage(page, context = {}) {
  const type = classifyPageType(page)
  const inventoryPage = context.inventoryMap?.get(String(page.sourcePath || page.projectPath || ''))
  const title = titleForPage(page)
  const description = descriptionForPage(page)
  const tags = tagsForPage(page)
  const keywords = keywordsForPage(page)
  const section = type === 'doc' ? 'Docs' : type === 'work' ? 'Works' : type === 'product' ? 'Products' : 'Pages'
  const bodyText = extractPageSearchText(page.content || '')
  const text = [title, description, page.slug, section, ...tags, ...keywords, bodyText].map(normalizePageSearchText).filter(Boolean).join(' ')
  return {
    slug: page.slug,
    href: page.href || inventoryPage?.routePath || routeForPage(page),
    title,
    description,
    type,
    section,
    tags,
    keywords,
    text,
    status: asString(page.frontmatter?.work?.status || page.frontmatter?.product?.status || page.frontmatter?.status || 'published'),
    indexable: isSearchIndexablePage(page, context),
    sourcePath: page.sourcePath || page.projectPath || '',
  }
}

function walkMarkdownFiles(dir) {
  const output = []
  if (!existsSync(dir)) return output
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) output.push(...walkMarkdownFiles(full))
    else if (entry.isFile() && entry.name.endsWith('.md')) output.push(full)
  }
  return output.sort()
}

function readDocsInDir(projectRoot, docsRoot, slugPrefix, section) {
  return walkMarkdownFiles(docsRoot).map((file) => {
    const raw = readFileSync(file, 'utf8')
    const parsed = parseFrontmatter(raw)
    const rel = path.relative(projectRoot, file).replace(/\\/g, '/')
    const docRel = path.relative(docsRoot, file).replace(/\\/g, '/').replace(/\.md$/, '')
    const slug = `${slugPrefix}/${docRel}`
    const title = parsed.data.title || docRel.split('/').pop().replace(/-/g, ' ')
    const content = parsed.content
    const excerpt = extractPageSearchText(content).slice(0, 180)
    return {
      file,
      raw,
      content,
      frontmatter: { ...parsed.data, title, kind: 'doc', internalSearchSection: section },
      slug,
      href: routeForDoc({ slug }),
      sourcePath: rel,
      excerpt,
    }
  })
}

export function readAuthoringDocs(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  return readDocsInDir(projectRoot, options.docsRoot || path.join(projectRoot, 'docs', 'authoring'), 'docs/authoring', 'authoring')
}

export function readMigrationDocs(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  return readDocsInDir(projectRoot, options.docsRoot || path.join(projectRoot, 'docs', 'migration'), 'docs/migration', 'migration')
}

export function readBakeReports(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  return readdirSync(projectRoot)
    .filter((name) => /^BAKE_REPORT_COMMIT_.+\.md$/.test(name))
    .sort()
    .map((name) => {
      const file = path.join(projectRoot, name)
      const raw = readFileSync(file, 'utf8')
      const parsed = parseFrontmatter(raw)
      const slug = `bake-reports/${name.replace(/\.md$/, '')}`
      const title = name.replace(/\.md$/, '').replace(/_/g, ' ')
      return {
        file,
        raw,
        content: parsed.content,
        frontmatter: { ...parsed.data, title, kind: 'doc', internalSearchSection: 'report' },
        slug,
        href: '',
        sourcePath: name,
        excerpt: extractPageSearchText(parsed.content).slice(0, 180),
      }
    })
}

export function readInternalDocsSearchSources(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  return [
    ...readAuthoringDocs({ projectRoot }),
    ...readMigrationDocs({ projectRoot }),
    ...readBakeReports({ projectRoot }),
  ]
}

export function readPageSearchSources(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  const contentPages = readPortfolioPages({ projectRoot })
  if (options.includeInternalDocs) return [...contentPages, ...readInternalDocsSearchSources({ projectRoot })]
  return contentPages
}

export function buildPageSearchEntries(pages, context = {}) {
  const projectRoot = context.projectRoot || process.cwd()
  const inventoryMap = context.inventoryMap || inventoryBySource(projectRoot)
  return pages
    .filter((page) => isSearchIndexablePage(page, { ...context, projectRoot, inventoryMap }))
    .map((page) => entryFromPage(page, { ...context, projectRoot, inventoryMap }))
    .filter((entry) => entry.title && entry.href)
    .sort((a, b) => (TYPE_PRIORITY[b.type] || 0) - (TYPE_PRIORITY[a.type] || 0) || a.title.localeCompare(b.title))
}

export function createPageSearchIndex(entries, context = {}) {
  const pages = entries.filter((entry) => entry.indexable)
  return {
    version: PAGE_SEARCH_VERSION,
    visibility: 'public',
    generatedAt: new Date().toISOString(),
    pages,
    summary: {
      total: pages.length,
      pages: pages.filter((entry) => entry.type === 'page').length,
      works: pages.filter((entry) => entry.type === 'work').length,
      docs: pages.filter((entry) => entry.type === 'doc').length,
      products: pages.filter((entry) => entry.type === 'product').length,
      hidden: entries.length - pages.length,
    },
  }
}

function internalEntryFromPage(page) {
  const title = titleForPage(page)
  const description = descriptionForPage(page)
  const section = asString(page.frontmatter?.internalSearchSection || (page.sourcePath.startsWith('docs/migration/') ? 'migration' : page.sourcePath.startsWith('docs/authoring/') ? 'authoring' : 'report'))
  const bodyText = extractPageSearchText(page.content || '')
  const text = [title, description, page.slug, section, bodyText].map(normalizePageSearchText).filter(Boolean).join(' ')
  return {
    slug: page.slug,
    href: page.href || '',
    title,
    description,
    type: 'internal-doc',
    section,
    tags: tagsForPage(page),
    keywords: keywordsForPage(page),
    text,
    sourcePath: page.sourcePath || page.projectPath || '',
    indexable: true,
  }
}

export function buildInternalDocsSearchEntries(pages) {
  return pages
    .map(internalEntryFromPage)
    .filter((entry) => entry.title && entry.sourcePath)
    .sort((a, b) => a.section.localeCompare(b.section) || a.title.localeCompare(b.title))
}

export function createInternalDocsSearchIndex(entries) {
  return {
    version: INTERNAL_DOCS_SEARCH_VERSION,
    visibility: 'internal-docs',
    generatedAt: new Date().toISOString(),
    pages: entries,
    summary: {
      total: entries.length,
      authoring: entries.filter((entry) => entry.section === 'authoring').length,
      migration: entries.filter((entry) => entry.section === 'migration').length,
      reports: entries.filter((entry) => entry.section === 'report').length,
    },
  }
}

function assertNoObjectLeak(index, label) {
  const serialized = JSON.stringify(index)
  if (serialized.includes(objectLeakToken)) throw new Error(`${label} contains ${objectLeakToken}`)
}

export function buildAndWritePageSearchIndex(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  const sources = readPageSearchSources({ projectRoot })
  const entries = buildPageSearchEntries(sources, { ...options, projectRoot })
  const index = createPageSearchIndex(entries, options)
  assertNoObjectLeak(index, 'page-search-index')
  const outDir = path.join(projectRoot, 'src', 'content', 'generated')
  mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'page-search-index.json')
  writeFileSync(outPath, `${JSON.stringify(index, null, 2)}\n`)
  return { index, entries, outPath }
}

export function buildAndWriteInternalDocsSearchIndex(options = {}) {
  const projectRoot = options.projectRoot || process.cwd()
  const sources = readInternalDocsSearchSources({ projectRoot })
  const entries = buildInternalDocsSearchEntries(sources)
  const index = createInternalDocsSearchIndex(entries)
  assertNoObjectLeak(index, 'internal-docs-search-index')
  const outDir = path.join(projectRoot, 'src', 'content', 'generated')
  mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'internal-docs-search-index.json')
  writeFileSync(outPath, `${JSON.stringify(index, null, 2)}\n`)
  return { index, entries, outPath }
}
