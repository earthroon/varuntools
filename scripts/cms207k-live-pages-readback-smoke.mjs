import fs from 'node:fs'
import childProcess from 'node:child_process'

const PATCH_ID = 'CMS-207K'
const PASS_STATUS = 'PASS_CMS_207K_LIVE_PAGES_READBACK'
const FAIL_STATUS = 'FAIL_CMS_207K_LIVE_PAGES_READBACK'
const RECEIPT_PATH = 'vacms-live-pages-readback-receipt.json'
const LIVE_ORIGIN = String(process.env.LIVE_ORIGIN || 'https://www.varun.tools').replace(/\/+$/, '')
const RETRY_COUNT = readPositiveInt(process.env.LIVE_READBACK_RETRY_COUNT, 12)
const RETRY_DELAY_MS = readPositiveInt(process.env.LIVE_READBACK_RETRY_DELAY_MS, 10000)

function readPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function readJson(path, code) {
  if (!fs.existsSync(path)) {
    fail(code, `${path} is missing`, { path })
  }
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  } catch (error) {
    fail(code + '_INVALID_JSON', `${path} is invalid JSON: ${errorMessage(error)}`, { path })
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function git(args, code) {
  try {
    return childProcess.execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (error) {
    fail(code, `git ${args.join(' ')} failed: ${errorMessage(error)}`, { args })
  }
}

function deriveSlugFromGeneratedPath(value) {
  return String(value || '')
    .replace(/^src\/content\/pages\//, '')
    .replace(/^src\/content\/generated\//, '')
    .replace(/^public\/content\//, '')
    .replace(/\/index\.md$/, '')
    .replace(/\/index\.html$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/')
}

function normalizeHref(value) {
  const text = String(value || '')
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '')
  return text.startsWith('/') ? text : '/' + text.replace(/^\/+/, '')
}

function routeHtmlPathFromHref(value) {
  const href = normalizeHref(value)
  const slug = href.replace(/^\/+|\/+$/g, '')
  return slug ? `${slug}/index.html` : 'index.html'
}

function extractLatestAsset(indexHtml) {
  const matches = [...String(indexHtml || '').matchAll(/<script\b[^>]*\bsrc=["'](?<src>\/assets\/index-[^"']+\.js)["'][^>]*>/g)]
  const src = matches.at(-1)?.groups?.src || ''
  if (!src) {
    fail('CMS_207K_GH_PAGES_INDEX_ASSET_MISSING', 'origin/gh-pages:index.html does not include a Vite index asset')
  }
  return src
}

function isHtmlFallback(text) {
  const head = String(text || '').slice(0, 2048).toLowerCase()
  return head.includes('<!doctype html') || head.includes('<html') || head.includes('<div id="app"></div>')
}

function isEmptySpaShell(text) {
  const body = String(text || '')
  return body.includes('<div id="app"></div>') &&
    !body.includes('data-vacms-static-article') &&
    !body.includes('vacms-static-route') &&
    !body.includes('data-vacms-home-static-prerender')
}

function preview(text) {
  return String(text || '').replace(/\s+/g, ' ').slice(0, 240)
}

async function requestText(url, accept) {
  const response = await fetch(url, {
    headers: {
      Accept: accept,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    cache: 'no-store',
    redirect: 'follow',
  })
  const text = await response.text()
  return {
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    text,
    url,
  }
}

function buildUrl(path) {
  const normalized = String(path || '/').startsWith('/') ? String(path || '/') : '/' + String(path || '')
  const sep = normalized.includes('?') ? '&' : '?'
  return `${LIVE_ORIGIN}${normalized}${sep}cms207k=${Date.now()}`
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function entryMatchesRoute(entry, routeHref, slug) {
  const candidates = [entry?.slug, entry?.href, entry?.contentDir, entry?.sourcePath]
    .map((value) => String(value || '').replace(/^src\/content\/pages\//, '').replace(/\/index\.md$/, '').replace(/^\/+|\/+$/g, ''))
  const routeNoSlash = routeHref.replace(/^\/+|\/+$/g, '')
  return candidates.some((candidate) => candidate === slug || candidate === routeNoSlash || candidate.endsWith('/' + slug))
}

function writeReceipt(receipt) {
  fs.writeFileSync(RECEIPT_PATH, JSON.stringify(receipt, null, 2))
}

function fail(code, message, detail = {}) {
  const receipt = {
    ok: false,
    patchId: PATCH_ID,
    status: FAIL_STATUS,
    failureCode: code,
    message,
    liveOrigin: LIVE_ORIGIN,
    checkedAt: new Date().toISOString(),
    branchOnlySuccessBlocked: true,
    finalizeAllowed: false,
    ...detail,
  }
  writeReceipt(receipt)
  console.error(`${FAIL_STATUS}: ${code}`)
  console.error(message)
  process.exit(1)
}

function attemptFailure(code, message, detail = {}) {
  return { code, message, detail }
}

async function checkLiveOnce(context, attempt) {
  const home = await requestText(buildUrl('/'), 'text/html')
  if (!home.ok) {
    return attemptFailure('CMS_207K_LIVE_HOME_HTTP_ERROR', `Live home returned HTTP ${home.status}`, { status: home.status })
  }
  if (!home.text.includes(context.latestAsset)) {
    return attemptFailure('CMS_207K_LIVE_HOME_OLD_ASSET', 'Live home does not include latest gh-pages asset', {
      latestAsset: context.latestAsset,
      responsePreview: preview(home.text),
    })
  }
  if (!home.text.includes('vacms-home-static-recent-feed') && !home.text.includes('data-vacms-home-static-prerender')) {
    return attemptFailure('CMS_207K_LIVE_HOME_STATIC_MARKER_MISSING', 'Live home does not include VACMS static home markers', {
      responsePreview: preview(home.text),
    })
  }

  const asset = await requestText(buildUrl(context.latestAsset), '*/*')
  if (!asset.ok) {
    return attemptFailure('CMS_207K_LIVE_LATEST_ASSET_404', `Live latest asset returned HTTP ${asset.status}`, {
      latestAsset: context.latestAsset,
      status: asset.status,
      responsePreview: preview(asset.text),
    })
  }
  if (!/javascript|ecmascript|text\/plain/i.test(asset.contentType)) {
    return attemptFailure('CMS_207K_LIVE_LATEST_ASSET_CONTENT_TYPE', 'Live latest asset did not return a JavaScript-like content type', {
      latestAsset: context.latestAsset,
      contentType: asset.contentType,
    })
  }
  if (isHtmlFallback(asset.text)) {
    return attemptFailure('CMS_207K_LIVE_LATEST_ASSET_HTML_FALLBACK', 'Live latest asset returned HTML fallback', {
      latestAsset: context.latestAsset,
      responsePreview: preview(asset.text),
    })
  }

  const publicIndex = await requestText(buildUrl('/public-content-index.json'), 'application/json')
  if (!publicIndex.ok) {
    return attemptFailure('CMS_207K_LIVE_PUBLIC_INDEX_404', `Live public content index returned HTTP ${publicIndex.status}`, {
      status: publicIndex.status,
      responsePreview: preview(publicIndex.text),
    })
  }
  if (isHtmlFallback(publicIndex.text)) {
    return attemptFailure('CMS_207K_LIVE_PUBLIC_INDEX_HTML_FALLBACK', 'Live /public-content-index.json returned HTML fallback instead of JSON', {
      responsePreview: preview(publicIndex.text),
    })
  }

  let publicIndexJson
  try {
    publicIndexJson = JSON.parse(publicIndex.text)
  } catch (error) {
    return attemptFailure('CMS_207K_LIVE_PUBLIC_INDEX_INVALID_JSON', `Live public content index is invalid JSON: ${errorMessage(error)}`, {
      responsePreview: preview(publicIndex.text),
    })
  }
  if (!publicIndexJson || publicIndexJson.schemaVersion !== 'cms-public-content-index.v1' || !Array.isArray(publicIndexJson.entries)) {
    return attemptFailure('CMS_207K_LIVE_PUBLIC_INDEX_SCHEMA_MISMATCH', 'Live public content index schema mismatch', {
      responsePreview: preview(publicIndex.text),
    })
  }
  if (publicIndexJson.patchId !== 'CMS-207H') {
    return attemptFailure('CMS_207K_LIVE_PUBLIC_INDEX_PATCH_MISMATCH', 'Live public content index patchId is not CMS-207H', {
      patchId: publicIndexJson.patchId || '',
    })
  }
  if (!publicIndexJson.entries.some((entry) => entryMatchesRoute(entry, context.routeHref, context.routeSlug))) {
    return attemptFailure('CMS_207K_LIVE_PUBLIC_INDEX_ROUTE_MISSING', 'Live public content index does not include generated route', {
      routeHref: context.routeHref,
      routeSlug: context.routeSlug,
    })
  }

  const route = await requestText(buildUrl(context.routeHref.endsWith('/') ? context.routeHref : context.routeHref + '/'), 'text/html')
  if (!route.ok) {
    return attemptFailure('CMS_207K_LIVE_ROUTE_404', `Live route returned HTTP ${route.status}`, {
      routeHref: context.routeHref,
      status: route.status,
      responsePreview: preview(route.text),
    })
  }
  if (isEmptySpaShell(route.text)) {
    return attemptFailure('CMS_207K_LIVE_ROUTE_HTML_FALLBACK', 'Live route returned empty SPA shell instead of static article HTML', {
      routeHref: context.routeHref,
      responsePreview: preview(route.text),
    })
  }
  if (!route.text.includes('data-vacms-static-article') && !route.text.includes('vacms-static-article')) {
    return attemptFailure('CMS_207K_LIVE_ROUTE_ARTICLE_MARKER_MISSING', 'Live route is missing VACMS static article marker', {
      routeHref: context.routeHref,
      responsePreview: preview(route.text),
    })
  }
  if (!route.text.includes(context.routeSlug) && context.title && !route.text.includes(context.title)) {
    return attemptFailure('CMS_207K_LIVE_ROUTE_TITLE_OR_SLUG_MISSING', 'Live route does not include generated slug or title', {
      routeHref: context.routeHref,
      routeSlug: context.routeSlug,
      title: context.title,
      responsePreview: preview(route.text),
    })
  }

  const receipt = {
    ok: true,
    patchId: PATCH_ID,
    status: PASS_STATUS,
    liveOrigin: LIVE_ORIGIN,
    checkedAt: new Date().toISOString(),
    attempts: attempt,
    ghPages: {
      branch: 'origin/gh-pages',
      latestAsset: context.latestAsset,
      publicIndexPresent: true,
      routeHtmlPresent: true,
    },
    live: {
      homeHtmlOk: true,
      latestAssetOk: true,
      publicIndexJsonOk: true,
      routeHtmlOk: true,
      routeArticleMarkerOk: true,
    },
    route: {
      slug: context.routeSlug,
      href: context.routeHref,
      titleMatched: Boolean(context.title),
    },
    branchOnlySuccessBlocked: true,
    finalizeAllowed: true,
  }
  writeReceipt(receipt)
  console.log(PASS_STATUS)
  console.log(`liveOrigin=${LIVE_ORIGIN}`)
  console.log(`routeHref=${context.routeHref}`)
  console.log(`latestAsset=${context.latestAsset}`)
  return null
}

async function main() {
  const materialization = readJson('vacms-materialization-receipt.json', 'CMS_207K_MATERIALIZATION_RECEIPT_MISSING')
  readJson('vacms-pages-deploy-evidence.json', 'CMS_207K_DEPLOY_EVIDENCE_MISSING')
  readJson('public-content-index-receipt.json', 'CMS_207K_PUBLIC_INDEX_RECEIPT_MISSING')
  if (fs.existsSync('vacms-gh-pages-route-index-readback-receipt.json')) {
    readJson('vacms-gh-pages-route-index-readback-receipt.json', 'CMS_207K_GH_PAGES_ROUTE_INDEX_RECEIPT_MISSING')
  }

  git(['fetch', 'origin', 'gh-pages'], 'CMS_207K_GH_PAGES_FETCH_FAILED')
  const ghPagesIndexHtml = git(['show', 'origin/gh-pages:index.html'], 'CMS_207K_GH_PAGES_INDEX_MISSING')
  const latestAsset = extractLatestAsset(ghPagesIndexHtml)
  const ghPagesPublicIndex = git(['show', 'origin/gh-pages:public-content-index.json'], 'CMS_207K_GH_PAGES_PUBLIC_INDEX_MISSING')
  if (isHtmlFallback(ghPagesPublicIndex)) {
    fail('CMS_207K_GH_PAGES_PUBLIC_INDEX_HTML_FALLBACK', 'origin/gh-pages public-content-index.json is HTML fallback')
  }

  const generatedPath = String(materialization.generatedPath || '')
  const routeHref = normalizeHref(materialization.routePath || materialization.href || deriveSlugFromGeneratedPath(generatedPath))
  const routeSlug = routeHref.replace(/^\/+|\/+$/g, '')
  const routeHtmlPath = routeHtmlPathFromHref(routeHref)
  const ghPagesRouteHtml = git(['show', `origin/gh-pages:${routeHtmlPath}`], 'CMS_207K_GH_PAGES_ROUTE_MISSING')
  if (isEmptySpaShell(ghPagesRouteHtml)) {
    fail('CMS_207K_GH_PAGES_ROUTE_HTML_FALLBACK', 'origin/gh-pages route HTML is empty SPA shell', { routeHtmlPath })
  }

  const context = {
    latestAsset,
    routeHref,
    routeSlug,
    title: String(materialization.title || materialization.pageTitle || ''),
  }

  let lastFailure = null
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      lastFailure = await checkLiveOnce(context, attempt)
      if (!lastFailure) return
    } catch (error) {
      lastFailure = attemptFailure('CMS_207K_LIVE_READBACK_EXCEPTION', errorMessage(error))
    }
    console.warn(`CMS-207K live readback attempt ${attempt}/${RETRY_COUNT} failed: ${lastFailure.code} ${lastFailure.message}`)
    if (attempt < RETRY_COUNT) await sleep(RETRY_DELAY_MS)
  }

  fail('CMS_207K_LIVE_READBACK_TIMEOUT', 'Live readback did not converge before timeout', {
    attempts: RETRY_COUNT,
    lastFailure,
    liveOrigin: LIVE_ORIGIN,
    routeHref,
    latestAsset,
  })
}

await main()
