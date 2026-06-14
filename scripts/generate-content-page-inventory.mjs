#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const pagesRoot = path.join(root, 'src/content/pages')
const generatedDir = path.join(root, 'generated')
const jsonPath = path.join(generatedDir, 'page-inventory.json')
const mdPath = path.join(generatedDir, 'page-inventory.md')

const VALID_VISIBILITY = new Set(['public', 'hidden', 'private', 'draft'])

function walk(dir) {
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
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
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
  let currentArrayKey = null
  let currentTopLevelKey = null
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const indent = line.match(/^\s*/)?.[0].length ?? 0
    const trimmed = line.trim()

    if (currentArrayKey && indent > 0 && trimmed.startsWith('- ')) {
      data[currentArrayKey].push(parseScalar(trimmed.slice(2)))
      continue
    }

    if (indent > 0) {
      continue
    }

    currentArrayKey = null
    const match = trimmed.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/)
    if (!match) continue
    const [, key, value = ''] = match
    currentTopLevelKey = key
    if (value === '') {
      data[key] = []
      currentArrayKey = key
    } else {
      data[key] = parseScalar(value)
    }
  }
  return { data, body }
}

function routeFor(file) {
  const rel = path.relative(pagesRoot, file).replace(/\\/g, '/')
  const dir = rel.replace(/\/index\.md$/, '')
  if (dir === 'home') return '/'
  return `/${dir}`
}

