#!/usr/bin/env node
import fs from 'node:fs'

const PASS_STATUS = 'PASS_CMS_207G_NO_SPA_ONLY_HOME_FEED'
const DIST_HOME = 'dist/index.html'

function fail(message) {
  throw new Error(message)
}

if (!fs.existsSync(DIST_HOME)) fail(DIST_HOME + ' is missing')
const html = fs.readFileSync(DIST_HOME, 'utf8')

if (/<body>\s*<div\s+id=["']app["']\s*><\/div>\s*<\/body>/i.test(html)) {
  fail('dist/index.html is still an app shell only page')
}

const required = [
  'meta name="vacms-home-static-recent-feed" content="true"',
  'data-vacms-home-static-prerender="true"',
  'data-vacms-home-recent-feed="true"',
  'data-vacms-home-recent-card="true"',
  '최근 공개',
  '전체 인덱스 보기',
]

for (const marker of required) {
  if (!html.includes(marker)) fail('dist/index.html missing marker: ' + marker)
}

console.log(PASS_STATUS)
