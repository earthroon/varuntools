#!/usr/bin/env node
import fs from 'node:fs'

const DIST_HOME = 'dist/index.html'
const RECEIPT_FILE = 'homepage-static-recent-feed-receipt.json'
const PASS_STATUS = 'PASS_CMS_207G_HOMEPAGE_STATIC_RECENT_FEED_SMOKE'

function fail(message) {
  throw new Error(message)
}

if (!fs.existsSync(DIST_HOME)) fail('dist/index.html is missing')
if (!fs.existsSync(RECEIPT_FILE)) fail('homepage-static-recent-feed-receipt.json is missing')

const html = fs.readFileSync(DIST_HOME, 'utf8')
const receipt = JSON.parse(fs.readFileSync(RECEIPT_FILE, 'utf8'))

if (receipt.ok !== true) fail('homepage recent feed receipt is not ok')
if (receipt.homeSurfaceRewritten !== true) fail('homepage recent feed receipt did not rewrite home surface')
if (!Number.isFinite(Number(receipt.feedEntryCount)) || Number(receipt.feedEntryCount) <= 0) {
  fail('homepage recent feed receipt has no entries')
}
if (receipt.vacmsPostIncluded !== true) fail('homepage recent feed receipt has no VACMS post')

const requiredMarkers = [
  'data-vacms-home-static-prerender="true"',
  'data-vacms-home-recent-feed="true"',
  'data-vacms-home-recent-card="true"',
  '/post/',
]

for (const marker of requiredMarkers) {
  if (!html.includes(marker)) fail('dist/index.html missing marker: ' + marker)
}

console.log(PASS_STATUS)
