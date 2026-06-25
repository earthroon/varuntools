#!/usr/bin/env node
import fs from 'node:fs'

const DIST_HOME = 'dist/index.html'
const PASS_STATUS = 'PASS_CMS_207G_NO_SPA_ONLY_HOME_FEED'

function fail(message) {
  throw new Error(message)
}

if (!fs.existsSync(DIST_HOME)) fail('dist/index.html is missing')

const html = fs.readFileSync(DIST_HOME, 'utf8')

if (/<div\s+id=["']app["']\s*><\/div>/i.test(html)) {
  fail('dist/index.html is still SPA-only app shell')
}

const requiredMarkers = [
  'data-vacms-home-static-prerender="true"',
  'data-vacms-home-recent-feed="true"',
  'data-vacms-home-recent-card="true"',
]

for (const marker of requiredMarkers) {
  if (!html.includes(marker)) fail('dist/index.html missing marker: ' + marker)
}

console.log(PASS_STATUS)
