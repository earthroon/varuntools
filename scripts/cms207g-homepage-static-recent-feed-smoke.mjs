#!/usr/bin/env node
import fs from 'node:fs'

const PASS_STATUS = 'PASS_CMS_207G_HOMEPAGE_STATIC_RECENT_FEED_SMOKE'
const RECEIPT_FILE = 'homepage-static-recent-feed-receipt.json'
const DIST_HOME = 'dist/index.html'

function fail(message) {
  throw new Error(message)
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

if (!fs.existsSync(RECEIPT_FILE)) fail(RECEIPT_FILE + ' is missing')
if (!fs.existsSync(DIST_HOME)) fail(DIST_HOME + ' is missing')

const receipt = readJson(RECEIPT_FILE)
if (receipt.ok !== true) fail('receipt.ok must be true')
if (receipt.patchId !== 'CMS-207G') fail('receipt.patchId must be CMS-207G')
if (receipt.homeSurfaceRewritten !== true) fail('receipt.homeSurfaceRewritten must be true')
if (!Number.isFinite(Number(receipt.feedEntryCount)) || Number(receipt.feedEntryCount) <= 0) fail('receipt.feedEntryCount must be > 0')

const hasVacmsPostSource = Array.isArray(receipt.includedEntries) && receipt.includedEntries.some((entry) => entry?.category === 'post' && entry?.source === 'vacms')
if (receipt.workflowMode && receipt.expected && receipt.expectedRouteIncluded !== true) fail('workflow expected VACMS route was not included in home feed')
if (receipt.workflowMode && !hasVacmsPostSource) fail('workflow home feed must include at least one VACMS post')

const html = fs.readFileSync(DIST_HOME, 'utf8')
const required = [
  'data-vacms-home-static-prerender="true"',
  'data-vacms-home-recent-feed="true"',
  'data-vacms-home-recent-card="true"',
  '최근 공개',
  '전체 인덱스 보기',
  '/post/',
]

for (const marker of required) {
  if (!html.includes(marker)) fail('dist/index.html missing marker: ' + marker)
}

console.log(PASS_STATUS)
