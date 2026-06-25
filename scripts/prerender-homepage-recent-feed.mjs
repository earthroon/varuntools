#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import process from 'node:process'

const PATCH_ID = 'CMS-207G'
const PASS_STATUS = 'PASS_CMS_207G_HOMEPAGE_STATIC_RECENT_FEED_PRERENDER'
const RECEIPT_FILE = 'homepage-static-recent-feed-receipt.json'
const DIST_HOME = 'dist/index.html'
const CONTENT_ROOT = 'src/content/pages'
const TAXONOMY_FILE = 'config/public-content-taxonomy.json'
const DEFAULT_LIMIT = 6
const INCLUDE_CATEGORIES = ['post', 'work', 'case-study', 'lab', 'tool', 'doc']
const BLOCKED_STATUSES = new Set(['draft', 'archived', 'trashed'])
const BLOCKED_VISIBILITIES = new Set(['hidden', 'private', 'draft'])

const HOME_EYEBROW = '\uCD5C\uADFC \uACF5\uAC1C'
const HOME_TITLE = '\uCD5C\uADFC \uAE00\uACFC \uC791\uC5C5'
const HOME_DESCRIPTION = '\uC0C8\uB85C \uACF5\uAC1C\uB41C \uAE00, \uC791\uC5C5, \uC2E4\uD5D8\uC744 \uD55C \uBC88\uC5D0 \uBD05\uB2C8\uB2E4.'
const HOME_INDEX_LINK_LABEL = '\uC804\uCCB4 \uC778\uB371\uC2A4 \uBCF4\uAE30'

const args = new Set(process.argv.slice(2))
const workflowMode = args.has('--workflow')

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/')
}

function trimSlashes(value) {
  return normalizeSlash(value).replace(/^\/+|\/+$/g, '')
}

function fail(code, message, extra = {}) {
  const receipt = {
    ok: false,
    patchId: PATCH_ID,
    status: 'FAIL_' + PASS_STATUS,
    blockedReasonCode: code,
    blockedReason: message,
    workflowMode,
    ...extra,
    generatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(RECEIPT_FILE, JSON.stringify(receipt, null, 2) + '\n', 'utf8')
  const error = new Error(message)
  error.code = code
  error.extra = extra
  throw error
}

function readJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function parseScalar(raw) {
  let value = String(raw ?? '').trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value)
  return value
}

function parseFrontmatter(markdown) {
  const normalized = String(markdown || '').replace(/^\uFEFF/, '')
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) return { frontmatter: {}, body: normalized }

  const body = match[1]
  const frontmatter = {}
  let currentListKey = ''

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '')
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const listMatch = line.match(/^\s*-\s+(.*)$/)
    if (listMatch && currentListKey) {
      if (!Array.isArray(frontmatter[currentListKey])) frontmatter[currentListKey] = []
      frontmatter[currentListKey].push(parseScalar(listMatch[1]))
      continue
    }

    const index = trimmed.indexOf(':')
    if (index < 0) continue

    const key = trimmed.slice(0, index).trim()
    const rawValue = trimmed.slice(index + 1).trim()
    if (!key) continue

    if (!rawValue) {
      frontmatter[key] = []
      currentListKey = key
      continue
    }

    frontmatter[key] = parseScalar(rawValue)
    currentListKey = ''
  }

  return {
    frontmatter,
    body: normalized.slice(match[0].length),
  }
}

function listMarkdownIndexFiles(root) {
  const out = []
  if (!fs.existsSync(root)) return out
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && entry.name === 'index.md') out.push(normalizeSlash(full))
    }
  }
  walk(root)
  return out.sort()
}

function firstSlugPart(slug) {
  return trimSlashes(slug).split('/').filter(Boolean)[0] || 'page'
}

function normalizePublicCategory(value) {
  const normalized = trimSlashes(value || '')
  if (!normalized) return 'page'
  if (normalized === 'works') return 'work'
  if (normalized === 'products') return 'product'
  if (normalized === 'tools') return 'tool'
  if (normalized === 'case-studies') return 'case-study'
  return normalized
}

