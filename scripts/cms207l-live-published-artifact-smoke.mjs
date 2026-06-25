#!/usr/bin/env node
import fs from 'node:fs'

const PATCH_ID = 'CMS-207L'
const RECEIPT = 'vacms-live-published-artifact-receipt.json'
const LIVE_ORIGIN = String(process.env.LIVE_ORIGIN || 'https://www.varun.tools').replace(/\/+$/, '')
const RETRY_COUNT = Math.max(1, Number.parseInt(process.env.LIVE_READBACK_RETRY_COUNT || '18', 10) || 18)
const RETRY_DELAY_MS = Math.max(0, Number.parseInt(process.env.LIVE_READBACK_RETRY_DELAY_MS || '10000', 10) || 10000)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readJson(file, code) {
  if (!fs.existsSync(file)) throw makeError(code, `${file} is missing`)
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    throw makeError(code, `${file} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function makeError(code, message, extra = {}) {
  const error = new Error(message)
  error.code = code
  error.extra = extra
  return error
}

function normalizeRoute(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/[?#].*$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/, '/')
}

function buildLiveUrl(pathname, accept, attempt) {
  const cleaned = pathname.startsWith('/') ? pathname : '/' + pathname
  const joiner = cleaned.includes('?') ? '&' : '?'
  return {
    url: LIVE_ORIGIN + cleaned + joiner + 'cms207l=' + Date.now() + '-' + attempt,
    headers: {
      Accept: accept,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  }
}

async function requestText(pathname, accept, attempt, failureCode) {
  const { url, headers } = buildLiveUrl(pathname, accept, attempt)
  let response
  try {
    response = await fetch(url, { headers, cache: 'no-store', redirect: 'follow' })
  } catch (error) {
    throw makeError(failureCode, `Live request failed for ${pathname}: ${error instanceof Error ? error.message : String(error)}`, { url })
  }
  const text = await response.text()
  return {
    url,
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get('content-type') || '',
    text,
  }
}

function isHtmlFallback(text) {
  const lowered = String(text || '').slice(0, 512).toLowerCase()
  return lowered.includes('<!doctype html') || lowered.includes('<html') || lowered.includes('<div id="app"></div>')
}

function routeFromMaterialization(receipt) {
  const explicit = normalizeRoute(receipt.routePath)
  if (explicit) return explicit
  const materialized = normalizeRoute(receipt.materializedSlug || receipt.slug)
  if (materialized) return materialized
  return normalizeRoute(String(receipt.generatedPath || '').replace(/^src\/content\/pages\//, '').replace(/\/index\.md$/, ''))
}

function routeUrlPath(routeSlug) {
  return '/' + routeSlug.replace(/^\/+|\/+$/g, '') + '/'
}

function writeReceipt(ok, data) {
  const receipt = {
    ok,
    patchId: PATCH_ID,
    checkedAt: new Date().toISOString(),
    liveOrigin: LIVE_ORIGIN,
    ...data,
  }
  fs.writeFileSync(RECEIPT, JSON.stringify(receipt, null, 2))
  return receipt
}

async function verifyOnce(attempt, context) {
  const { strategy, latestAsset, routeSlug, routeHref, routeTitle } = context

  const home = await requestText('/', 'text/html', attempt, 'CMS_207L_LIVE_HOME_REQUEST_FAILED')
  if (!home.ok) throw makeError('CMS_207L_LIVE_HOME_404', 'Live home did not return HTTP 200', { status: home.status, url: home.url })
  if (!home.text.includes(latestAsset)) {
    throw makeError('CMS_207L_LIVE_HOME_OLD_ASSET', 'Live home does not include latest dist asset', {
      expectedAsset: latestAsset,
      status: home.status,
      url: home.url,
    })
  }
  if (!home.text.includes('vacms-home-static-recent-feed') && !home.text.includes('data-vacms-home-static-prerender')) {
    throw makeError('CMS_207L_LIVE_HOME_STATIC_MARKER_MISSING', 'Live home does not include VACMS static home marker', { url: home.url })
  }

  const asset = await requestText(latestAsset, 'application/javascript,text/javascript,*/*', attempt, 'CMS_207L_LIVE_LATEST_ASSET_REQUEST_FAILED')
  if (!asset.ok) throw makeError('CMS_207L_LIVE_LATEST_ASSET_404', 'Live latest asset did not return HTTP 200', { status: asset.status, url: asset.url, latestAsset })
  if (isHtmlFallback(asset.text)) throw makeError('CMS_207L_LIVE_LATEST_ASSET_HTML_FALLBACK', 'Live latest asset returned HTML fallback', { url: asset.url })

  const publicIndex = await requestText('/public-content-index.json', 'application/json', attempt, 'CMS_207L_LIVE_PUBLIC_INDEX_REQUEST_FAILED')
  if (!publicIndex.ok) throw makeError('CMS_207L_LIVE_PUBLIC_INDEX_404', 'Live public-content-index.json did not return HTTP 200', { status: publicIndex.status, url: publicIndex.url })
  if (isHtmlFallback(publicIndex.text)) {
    throw makeError('CMS_207L_LIVE_PUBLIC_INDEX_HTML_FALLBACK', 'Live public-content-index.json returned HTML fallback instead of JSON', { url: publicIndex.url, preview: publicIndex.text.slice(0, 128) })
  }
  let publicIndexJson
  try {
    publicIndexJson = JSON.parse(publicIndex.text)
  } catch (error) {
    throw makeError('CMS_207L_LIVE_PUBLIC_INDEX_INVALID_JSON', `Live public-content-index.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}`, { url: publicIndex.url })
  }
  if (!publicIndexJson || publicIndexJson.schemaVersion !== 'cms-public-content-index.v1' || !Array.isArray(publicIndexJson.entries)) {
    throw makeError('CMS_207L_LIVE_PUBLIC_INDEX_INVALID_JSON', 'Live public-content-index.json schema mismatch', { url: publicIndex.url })
  }
  const routeIncluded = publicIndexJson.entries.some((entry) => {
    const slug = normalizeRoute(entry?.slug)
    const href = normalizeRoute(entry?.href)
    const contentDir = normalizeRoute(entry?.contentDir)
    return slug === routeSlug || href === routeSlug || contentDir === routeSlug
  })
  if (!routeIncluded) throw makeError('CMS_207L_LIVE_PUBLIC_INDEX_ROUTE_MISSING', 'Live public-content-index.json does not include generated route', { routeSlug, url: publicIndex.url })

  const route = await requestText(routeUrlPath(routeSlug), 'text/html', attempt, 'CMS_207L_LIVE_ROUTE_REQUEST_FAILED')
  if (!route.ok) throw makeError('CMS_207L_LIVE_ROUTE_404', 'Live route did not return HTTP 200', { status: route.status, routeHref, url: route.url })
  if (route.text.includes('<div id="app"></div>') && !route.text.includes('vacms-static-article')) {
    throw makeError('CMS_207L_LIVE_ROUTE_HTML_FALLBACK', 'Live route returned SPA fallback instead of static route HTML', { url: route.url })
  }
  if (!route.text.includes('data-vacms-static-article="true"') && !route.text.includes('vacms-static-article')) {
    throw makeError('CMS_207L_LIVE_ROUTE_ARTICLE_MARKER_MISSING', 'Live route does not include VACMS static article marker', { url: route.url })
  }
  if (routeTitle && !route.text.includes(routeTitle) && !route.text.includes(routeSlug)) {
    throw makeError('CMS_207L_LIVE_ROUTE_CONTENT_MISMATCH', 'Live route did not include generated title or slug', { routeTitle, routeSlug, url: route.url })
  }

  return {
    home,
    asset,
    publicIndex,
    route,
    publicIndexEntryCount: publicIndexJson.entries.length,
    strategy,
  }
}

async function main() {
  const modeReceipt = readJson('vacms-pages-deploy-mode-receipt.json', 'CMS_207L_PAGES_DEPLOY_MODE_RECEIPT_MISSING')
  const distReceipt = readJson('vacms-dist-artifact-readback-receipt.json', 'CMS_207L_DIST_ARTIFACT_READBACK_RECEIPT_MISSING')
  const materialization = readJson('vacms-materialization-receipt.json', 'CMS_207L_MATERIALIZATION_RECEIPT_MISSING')

  if (!modeReceipt.ok) throw makeError('CMS_207L_PAGES_DEPLOY_MODE_RECEIPT_NOT_OK', 'Pages deploy mode receipt is not ok')
  if (!distReceipt.ok) throw makeError('CMS_207L_DIST_ARTIFACT_RECEIPT_NOT_OK', 'Dist artifact readback receipt is not ok')

  const strategy = String(modeReceipt.strategy || process.env.PAGES_DEPLOY_STRATEGY || 'actions')
  if (strategy === 'actions') {
    const actionsReceipt = readJson('vacms-pages-actions-deploy-receipt.json', 'CMS_207L_ACTIONS_DEPLOY_RECEIPT_MISSING')
    if (!actionsReceipt.ok) throw makeError('CMS_207L_ACTIONS_DEPLOY_RECEIPT_NOT_OK', 'Actions deploy receipt is not ok')
  } else if (strategy === 'branch') {
    const branchReceipt = readJson('vacms-pages-deploy-evidence.json', 'CMS_207L_BRANCH_DEPLOY_EVIDENCE_MISSING')
    if (!branchReceipt.pushed) throw makeError('CMS_207L_BRANCH_DEPLOY_EVIDENCE_NOT_PUSHED', 'Branch deploy evidence is not pushed')
  } else {
    throw makeError('CMS_207L_PAGES_DEPLOY_STRATEGY_INVALID', 'Pages deploy strategy must be branch or actions', { strategy })
  }

  const latestAsset = String(distReceipt.latestAsset || '')
  if (!latestAsset) throw makeError('CMS_207L_LATEST_ASSET_MISSING', 'Dist readback receipt does not include latestAsset')
  const routeSlug = routeFromMaterialization(materialization)
  if (!routeSlug) throw makeError('CMS_207L_ROUTE_MISSING', 'Could not derive route slug from materialization receipt')
  const routeHref = '/' + routeSlug
  const routeTitle = String(materialization.title || materialization.pageTitle || '')

  let lastError = null
  for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      const result = await verifyOnce(attempt, { strategy, latestAsset, routeSlug, routeHref, routeTitle })
      const receipt = writeReceipt(true, {
        status: 'PASS_CMS_207L_LIVE_PUBLISHED_ARTIFACT_READBACK',
        attempts: attempt,
        strategy,
        latestAsset,
        route: { slug: routeSlug, href: routeHref, titleMatched: true },
        live: {
          homeHtmlOk: true,
          latestAssetOk: true,
          publicIndexJsonOk: true,
          publicIndexEntryCount: result.publicIndexEntryCount,
          routeHtmlOk: true,
          routeArticleMarkerOk: true,
        },
        branchOnlySuccessBlocked: true,
        liveReadbackRequired: true,
        finalizeAllowed: true,
      })
      console.log(receipt.status)
      return
    } catch (error) {
      lastError = error
      const code = error?.code || 'CMS_207L_LIVE_READBACK_ATTEMPT_FAILED'
      const message = error instanceof Error ? error.message : String(error)
      console.error(`CMS-207L live published artifact attempt ${attempt}/${RETRY_COUNT} failed: ${code} ${message}`)
      if (attempt < RETRY_COUNT) await sleep(RETRY_DELAY_MS)
    }
  }

  const code = lastError?.code || 'CMS_207L_LIVE_DEPLOYMENT_TIMEOUT'
  const message = lastError instanceof Error ? lastError.message : 'Live deployment did not converge before timeout'
  writeReceipt(false, {
    status: 'FAIL_CMS_207L_LIVE_PUBLISHED_ARTIFACT_READBACK',
    failureCode: code === 'CMS_207L_LIVE_DEPLOYMENT_TIMEOUT' ? code : 'CMS_207L_LIVE_DEPLOYMENT_TIMEOUT',
    lastFailureCode: code,
    message: 'Live deployment did not converge before timeout',
    lastFailureMessage: message,
    attempts: RETRY_COUNT,
    branchOnlySuccessBlocked: true,
    liveReadbackRequired: true,
    finalizeAllowed: false,
    lastError: lastError?.extra || {},
  })
  console.error('FAIL_CMS_207L_LIVE_PUBLISHED_ARTIFACT_READBACK: CMS_207L_LIVE_DEPLOYMENT_TIMEOUT')
  console.error('Live deployment did not converge before timeout')
  process.exit(1)
}

main().catch((error) => {
  const code = error?.code || 'CMS_207L_LIVE_PUBLISHED_ARTIFACT_FATAL'
  const message = error instanceof Error ? error.message : String(error)
  writeReceipt(false, {
    status: 'FAIL_CMS_207L_LIVE_PUBLISHED_ARTIFACT_READBACK',
    failureCode: code,
    message,
    branchOnlySuccessBlocked: true,
    liveReadbackRequired: true,
    finalizeAllowed: false,
    fatal: true,
    detail: error?.extra || {},
  })
  console.error(`FAIL_CMS_207L_LIVE_PUBLISHED_ARTIFACT_READBACK: ${code}`)
  console.error(message)
  process.exit(1)
})
