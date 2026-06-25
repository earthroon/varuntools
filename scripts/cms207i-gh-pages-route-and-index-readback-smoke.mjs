#!/usr/bin/env node
import fs from 'node:fs'
import childProcess from 'node:child_process'

const PATCH_ID = 'CMS-207I'
const PASS_STATUS = 'PASS_CMS_207I_GH_PAGES_ROUTE_AND_INDEX_READBACK'
const RECEIPT_FILE = 'vacms-gh-pages-route-index-readback-receipt.json'

function writeReceipt(receipt) {
  fs.writeFileSync(RECEIPT_FILE, JSON.stringify(receipt, null, 2) + '\n', 'utf8')
}

function fail(code, message, extra = {}) {
  writeReceipt({
    ok: false,
    patchId: PATCH_ID,
    status: 'FAIL_' + PASS_STATUS,
    blockedReasonCode: code,
    blockedReason: message,
    ...extra,
    generatedAt: new Date().toISOString(),
  })
  const error = new Error(message)
  error.code = code
  error.extra = extra
  throw error
}

function readJson(path, code) {
  if (!fs.existsSync(path)) fail(code, `${path} is missing`)
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  } catch (error) {
    fail(code, `${path} is not valid JSON: ` + (error instanceof Error ? error.message : String(error)))
  }
}

function git(args, code, extra = {}) {
  try {
    return childProcess.execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    fail(code, `git ${args.join(' ')} failed: ` + (error instanceof Error ? error.message : String(error)), extra)
  }
}

function trimSlashes(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').replace(/\/+/, '/')
}

function routePathToGhPagesIndex(routePath, materialization) {
  const candidates = [
    routePath,
    materialization.materializedSlug,
    materialization.vacmsSlug,
    materialization.generatedPathSlug,
  ]
  let slug = ''
  for (const candidate of candidates) {
    const text = trimSlashes(candidate)
    if (text) {
      slug = text
      break
    }
  }
  if (!slug || slug === 'home') return 'index.html'
  return `${slug}/index.html`
}

function routeSlug(routePath, materialization) {
  const ghIndex = routePathToGhPagesIndex(routePath, materialization)
  return ghIndex === 'index.html' ? '' : ghIndex.replace(/\/index\.html$/, '')
}

const materialization = readJson('vacms-materialization-receipt.json', 'CMS_207I_MATERIALIZATION_RECEIPT_MISSING')
const publicIndexReceipt = readJson('public-content-index-receipt.json', 'CMS_207I_PUBLIC_INDEX_RECEIPT_MISSING')

if (publicIndexReceipt.ok !== true) {
  fail('CMS_207I_PUBLIC_INDEX_RECEIPT_NOT_OK', 'public content index receipt is not ok', { publicIndexReceipt })
}

const routePath = String(materialization.routePath || '').trim()
const ghPagesRouteIndex = routePathToGhPagesIndex(routePath, materialization)
const expectedSlug = routeSlug(routePath, materialization)
const expectedHref = expectedSlug ? '/' + expectedSlug : '/'

git(['fetch', 'origin', 'gh-pages'], 'CMS_207I_GH_PAGES_FETCH_FAILED')
const html = git(['show', `origin/gh-pages:${ghPagesRouteIndex}`], 'CMS_207I_GH_PAGES_ROUTE_MISSING', { ghPagesRouteIndex, routePath })

if (/<div\s+id=["']app["']\s*><\/div>/i.test(html)) {
  fail('CMS_207I_GH_PAGES_ROUTE_EMPTY_SHELL', 'gh-pages route is still empty SPA shell', { ghPagesRouteIndex })
}

const publicIndexRaw = git(['show', 'origin/gh-pages:public-content-index.json'], 'CMS_207I_PUBLIC_INDEX_MISSING')
let publicIndex
try {
  publicIndex = JSON.parse(publicIndexRaw)
} catch (error) {
  fail('CMS_207I_PUBLIC_INDEX_INVALID_JSON', 'origin/gh-pages public-content-index.json is invalid JSON: ' + (error instanceof Error ? error.message : String(error)))
}

const entries = Array.isArray(publicIndex.entries) ? publicIndex.entries : []
if (!entries.length) fail('CMS_207I_PUBLIC_INDEX_EMPTY', 'origin/gh-pages public-content-index.json has no entries')

const included = entries.some((entry) => {
  const slug = trimSlashes(entry.slug)
  const href = String(entry.href || '').trim()
  return slug === expectedSlug || href === expectedHref || href === routePath
})

if (!included) {
  fail('CMS_207I_PUBLIC_INDEX_ROUTE_NOT_INCLUDED', 'origin/gh-pages public-content-index.json does not include generated route', {
    routePath,
    expectedSlug,
    expectedHref,
    entryCount: entries.length,
  })
}

const receipt = {
  ok: true,
  patchId: PATCH_ID,
  status: PASS_STATUS,
  routePath: routePath || null,
  ghPagesRouteIndex,
  ghPagesRouteReadbackVerified: true,
  publicContentIndexReadbackVerified: true,
  homeRuntimeIndexIncludesRoute: true,
  entryCount: entries.length,
  generatedAt: new Date().toISOString(),
}

writeReceipt(receipt)
console.log(PASS_STATUS)
console.log('ghPagesRouteIndex=' + ghPagesRouteIndex)