function categoryFromSlug(slug) {
  const first = firstSlugPart(slug)
  if (first === 'works') return 'work'
  if (first === 'products') return 'product'
  if (first === 'tools' || first === 'wiper') return 'tool'
  if (first === 'lab' || first === 'lab-markdown-gallery') return 'lab'
  if (first === 'post') return 'post'
  if (first === 'case-study' || first === 'case-studies') return 'case-study'
  return first === 'home' ? 'page' : first
}

function tagsOf(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : []
}

function boolOf(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true' || value.trim() === '1'
  return false
}

function comparableTime(frontmatter, slug) {
  const candidates = [
    frontmatter.publishedDate,
    frontmatter.date,
    frontmatter.updated,
    frontmatter.created,
    frontmatter.year ? `${frontmatter.year}-01-01` : '',
    slug,
  ]

  for (const value of candidates) {
    const text = String(value || '').trim()
    if (!text) continue
    const direct = Date.parse(text)
    if (Number.isFinite(direct)) return direct
    const year = text.match(/(?:19|20)\d{2}/)?.[0]
    if (year) {
      const fallback = Date.parse(`${year}-01-01`)
      if (Number.isFinite(fallback)) return fallback
    }
  }
  return 0
}

function loadExpectedRoute() {
  const receipt = readJson('vacms-materialization-receipt.json', null)
  if (!receipt) return null
  const generatedPath = normalizeSlash(receipt.generatedPath || '')
  const routePath = receipt.routePath
    ? '/' + trimSlashes(receipt.routePath)
    : '/' + trimSlashes(receipt.materializedSlug || generatedPath.replace(/^src\/content\/pages\//, '').replace(/\/index\.md$/, ''))
  return { generatedPath, routePath, slug: trimSlashes(routePath) }
}

function loadTaxonomy() {
  const taxonomy = readJson(TAXONOMY_FILE, {}) || {}
  return {
    labels: taxonomy.labels || {},
    collectionIndexSlugs: new Set((taxonomy.collectionIndexSlugs || []).map(trimSlashes)),
    publicIndexCategories: new Set((taxonomy.publicIndexCategories || []).map(normalizePublicCategory)),
  }
}

function entryFromMarkdown(file, taxonomy) {
  const rel = trimSlashes(path.relative(CONTENT_ROOT, file))
  const contentDir = rel.replace(/\/index\.md$/i, '')
  const markdown = fs.readFileSync(file, 'utf8')
  const { frontmatter } = parseFrontmatter(markdown)
  const slug = trimSlashes(frontmatter.slug || contentDir)
  const category = normalizePublicCategory(frontmatter.category || frontmatter.section || categoryFromSlug(slug || contentDir))
  const status = String(frontmatter.status || 'active').trim().toLowerCase()
  const rawVisibility = String(frontmatter.visibility || '').trim().toLowerCase()
  const visibility = rawVisibility || (frontmatter.draft === true || status === 'draft' ? 'draft' : 'public')
  const title = String(frontmatter.cardTitle || frontmatter.title || slug || contentDir).trim()
  const description = String(frontmatter.cardDescription || frontmatter.summary || frontmatter.description || '').trim()
  const href = slug === 'home' ? '/' : '/' + slug
  const source = String(frontmatter.source || '').trim()
  const featured = boolOf(frontmatter.featured)
  const order = Number.isFinite(Number(frontmatter.order)) ? Number(frontmatter.order) : 9999
  const tags = tagsOf(frontmatter.tags)

  return {
    sourcePath: normalizeSlash(file),
    contentDir,
    slug,
    href,
    title,
    description,
    category,
    categoryLabel: taxonomy.labels[category] || category,
    status,
    visibility,
    source,
    tags,
    featured,
    order,
    time: comparableTime(frontmatter, slug),
  }
}

function isEligible(entry, taxonomy) {
  if (!entry.slug || entry.href === '/') return false
  if (taxonomy.collectionIndexSlugs.has(trimSlashes(entry.slug))) return false
  if (!INCLUDE_CATEGORIES.includes(entry.category)) return false
  if (taxonomy.publicIndexCategories.size && !taxonomy.publicIndexCategories.has(entry.category)) return false
  if (BLOCKED_VISIBILITIES.has(entry.visibility)) return false
  if (BLOCKED_STATUSES.has(entry.status)) return false
  return true
}

function compareEntries(a, b) {
  return (
    b.time - a.time ||
    Number(b.featured) - Number(a.featured) ||
    a.order - b.order ||
    a.title.localeCompare(b.title)
  )
}

function renderTags(tags) {
  const limited = tags.slice(0, 3)
  if (!limited.length) return ''
  return `<ul class="vt-home-recent-public-content__tags" aria-label="??볥젃">${limited.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>`
}

function renderCards(entries) {
  return entries.map((entry) => `
        <article class="vt-home-recent-public-content__card" data-vacms-home-recent-card="true" data-vacms-home-recent-slug="${escapeAttr(entry.slug)}" data-vacms-home-recent-category="${escapeAttr(entry.category)}" data-vacms-home-recent-source="${escapeAttr(entry.source)}">
          <p class="vt-home-recent-public-content__category">${escapeHtml(entry.categoryLabel)}</p>
          <h3 class="vt-home-recent-public-content__title"><a href="${escapeAttr(entry.href)}">${escapeHtml(entry.title)}</a></h3>
          ${entry.description ? `<p class="vt-home-recent-public-content__summary">${escapeHtml(entry.description)}</p>` : ''}
          ${renderTags(entry.tags)}
        </article>`).join('\n')
}

function renderHomeFeed(entries) {
  return `<main id="app" data-vacms-home-static-prerender="true">
    <section class="vt-home-recent-public-content" data-vacms-home-recent-feed="true" aria-labelledby="home-recent-public-content-title">
      <div class="vt-home-recent-public-content__header">
        <p class="vt-home-recent-public-content__eyebrow">筌ㅼ뮄???⑤벀而?/p>
        <div class="vt-home-recent-public-content__heading-row">
          <div>
            <h2 id="home-recent-public-content-title">${HOME_TITLE}</h2>
            <p class="vt-home-recent-public-content__description">${HOME_DESCRIPTION}</p>
          </div>
          <a class="vt-home-recent-public-content__link" href="/index">?袁⑷퍥 ?紐껊쑔??癰귣떯由?/a>
        </div>
      </div>
      <div class="vt-home-recent-public-content__grid">${renderCards(entries)}
      </div>
    </section>
  </main>`
}

function injectHeadMarkers(html, entries) {
  const cleaned = html
    .replace(/\s*<meta name="vacms-home-static-recent-feed" content="[^"]*">/g, '')
    .replace(/\s*<meta name="vacms-home-static-recent-feed-count" content="[^"]*">/g, '')
  const marker = [
    '<meta name="vacms-home-static-recent-feed" content="true">',
    `<meta name="vacms-home-static-recent-feed-count" content="${entries.length}">`,
  ].join('\n    ')
  if (cleaned.includes('</head>')) return cleaned.replace('</head>', `    ${marker}\n  </head>`)
  return marker + '\n' + cleaned
}

function injectHomeFeed(html, feedHtml) {
  const shellPattern = /<div\s+id=["']app["']\s*><\/div>/i
  if (shellPattern.test(html)) return html.replace(shellPattern, feedHtml)

  const previousPattern = /<main\s+id=["']app["'][^>]*data-vacms-home-static-prerender=["']true["'][\s\S]*?<\/main>/i
  if (previousPattern.test(html)) return html.replace(previousPattern, feedHtml)

  if (html.includes('</body>')) return html.replace('</body>', `${feedHtml}\n  </body>`)
  return html + '\n' + feedHtml
}

function main() {
  if (!fs.existsSync(DIST_HOME)) fail('CMS_207G_DIST_HOME_MISSING', 'dist/index.html is missing; run npm run build first.')
  if (!fs.existsSync(CONTENT_ROOT)) fail('CMS_207G_CONTENT_ROOT_MISSING', 'src/content/pages is missing.')

  const taxonomy = loadTaxonomy()
  const expected = loadExpectedRoute()
  const files = listMarkdownIndexFiles(CONTENT_ROOT)
  const allEntries = files.map((file) => entryFromMarkdown(file, taxonomy))
  const eligibleEntries = allEntries.filter((entry) => isEligible(entry, taxonomy)).sort(compareEntries)
  const feedEntries = eligibleEntries.slice(0, DEFAULT_LIMIT)

  if (!feedEntries.length) fail('CMS_207G_NO_HOME_FEED_ENTRIES', 'no eligible public content entries for homepage recent feed')

  const expectedEntry = expected
    ? allEntries.find((entry) => trimSlashes(entry.slug) === trimSlashes(expected.slug))
    : null
  const expectedRouteHomeFeedEligible = expectedEntry ? isEligible(expectedEntry, taxonomy) : false
  const expectedIncluded = expectedRouteHomeFeedEligible
    ? feedEntries.some((entry) => trimSlashes(entry.slug) === trimSlashes(expected.slug))
    : false
  const vacmsPostIncluded = feedEntries.some((entry) => entry.category === 'post' && entry.source === 'vacms')

  if (workflowMode && expected && expectedRouteHomeFeedEligible && !expectedIncluded) {
    fail('CMS_207G_EXPECTED_HOME_ELIGIBLE_ROUTE_NOT_IN_HOME_FEED', 'expected home-eligible VACMS route is not in homepage recent feed: ' + expected.slug, {
      expected,
      expectedEntry,
      expectedRouteHomeFeedEligible,
      feedEntries,
    })
  }

  const originalHtml = fs.readFileSync(DIST_HOME, 'utf8')
  const feedHtml = renderHomeFeed(feedEntries)
  let nextHtml = injectHeadMarkers(originalHtml, feedEntries)
  nextHtml = injectHomeFeed(nextHtml, feedHtml)

  if (!nextHtml.includes('data-vacms-home-static-prerender="true"')) fail('CMS_207G_HOME_STATIC_MARKER_MISSING', 'home static prerender marker was not injected')
  if (!nextHtml.includes('data-vacms-home-recent-feed="true"')) fail('CMS_207G_HOME_FEED_MARKER_MISSING', 'home recent feed marker was not injected')
  if (!nextHtml.includes('data-vacms-home-recent-card="true"')) fail('CMS_207G_HOME_CARD_MARKER_MISSING', 'home recent card marker was not injected')

  fs.writeFileSync(DIST_HOME, nextHtml, 'utf8')

  const includedEntries = feedEntries.map((entry) => ({
    slug: entry.slug,
    href: entry.href,
    title: entry.title,
    category: entry.category,
    source: entry.source,
    sourcePath: entry.sourcePath,
  }))

  const receipt = {
    ok: true,
    patchId: PATCH_ID,
    status: PASS_STATUS,
    workflowMode,
    distHomePath: DIST_HOME,
    distHomeSha256: hashFile(DIST_HOME),
    homeSurfaceRewritten: true,
    feedEntryCount: feedEntries.length,
    vacmsPostIncluded,
    expectedRouteIncluded: expectedIncluded,
    expectedRouteHomeFeedEligible,
    expectedRouteCategory: expectedEntry?.category ?? null,
    expected,
    includedEntries,
    generatedAt: new Date().toISOString(),
  }

  fs.writeFileSync(RECEIPT_FILE, JSON.stringify(receipt, null, 2) + '\n', 'utf8')
  console.log(PASS_STATUS)
  console.log('feedEntryCount=' + feedEntries.length)
  if (expected) console.log('expectedRouteIncluded=' + expectedIncluded)
}

main()
