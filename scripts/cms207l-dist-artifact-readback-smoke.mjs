#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'CMS-207L'
const RECEIPT = 'vacms-dist-artifact-readback-receipt.json'

function readJson(file, code) {
  if (!fs.existsSync(file)) fail(code, `${file} is missing`)
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    fail(code, `${file} is invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function fail(code, message, extra = {}) {
  const receipt = {
    ok: false,
    patchId: PATCH_ID,
    status: 'FAIL_CMS_207L_DIST_ARTIFACT_READBACK',
    failureCode: code,
    message,
    checkedAt: new Date().toISOString(),
    ...extra,
  }
  fs.writeFileSync(RECEIPT, JSON.stringify(receipt, null, 2))
  console.error(`${receipt.status}: ${code}`)
  console.error(message)
  process.exit(1)
}

function normalizeRoute(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/[?#].*$/, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/, '/')
}

function routeFromReceipt(receipt) {
  const explicit = normalizeRoute(receipt.routePath)
  if (explicit) return explicit
  const slug = normalizeRoute(receipt.materializedSlug || receipt.slug)
  if (slug) return slug
  const fromPath = String(receipt.generatedPath || '')
    .replace(/^src\/content\/pages\//, '')
    .replace(/\/index\.md$/, '')
    .replace(/^\/+|\/+$/g, '')
  return normalizeRoute(fromPath)
}

function extractLatestAsset(html) {
  const matches = [...String(html).matchAll(/<script[^>]+src=["']([^"']*\/assets\/index-[^"']+\.js)["'][^>]*>/g)]
  return matches.at(-1)?.[1] || ''
}

const materialization = readJson('vacms-materialization-receipt.json', 'CMS_207L_MATERIALIZATION_RECEIPT_MISSING')
const routeSlug = routeFromReceipt(materialization)
if (!routeSlug) fail('CMS_207L_ROUTE_MISSING', 'Could not derive route slug from materialization receipt')
const routeHref = '/' + routeSlug

const distIndexPath = path.join('dist', 'index.html')
if (!fs.existsSync(distIndexPath)) fail('CMS_207L_DIST_INDEX_MISSING', 'dist/index.html is missing')
const homeHtml = fs.readFileSync(distIndexPath, 'utf8')
const latestAsset = extractLatestAsset(homeHtml)
if (!latestAsset) fail('CMS_207L_DIST_LATEST_ASSET_MISSING', 'Could not extract latest /assets/index-*.js from dist/index.html')
const assetPath = path.join('dist', latestAsset.replace(/^\//, ''))
if (!fs.existsSync(assetPath)) fail('CMS_207L_DIST_LATEST_ASSET_MISSING', `Latest asset is missing from dist: ${latestAsset}`)

const indexPath = path.join('dist', 'public-content-index.json')
if (!fs.existsSync(indexPath)) fail('CMS_207L_DIST_PUBLIC_INDEX_MISSING', 'dist/public-content-index.json is missing')
let publicIndex
try {
  publicIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
} catch (error) {
  fail('CMS_207L_DIST_PUBLIC_INDEX_INVALID_JSON', `dist/public-content-index.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
}
if (!publicIndex || publicIndex.schemaVersion !== 'cms-public-content-index.v1' || !Array.isArray(publicIndex.entries)) {
  fail('CMS_207L_DIST_PUBLIC_INDEX_INVALID_JSON', 'dist/public-content-index.json schema mismatch')
}
const routeInIndex = publicIndex.entries.some((entry) => {
  const slug = normalizeRoute(entry?.slug)
  const href = normalizeRoute(entry?.href)
  const contentDir = normalizeRoute(entry?.contentDir)
  return slug === routeSlug || href === routeSlug || contentDir === routeSlug
})
if (!routeInIndex) fail('CMS_207L_DIST_PUBLIC_INDEX_ROUTE_MISSING', 'dist/public-content-index.json does not include the generated route', { routeSlug })

const routeHtmlPath = routeSlug ? path.join('dist', routeSlug, 'index.html') : distIndexPath
if (!fs.existsSync(routeHtmlPath)) fail('CMS_207L_DIST_ROUTE_HTML_MISSING', `dist route HTML is missing: ${routeHtmlPath}`)
const routeHtml = fs.readFileSync(routeHtmlPath, 'utf8')
if (!routeHtml.includes('data-vacms-static-article="true"') && !routeHtml.includes('vacms-static-article')) {
  fail('CMS_207L_DIST_ROUTE_ARTICLE_MARKER_MISSING', 'dist route HTML does not include VACMS static article marker', { routeHtmlPath })
}

const receipt = {
  ok: true,
  patchId: PATCH_ID,
  status: 'PASS_CMS_207L_DIST_ARTIFACT_READBACK',
  checkedAt: new Date().toISOString(),
  latestAsset,
  latestAssetPath: assetPath.replace(/\\/g, '/'),
  publicIndexPath: indexPath.replace(/\\/g, '/'),
  publicIndexEntryCount: publicIndex.entries.length,
  route: {
    slug: routeSlug,
    href: routeHref,
    htmlPath: routeHtmlPath.replace(/\\/g, '/'),
  },
  dist: {
    indexHtmlOk: true,
    latestAssetOk: true,
    publicIndexJsonOk: true,
    publicIndexRouteOk: true,
    routeHtmlOk: true,
    routeArticleMarkerOk: true,
  },
}
fs.writeFileSync(RECEIPT, JSON.stringify(receipt, null, 2))
console.log(receipt.status)
