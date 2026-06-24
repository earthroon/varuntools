#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const pagesRoot = path.join(root, 'src/content/pages')
const generatedDir = path.join(root, 'generated')
const jsonPath = path.join(generatedDir, 'page-inventory.json')
const mdPath = path.join(generatedDir, 'page-inventory.md')
const taxonomyPath = path.join(root, 'config/public-content-taxonomy.json')
const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'))

const VALID_VISIBILITY = new Set(['public', 'hidden', 'private', 'draft'])
const VALID_CATEGORY = new Set(taxonomy.publicCategories)
const VALID_KIND = new Set(taxonomy.publicKinds)
const PUBLIC_INDEX_CATEGORY = new Set(taxonomy.publicIndexCategories)
const WORK_ROUTE_CATEGORY = new Set(taxonomy.workRouteCategories)
const UTILITY_ROUTE_CATEGORY = new Set(taxonomy.utilityRouteCategories)

const DEFAULT_EXPOSURE_BY_KIND = {
  work: { route: true, home: false, collection: 'works', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  tool: { route: true, home: false, collection: 'tools', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  lab: { route: true, home: false, collection: 'lab', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  product: { route: true, home: false, collection: 'products', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  'case-study': { route: true, home: false, collection: 'works', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  post: { route: true, home: false, collection: 'post', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  page: { route: true, home: false, collection: 'page', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  doc: { route: true, home: false, collection: 'docs', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  catalog: { route: true, home: false, collection: 'products', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  commission: { route: true, home: false, collection: 'works', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    if (entry.isFile() && entry.name === 'index.md') return [full]
    return []
  })
}

function stripQuotes(value) {
  const trimmed = String(value ?? '').trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed.slice(1, -1)
  return trimmed
}

function parseScalar(value) {
  const clean = stripQuotes(value)
  if (clean === 'true') return true
  if (clean === 'false') return false
  if (/^-?\d+(\.\d+)?$/.test(clean)) return Number(clean)
  if (clean === 'null') return null
  return clean
}

function parseFrontmatter(source, file) {
  if (!source.startsWith('---\n')) return { data: {}, body: source }
  const end = source.indexOf('\n---', 4)
  if (end === -1) throw new Error(`Missing closing frontmatter fence: ${file}`)
  const raw = source.slice(4, end).replace(/^\r?\n/, '')
  const body = source.slice(end + 4)
  const data = {}
  const lines = raw.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (!line.trim() || line.trim().startsWith('#')) continue
    const indent = line.match(/^\s*/)?.[0].length ?? 0
    if (indent > 0) continue
    const match = line.trim().match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/)
    if (!match) continue
    const [, key, value = ''] = match
    if (value !== '') {
      data[key] = parseScalar(value)
      continue
    }
    const items = []
    const objectValue = {}
    let cursor = index + 1
    while (cursor < lines.length) {
      const childRaw = lines[cursor]
      if (!childRaw.trim()) { cursor += 1; continue }
      const childIndent = childRaw.match(/^\s*/)?.[0].length ?? 0
      if (childIndent === 0) break
      const item = childRaw.match(/^\s+-\s*(.*)$/)
      if (item) { items.push(parseScalar(item[1])); cursor += 1; continue }
      const child = childRaw.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/)
      if (child) { objectValue[child[1]] = parseScalar(child[2]); cursor += 1; continue }
      break
    }
    if (items.length) data[key] = items
    else if (Object.keys(objectValue).length) data[key] = objectValue
    else data[key] = ''
    index = cursor - 1
  }
  return { data, body }
}

function routeFor(file) {
  const rel = path.relative(pagesRoot, file).replace(/\\/g, '/')
  const dir = rel.replace(/\/index\.md$/, '')
  if (dir === 'home') return '/'
  return `/${dir}`
}

function normalizedPath(value) {
  if (!value) return ''
  const clean = String(value).replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
  return clean === 'home' ? '' : clean
}

function normalizeCategoryToken(value) {
  const normalized = normalizedPath(String(value || '')) || 'page'
  if (normalized === 'works') return 'work'
  if (normalized === 'products') return 'product'
  if (normalized === 'tools') return 'tool'
  if (normalized === 'case-studies') return 'case-study'
  return normalized
}

function readRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function bool(value, fallback) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return fallback
}

function slugPrefix(routePath) {
  return normalizedPath(routePath).split('/').filter(Boolean)[0] || 'home'
}

function categoryFromPath(routePath, data) {
  const category = normalizeCategoryToken(data.category)
  if (data.category) return category
  const first = slugPrefix(routePath)
  if (first === 'works') return 'work'
  if (first === 'products') return 'product'
  if (first === 'tools' || first === 'wiper') return 'tool'
  if (first === 'lab' || first === 'lab-markdown-gallery') return 'lab'
  if (first === 'post') return 'post'
  if (first === 'case-study' || first === 'case-studies') return 'case-study'
  return first === 'home' ? 'page' : first
}

function kindFor(routePath, data) {
  const kind = normalizeCategoryToken(data.kind || data.type || categoryFromPath(routePath, data) || 'page')
  if (UTILITY_ROUTE_CATEGORY.has(kind)) return 'page'
  return kind
}

function visibilityFor(data) {
  if (VALID_VISIBILITY.has(data.visibility)) return data.visibility
  if (data.draft === true) return 'draft'
  if (data.status === 'draft') return 'draft'
  return 'public'
}

function statusFor(data) {
  return String(data.status || 'active')
}

function hasNoindex(data) {
  if (data.noindex === true) return true
  const robots = Array.isArray(data.robots) ? data.robots.join(',') : String(data.robots || '')
  return /noindex/i.test(robots)
}

function resolveExposure(routePath, data) {
  const kind = kindFor(routePath, data)
  const visibility = visibilityFor(data)
  const status = statusFor(data)
  const raw = readRecord(data.exposure)
  const category = categoryFromPath(routePath, data)
  const base = DEFAULT_EXPOSURE_BY_KIND[category] || DEFAULT_EXPOSURE_BY_KIND[kind] || DEFAULT_EXPOSURE_BY_KIND.page
  const exposure = {
    route: bool(raw.route, base.route),
    home: bool(raw.home, base.home),
    collection: String(raw.collection || base.collection || kind),
    search: bool(raw.search, base.search),
    sitemap: bool(raw.sitemap, base.sitemap),
    nav: bool(raw.nav, base.nav),
    featured: bool(raw.featured, base.featured),
    routeOnly: bool(raw.routeOnly, base.routeOnly),
  }
  const blockedReasons = []
  if (visibility !== 'public') {
    exposure.route = false
    exposure.home = false
    exposure.search = false
    exposure.sitemap = false
    exposure.nav = false
    exposure.featured = false
    blockedReasons.push(`visibility:${visibility}`)
  }
  if (status === 'archived' || status === 'trashed') {
    exposure.route = false
    exposure.home = false
    exposure.search = false
    exposure.sitemap = false
    exposure.nav = false
    exposure.featured = false
    blockedReasons.push(`status:${status}`)
  }
  return { ...exposure, blockedReasons }
}

function sectionFor(routePath, data) {
  const exposure = resolveExposure(routePath, data)
  const collection = exposure.collection
  if (collection && collection !== 'none') return collection
  const first = slugPrefix(routePath)
  if (first === 'home') return 'home'
  if (first === 'works') return 'works'
  if (first === 'products') return 'products'
  if (first === 'post') return 'post'
  if (first === 'case-study' || first === 'case-studies') return 'case-study'
  if (first === 'page') return 'page'
  if (first === 'wiper' || String(data.slug || '').startsWith('tools/')) return 'tools'
  if (first === 'lab-markdown-gallery' || String(data.slug || '').startsWith('lab/')) return 'lab'
  if (first === 'inquiry') return 'inquiry'
  if (first === 'claim') return 'claim'
  if (first === 'policies') return 'policies'
  if (first === 'checkout') return 'checkout'
  if (first === 'qa') return 'qa'
  return 'unknown'
}

function issue(severity, code, source, message) {
  return { severity, code, source, message }
}

function surfaces(exposure) {
  return [
    exposure.route ? 'route' : '',
    exposure.collection && exposure.collection !== 'none' ? `collection:${exposure.collection}` : '',
    exposure.home ? 'home' : '',
    exposure.search ? 'search' : '',
    exposure.sitemap ? 'sitemap' : '',
    exposure.nav ? 'nav' : '',
    exposure.featured ? 'featured' : '',
    exposure.routeOnly ? 'routeOnly' : '',
  ].filter(Boolean)
}

function itemFor(file) {
  const relSource = path.relative(root, file).replace(/\\/g, '/')
  const source = fs.readFileSync(file, 'utf8')
  const { data } = parseFrontmatter(source, relSource)
  const routePath = routeFor(file)
  const category = categoryFromPath(routePath, data)
  const kind = kindFor(routePath, data)
  const visibility = visibilityFor(data)
  const status = statusFor(data)
  const exposure = resolveExposure(routePath, data)
  const section = sectionFor(routePath, data)
  const robots = data.robots || null
  return {
    source: relSource,
    routePath,
    slug: data.slug || undefined,
    title: data.title || undefined,
    description: data.description || undefined,
    category,
    kind,
    status,
    visibility,
    featured: data.featured === true || exposure.featured === true,
    order: typeof data.order === 'number' ? data.order : undefined,
    robots,
    noindex: hasNoindex(data),
    section,
    collection: exposure.collection,
    exposure,
    resolvedSurfaces: surfaces(exposure),
    routeEligible: exposure.route,
    homeEligible: exposure.home,
    searchEligible: exposure.search,
    sitemapEligible: exposure.sitemap,
    navEligible: exposure.nav,
    indexEligible: visibility === 'public' && exposure.route && PUBLIC_INDEX_CATEGORY.has(category),
    worksEligible: visibility === 'public' && exposure.route && WORK_ROUTE_CATEGORY.has(category),
    utilityRoute: UTILITY_ROUTE_CATEGORY.has(category),
    tags: Array.isArray(data.tags) ? data.tags : [],
  }
}

function auditItem(item, sourceText) {
  const issues = []
  const sourceLower = item.source.toLowerCase()
  const routeSlug = normalizedPath(item.slug)
  const routePath = normalizedPath(item.routePath)

  if (routeSlug && routeSlug !== routePath) issues.push(issue('warning', 'ROUTE_SLUG_MISMATCH', item.source, `slug "${item.slug}" does not match route path "${item.routePath}".`))
  if ((item.visibility === 'hidden' || item.visibility === 'private' || item.visibility === 'draft') && item.featured) issues.push(issue('error', item.visibility === 'private' ? 'PRIVATE_FEATURED_PAGE' : 'HIDDEN_FEATURED_PAGE', item.source, `${item.visibility} page must not be featured.`))
  if (item.visibility === 'public' && !VALID_CATEGORY.has(item.category)) issues.push(issue('error', 'PUBLIC_CATEGORY_UNKNOWN', item.source, `Unknown public category: ${item.category}.`))
  if (item.visibility === 'public' && !VALID_KIND.has(item.kind)) issues.push(issue('error', 'PUBLIC_KIND_UNKNOWN', item.source, `Unknown public kind: ${item.kind}.`))
  if (item.visibility === 'public' && item.routeEligible) {
    const discovery = item.resolvedSurfaces.filter((surface) => surface !== 'route' && surface !== 'routeOnly')
    if (!discovery.length && item.exposure.routeOnly !== true) issues.push(issue('error', 'ORPHAN_PUBLISHED_MARKDOWN', item.source, 'Public route has no discovery surface and is not routeOnly.'))
  }
  if (item.homeEligible && (!item.collection || item.collection === 'none')) issues.push(issue('error', 'HOMEPAGE_EXPOSURE_REQUEST_UNRESOLVED', item.source, 'Homepage exposure requires a concrete collection.'))
  if (item.visibility === 'public' && item.collection === 'works' && !WORK_ROUTE_CATEGORY.has(item.category)) issues.push(issue('error', 'WORKS_ROUTE_CATEGORY_LEAK', item.source, 'Works route must only expose work/case-study entries.'))
  if (item.visibility === 'public' && item.category === 'post' && item.collection === 'works') issues.push(issue('error', 'POST_LEAKED_INTO_WORKS', item.source, 'Post must not be exposed through works collection.'))
  if (item.visibility === 'public' && item.category === 'page' && item.collection === 'works') issues.push(issue('error', 'PAGE_LEAKED_INTO_WORKS', item.source, 'Page must not be exposed through works collection.'))
  if (item.visibility === 'public' && /dummy/.test(sourceLower)) issues.push(issue('warning', 'PUBLIC_DUMMY_PAGE', item.source, 'Public page path contains dummy; confirm this is intentional.'))
  if (item.visibility === 'public' && /(spec-playground|playground)/.test(sourceLower)) issues.push(issue('warning', 'PUBLIC_PLAYGROUND_PAGE', item.source, 'Public page path contains playground/spec; confirm this is intentional.'))
  if (item.visibility === 'public' && item.section === 'qa') issues.push(issue('warning', 'QA_PAGE_PUBLIC', item.source, 'QA page is public; confirm this is intentional.'))
  if (item.section === 'checkout' && !item.noindex) issues.push(issue('warning', 'CHECKOUT_PAGE_INDEXABLE', item.source, 'Checkout redirect pages should normally be noindex.'))
  if (!item.title) issues.push(issue('warning', 'MISSING_TITLE', item.source, 'Page has no title frontmatter.'))
  const objectLeakToken = `[object ${'Object'}]`
  if (sourceText.includes(objectLeakToken)) issues.push(issue('error', 'OBJECT_OBJECT_LEAK', item.source, 'Source contains object serialization leak.'))
  return issues
}

function renderTable(items) {
  const rows = ['| Section | Collection | Route | Source | Category | Kind | Status | Visibility | Featured | Surfaces | Robots |', '|---|---|---|---|---|---|---|---|---|---|---|']
  for (const item of items) {
    rows.push(`| ${item.section} | ${item.collection || '-'} | ${item.routePath} | ${item.source} | ${item.category} | ${item.kind} | ${item.status || '-'} | ${item.visibility || '-'} | ${String(item.featured)} | ${item.resolvedSurfaces.join(', ') || '-'} | ${Array.isArray(item.robots) ? item.robots.join(', ') : item.robots || '-'} |`)
  }
  return rows.join('\n')
}

function renderIssues(title, issues) {
  if (!issues.length) return `## ${title}\n\nNone.`
  return `## ${title}\n\n${issues.map((item) => `- **${item.code}** ??${item.source}: ${item.message}`).join('\n')}`
}

function build() {
  const pageFiles = walk(pagesRoot).sort()
  const pages = []
  const issues = []
  for (const file of pageFiles) {
    const sourceText = fs.readFileSync(file, 'utf8')
    let item
    try { item = itemFor(file) }
    catch (error) { issues.push(issue('error', 'FRONTMATTER_PARSE_FAILED', path.relative(root, file).replace(/\\/g, '/'), error.message)); continue }
    pages.push(item)
    issues.push(...auditItem(item, sourceText))
  }
  const warnings = issues.filter((item) => item.severity === 'warning')
  const errors = issues.filter((item) => item.severity === 'error')
  const summary = {
    total: pages.length,
    public: pages.filter((item) => item.visibility === 'public').length,
    hidden: pages.filter((item) => item.visibility === 'hidden').length,
    private: pages.filter((item) => item.visibility === 'private').length,
    draft: pages.filter((item) => item.visibility === 'draft').length,
    noindex: pages.filter((item) => item.noindex).length,
    featured: pages.filter((item) => item.featured).length,
    warnings: warnings.length,
    errors: errors.length,
    sections: Object.fromEntries([...new Set(pages.map((item) => item.section))].sort().map((section) => [section, pages.filter((item) => item.section === section).length])),
  }
  const inventory = { generatedAt: new Date().toISOString(), pages, summary, warnings, errors }
  fs.mkdirSync(generatedDir, { recursive: true })
  fs.writeFileSync(jsonPath, `${JSON.stringify(inventory, null, 2)}\n`)
  const publicPages = pages.filter((item) => item.visibility === 'public')
  const hiddenPages = pages.filter((item) => item.visibility !== 'public')
  const noindexPages = pages.filter((item) => item.noindex)
  const featuredPages = pages.filter((item) => item.featured)
  const md = ['# Content Page Inventory', '', `Generated at: ${inventory.generatedAt}`, '', '## Summary', '', `- Total pages: ${summary.total}`, `- Public: ${summary.public}`, `- Hidden: ${summary.hidden}`, `- Private: ${summary.private}`, `- Draft: ${summary.draft}`, `- Noindex: ${summary.noindex}`, `- Featured: ${summary.featured}`, `- Warnings: ${summary.warnings}`, `- Errors: ${summary.errors}`, '', '## Sections', '', '```json', JSON.stringify(summary.sections, null, 2), '```', '', '## Public Pages', '', renderTable(publicPages), '', '## Hidden / Private / Draft Pages', '', renderTable(hiddenPages), '', '## Noindex Pages', '', renderTable(noindexPages), '', '## Featured Pages', '', renderTable(featuredPages), '', renderIssues('Warnings', warnings), '', renderIssues('Errors', errors), ''].join('\n')
  fs.writeFileSync(mdPath, md)
  console.log(`[content:page-inventory] wrote ${path.relative(root, jsonPath)}`)
  console.log(`[content:page-inventory] wrote ${path.relative(root, mdPath)}`)
  console.log(`[content:page-inventory] pages=${summary.total} warnings=${summary.warnings} errors=${summary.errors}`)
  if (errors.length) process.exitCode = 1
}

build()