function sectionFor(routePath, data) {
  const slug = String(data.slug || '').replace(/^\//, '')
  const first = routePath.split('/').filter(Boolean)[0] || 'home'
  if (first === 'home') return 'home'
  if (first === 'works') return 'works'
  if (first === 'products') return 'products'
  if (first === 'wiper' || slug.startsWith('tools/')) return 'tools'
  if (first === 'lab-markdown-gallery' || slug.startsWith('lab/')) return 'lab'
  if (first === 'inquiry') return 'inquiry'
  if (first === 'claim') return 'claim'
  if (first === 'policies') return 'policies'
  if (first === 'checkout') return 'checkout'
  if (first === 'qa') return 'qa'
  return 'unknown'
}

function hasNoindex(data) {
  if (data.noindex === true) return true
  const robots = Array.isArray(data.robots) ? data.robots.join(',') : String(data.robots || '')
  return /noindex/i.test(robots)
}

function normalizedPath(value) {
  if (!value) return ''
  const clean = String(value).replace(/^\/+|\/+$/g, '')
  return clean === 'home' ? '' : clean
}

function issue(severity, code, source, message) {
  return { severity, code, source, message }
}

function itemFor(file) {
  const relSource = path.relative(root, file).replace(/\\/g, '/')
  const source = fs.readFileSync(file, 'utf8')
  const { data } = parseFrontmatter(source, relSource)
  const routePath = routeFor(file)
  const visibility = VALID_VISIBILITY.has(data.visibility) ? data.visibility : 'public'
  const status = data.status || 'active'
  const featured = data.featured === true
  const robots = data.robots || null
  return {
    source: relSource,
    routePath,
    slug: data.slug || undefined,
    title: data.title || undefined,
    description: data.description || undefined,
    kind: data.kind || undefined,
    status,
    visibility,
    featured,
    order: typeof data.order === 'number' ? data.order : undefined,
    robots,
    noindex: hasNoindex(data),
    section: sectionFor(routePath, data),
    tags: Array.isArray(data.tags) ? data.tags : [],
  }
}

function auditItem(item, sourceText) {
  const issues = []
  const sourceLower = item.source.toLowerCase()
  const routeSlug = normalizedPath(item.slug)
  const routePath = normalizedPath(item.routePath)

  if (routeSlug && routeSlug !== routePath) {
    issues.push(issue('warning', 'ROUTE_SLUG_MISMATCH', item.source, `slug "${item.slug}" does not match route path "${item.routePath}".`))
  }

  if ((item.visibility === 'hidden' || item.visibility === 'private' || item.visibility === 'draft') && item.featured) {
    issues.push(issue('error', item.visibility === 'private' ? 'PRIVATE_FEATURED_PAGE' : 'HIDDEN_FEATURED_PAGE', item.source, `${item.visibility} page must not be featured.`))
  }

  if (item.visibility === 'public' && /dummy/.test(sourceLower)) {
    issues.push(issue('warning', 'PUBLIC_DUMMY_PAGE', item.source, 'Public page path contains dummy; confirm this is intentional.'))
  }
  if (item.visibility === 'public' && /(spec-playground|playground)/.test(sourceLower)) {
    issues.push(issue('warning', 'PUBLIC_PLAYGROUND_PAGE', item.source, 'Public page path contains playground/spec; confirm this is intentional.'))
  }
  if (item.visibility === 'public' && item.section === 'qa') {
    issues.push(issue('warning', 'QA_PAGE_PUBLIC', item.source, 'QA page is public; confirm this is intentional.'))
  }
  if (item.section === 'checkout' && !item.noindex) {
    issues.push(issue('warning', 'CHECKOUT_PAGE_INDEXABLE', item.source, 'Checkout redirect pages should normally be noindex.'))
  }
  if (!item.title) {
    issues.push(issue('warning', 'MISSING_TITLE', item.source, 'Page has no title frontmatter.'))
  }
  const objectLeakToken = `[object ${'Object'}]`
  if (sourceText.includes(objectLeakToken)) {
    issues.push(issue('error', 'OBJECT_OBJECT_LEAK', item.source, 'Source contains object serialization leak.'))
  }
  return issues
}

function renderTable(items) {
  const rows = ['| Section | Route | Source | Status | Visibility | Featured | Robots |', '|---|---|---|---|---|---|---|']
  for (const item of items) {
    rows.push(`| ${item.section} | ${item.routePath} | ${item.source} | ${item.status || '-'} | ${item.visibility || '-'} | ${String(item.featured)} | ${Array.isArray(item.robots) ? item.robots.join(', ') : item.robots || '-'} |`)
  }
  return rows.join('\n')
}

function renderIssues(title, issues) {
  if (!issues.length) return `## ${title}\n\nNone.`
  return `## ${title}\n\n${issues.map((item) => `- **${item.code}** — ${item.source}: ${item.message}`).join('\n')}`
}

function build() {
  const pageFiles = walk(pagesRoot).sort()
  const pages = []
  const issues = []
  for (const file of pageFiles) {
    const sourceText = fs.readFileSync(file, 'utf8')
    let item
    try {
      item = itemFor(file)
    } catch (error) {
      issues.push(issue('error', 'FRONTMATTER_PARSE_FAILED', path.relative(root, file).replace(/\\/g, '/'), error.message))
      continue
    }
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
  }

  const inventory = {
    generatedAt: new Date().toISOString(),
    pages,
    summary,
    warnings,
    errors,
  }

  fs.mkdirSync(generatedDir, { recursive: true })
  fs.writeFileSync(jsonPath, `${JSON.stringify(inventory, null, 2)}\n`)

  const publicPages = pages.filter((item) => item.visibility === 'public')
  const hiddenPages = pages.filter((item) => item.visibility !== 'public')
  const noindexPages = pages.filter((item) => item.noindex)
  const featuredPages = pages.filter((item) => item.featured)
  const md = [
    '# Content Page Inventory',
    '',
    `Generated at: ${inventory.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total pages: ${summary.total}`,
    `- Public: ${summary.public}`,
    `- Hidden: ${summary.hidden}`,
    `- Private: ${summary.private}`,
    `- Draft: ${summary.draft}`,
    `- Noindex: ${summary.noindex}`,
    `- Featured: ${summary.featured}`,
    `- Warnings: ${summary.warnings}`,
    `- Errors: ${summary.errors}`,
    '',
    '## Public Pages',
    '',
    renderTable(publicPages),
    '',
    '## Hidden / Private / Draft Pages',
    '',
    renderTable(hiddenPages),
    '',
    '## Noindex Pages',
    '',
    renderTable(noindexPages),
    '',
    '## Featured Pages',
    '',
    renderTable(featuredPages),
    '',
    renderIssues('Warnings', warnings),
    '',
    renderIssues('Errors', errors),
    '',
  ].join('\n')
  fs.writeFileSync(mdPath, md)

  console.log(`[content:page-inventory] wrote ${path.relative(root, jsonPath)}`)
  console.log(`[content:page-inventory] wrote ${path.relative(root, mdPath)}`)
  console.log(`[content:page-inventory] pages=${summary.total} warnings=${summary.warnings} errors=${summary.errors}`)
  if (errors.length) process.exitCode = 1
}

build()
