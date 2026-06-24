#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  console.error('[CMS207A_NO_HOME_MARKDOWN_REWRITE_FAIL]', message)
  process.exit(1)
}

const commitScript = fs.readFileSync('scripts/commit-vacms-materialized-source.mjs', 'utf8')
const workflow = fs.readFileSync('.github/workflows/publish-admin-content.yml', 'utf8')

if (!commitScript.includes('src/content/pages/home/index.md')) fail('home markdown path guard is missing')
if (!commitScript.includes('homepageRewritten')) fail('receipt must expose homepageRewritten')
if (!commitScript.includes('CMS_207A_HOME_MARKDOWN_REWRITE_BLOCKED')) fail('home markdown rewrite block code is missing')
if (/home\/index\.md[\s\S]{0,120}writeFileSync/.test(workflow)) fail('workflow must not directly write home/index.md')
if (/git add[\s\S]{0,80}src\/content\/pages\/home\/index\.md/.test(workflow)) fail('workflow must not stage home/index.md')

console.log('CMS207A_NO_HOME_MARKDOWN_REWRITE_PASS')
