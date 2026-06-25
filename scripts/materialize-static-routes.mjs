#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import process from 'node:process'
import { renderStaticArticleHtml, splitFrontmatter } from './render-static-article-html.mjs'

const PATCH_ID = 'CMS-207D'
const PASS_STATUS = 'PASS_CMS_207D_STATIC_ARTICLE_HTML_PRERENDER'
const RECEIPT_FILE = 'static-route-materialization-receipt.json'
const DIST_DIR = 'dist'
const CONTENT_ROOT = 'src/content/pages'
const INDEX_HTML = path.join(DIST_DIR, 'index.html')

const args = new Set(process.argv.slice(2))
const workflowMode = args.has('--workflow')

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/')
}

function trimSlashes(value) {
  return normalizeSlash(value).replace(/^\/+|\/+$/g, '')
}

function escapeHtmlAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function fail(code, message, extra = {}) {
  const receipt = {
    ok: false,
    patchId: PATCH_ID,
    status: 'FAIL_' + PASS_STATUS,
    blockedReasonCode: code,
    blockedReason: message,
    ...extra,
    generatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(RECEIPT_FILE, JSON.stringify(receipt, null, 2) + '\n', 'utf8')
  const error = new Error(message)
  error.code = code
  error.extra = extra
  throw error
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function isSafeRoute(routePath) {
  const route = trimSlashes(routePath)
  if (!route) return false
  if (route.includes('..')) return false
  if (path.isAbsolute(route)) return false
  if (route.split('/').some((segment) => !segment || segment.startsWith('.'))) return false
  return /^[a-zA-Z0-9/_-]+$/.test(route)
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

function routeFromMarkdownFile(file) {
  const rel = trimSlashes(path.relative(CONTENT_ROOT, file))
  const withoutIndex = rel.replace(/\/index\.md$/i, '')
  const parts = withoutIndex.split('/').filter(Boolean)
  if (parts.length < 1) return null

  const markdown = fs.readFileSync(file, 'utf8')
  const { frontmatter } = splitFrontmatter(markdown)
  const pathCategory = parts[0]
  const category = trimSlashes(frontmatter.category || pathCategory || 'page')
  let slug = trimSlashes(frontmatter.slug || withoutIndex)

  if (!slug) slug = withoutIndex
  const route = slug === category || slug.startsWith(category + '/') ? '/' + slug : '/' + trimSlashes(category + '/' + slug)
  const visibility = String(frontmatter.visibility || 'public')
  const status = String(frontmatter.status || frontmatter.state || 'published')
  const exposure = String(frontmatter.exposure || '')
  const hidden = visibility === 'private' || visibility === 'hidden' || visibility === 'draft'
  const blockedStatus = status === 'draft' || status === 'archived' || status === 'trashed'
  const blockedExposure = exposure === 'none' || exposure === 'private'

  return {
    sourcePath: normalizeSlash(file),
    routePath: route,
    staticRoutePath: trimSlashes(route) + '/index.html',
    distStaticRoutePath: normalizeSlash(path.join(DIST_DIR, trimSlashes(route), 'index.html')),
    category,
    slug,
    visibility,
    status,
    skipped: hidden || blockedStatus || blockedExposure,
    skipReason: hidden ? 'non_public_visibility' : blockedStatus ? 'non_public_status' : blockedExposure ? 'non_public_exposure' : null,
  }
}

function injectRouteMarkers(template, route, renderResult) {
  const marker = [
    `<meta name="vacms-static-route" content="${escapeHtmlAttr(route.routePath)}">`,
    `<meta name="vacms-static-route-source" content="${escapeHtmlAttr(route.sourcePath)}">`,
    `<meta name="vacms-static-article-prerender" content="true">`,
    `<meta name="vacms-static-article-title" content="${escapeHtmlAttr(renderResult.title)}">`,
  ].join('\n    ')

  const existing = template
    .replace(/\s*<meta name="vacms-static-route" content="[^"]*">/g, '')
    .replace(/\s*<meta name="vacms-static-route-source" content="[^"]*">/g, '')
    .replace(/\s*<meta name="vacms-static-article-prerender" content="[^"]*">/g, '')
    .replace(/\s*<meta name="vacms-static-article-title" content="[^"]*">/g, '')

  if (existing.includes('</head>')) return existing.replace('</head>', `    ${marker}\n  </head>`)
  return marker + '\n' + existing
}

function injectStaticArticle(template, renderResult) {
  if (template.includes('<div id="app"></div>')) return template.replace('<div id="app"></div>', renderResult.html)
  if (template.includes("<div id='app'></div>")) return template.replace("<div id='app'></div>", renderResult.html)
  const appOpen = template.match(/<div\s+id=["']app["'][^>]*>/)
  if (appOpen && appOpen.index >= 0) {
    const start = appOpen.index
    const afterOpen = start + appOpen[0].length
    const end = template.indexOf('</div>', afterOpen)
    if (end >= 0) return template.slice(0, start) + renderResult.html + template.slice(end + '</div>'.length)
  }
  if (template.includes('</body>')) return template.replace('</body>', `${renderResult.html}\n  </body>`)
  return template + '\n' + renderResult.html
}

function renderRouteHtml(template, route, renderResult) {
  return injectStaticArticle(injectRouteMarkers(template, route, renderResult), renderResult)
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function loadExpectedRoute() {
  if (!fs.existsSync('vacms-materialization-receipt.json')) return null
  const receipt = readJson('vacms-materialization-receipt.json')
  const generatedPath = normalizeSlash(receipt.generatedPath || '')
  const routePath = receipt.routePath ? '/' + trimSlashes(receipt.routePath) : '/' + trimSlashes(receipt.materializedSlug || generatedPath.replace(/^src\/content\/pages\//, '').replace(/\/index\.md$/, ''))
  return {
    generatedPath,
    routePath,
    staticRoutePath: trimSlashes(routePath) + '/index.html',
    materializationReceipt: 'vacms-materialization-receipt.json',
  }
}

function main() {
  if (!fs.existsSync(INDEX_HTML)) fail('CMS_207D_DIST_INDEX_MISSING', 'dist/index.html is missing; run npm run build first.')
  if (!fs.existsSync(CONTENT_ROOT)) fail('CMS_207D_CONTENT_ROOT_MISSING', 'src/content/pages is missing.')

  const template = fs.readFileSync(INDEX_HTML, 'utf8')
  const files = listMarkdownIndexFiles(CONTENT_ROOT)
  const candidates = files.map(routeFromMarkdownFile).filter(Boolean)
  const routes = candidates.filter((route) => !route.skipped && isSafeRoute(route.routePath))
  const expected = loadExpectedRoute()

  if (workflowMode && !expected) fail('CMS_207D_MATERIALIZATION_RECEIPT_MISSING', 'workflow mode requires vacms-materialization-receipt.json')
  if (workflowMode && expected && !fs.existsSync(expected.generatedPath)) {
    fail('CMS_207D_EXPECTED_SOURCE_MISSING', 'generated source from materialization receipt is missing: ' + expected.generatedPath, { expected })
  }

  const byRoute = new Map(routes.map((route) => [trimSlashes(route.routePath), route]))
  if (expected) {
    const key = trimSlashes(expected.routePath)
    if (!byRoute.has(key)) {
      const source = expected.generatedPath
      const forced = {
        sourcePath: source,
        routePath: '/' + key,
        staticRoutePath: key + '/index.html',
        distStaticRoutePath: normalizeSlash(path.join(DIST_DIR, key, 'index.html')),
        category: key.split('/')[0] || 'page',
        slug: key,
        visibility: 'public',
        status: 'published',
        skipped: false,
        skipReason: null,
      }
      if (isSafeRoute(forced.routePath)) byRoute.set(key, forced)
    }
  }

  const materialized = []
  for (const route of Array.from(byRoute.values()).sort((a, b) => a.staticRoutePath.localeCompare(b.staticRoutePath))) {
    const renderResult = renderStaticArticleHtml(route.sourcePath)
    if (!renderResult.ok) fail('CMS_207D_STATIC_ARTICLE_EMPTY', 'static article render result is empty: ' + route.sourcePath, { route, diagnostics: renderResult.diagnostics })
    if (renderResult.diagnostics.rawDirectiveLeakCount > 0) fail('CMS_207D_RAW_DIRECTIVE_LEAK', 'raw directive leaked into static article HTML: ' + route.sourcePath, { route, diagnostics: renderResult.diagnostics })
    const html = renderRouteHtml(template, route, renderResult)
    if (!html.includes('data-vacms-static-article="true"')) fail('CMS_207D_STATIC_ARTICLE_MARKER_MISSING', 'static article marker missing after injection: ' + route.sourcePath)
    if (!html.includes('data-vacms-static-prerender="true"')) fail('CMS_207D_STATIC_PRERENDER_MARKER_MISSING', 'static prerender marker missing after injection: ' + route.sourcePath)
    if (/<div\s+id=["']app["']\s*>\s*<\/div>/i.test(html)) fail('CMS_207D_EMPTY_APP_SHELL_LEAK', 'empty app shell leaked into static route HTML: ' + route.staticRoutePath)

    fs.mkdirSync(path.dirname(route.distStaticRoutePath), { recursive: true })
    fs.writeFileSync(route.distStaticRoutePath, html, 'utf8')
    materialized.push({
      sourcePath: route.sourcePath,
      routePath: route.routePath,
      staticRoutePath: route.staticRoutePath,
      distStaticRoutePath: route.distStaticRoutePath,
      sha256: hashFile(route.distStaticRoutePath),
      staticArticlePrerendered: true,
      renderedArticleHtmlLength: renderResult.diagnostics.renderedHtmlLength,
      markdownBodyLength: renderResult.diagnostics.markdownBodyLength,
      directiveCount: renderResult.diagnostics.directiveCount,
      unknownDirectives: renderResult.diagnostics.unknownDirectives,
      rawDirectiveLeakCount: renderResult.diagnostics.rawDirectiveLeakCount,
      title: renderResult.title,
      summary: renderResult.summary,
    })
  }

  if (!materialized.length) fail('CMS_207D_NO_STATIC_ROUTES', 'no static article routes were materialized from src/content/pages/**/*.md')

  const expectedRoute = expected ? materialized.find((route) => trimSlashes(route.routePath) === trimSlashes(expected.routePath)) || null : null
  if (workflowMode && !expectedRoute) {
    fail('CMS_207D_EXPECTED_STATIC_ARTICLE_MISSING', 'expected VACMS route was not materialized as static article: ' + expected.routePath, { expected })
  }

  const receipt = {
    ok: true,
    patchId: PATCH_ID,
    status: PASS_STATUS,
    workflowMode,
    expectedRoute,
    materializedRouteCount: materialized.length,
    routes: materialized,
    skippedRoutes: candidates.filter((route) => route?.skipped).map((route) => ({ sourcePath: route.sourcePath, routePath: route.routePath, skipReason: route.skipReason })),
    staticArticlePrerendered: true,
    emptyAppShell: false,
    rawDirectiveLeakCount: materialized.reduce((sum, route) => sum + route.rawDirectiveLeakCount, 0),
    generatedAt: new Date().toISOString(),
  }
  if (expectedRoute) {
    receipt.source = expectedRoute.sourcePath
    receipt.routePath = expectedRoute.routePath
    receipt.staticRoutePath = expectedRoute.staticRoutePath
    receipt.distStaticRoutePath = expectedRoute.distStaticRoutePath
    receipt.staticRouteSha256 = expectedRoute.sha256
    receipt.renderedArticleHtmlLength = expectedRoute.renderedArticleHtmlLength
    receipt.staticArticleTitle = expectedRoute.title
  }
  fs.writeFileSync(RECEIPT_FILE, JSON.stringify(receipt, null, 2) + '\n', 'utf8')
  console.log(PASS_STATUS)
  console.log('materializedRouteCount=' + materialized.length)
  if (expectedRoute) console.log('staticRoutePath=' + expectedRoute.staticRoutePath)
}

main()
