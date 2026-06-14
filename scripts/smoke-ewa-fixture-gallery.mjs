#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
let failed = false
function check(label, condition) {
  if (!condition) {
    failed = true
    console.error(`[smoke:ewa-fixture-gallery] FAIL ${label}`)
  } else {
    console.log(`[smoke:ewa-fixture-gallery] PASS ${label}`)
  }
}

const pageCsvPath = 'src/content/pages/qa/ewa-gallery/page.csv'
const pageMdPath = 'src/content/pages/qa/ewa-gallery/index.md'
const fixtureDir = 'public/qa/ewa-fixtures'

check('EWA fixture page.csv exists', exists(pageCsvPath))
check('EWA fixture generated index.md exists', exists(pageMdPath))
check('synthetic fixture asset directory exists', exists(fixtureDir))

const pageCsv = exists(pageCsvPath) ? read(pageCsvPath) : ''
const pageMd = exists(pageMdPath) ? read(pageMdPath) : ''

check('fixture page is hidden', /visibility:\s*hidden/.test(pageMd) || /visibility=hidden/.test(pageCsv))
check('fixture page is noindex', /noindex:\s*true/.test(pageMd) || /robots:\s*["']?noindex,follow/.test(pageMd) || /robots=noindex,follow/.test(pageCsv))
check('fixture page declares QA-only contract', pageMd.includes('hidden noindex fixture') && pageMd.includes('not a portfolio work'))

const requiredAssets = [
  'qa-cover.svg',
  'photo-like.svg',
  'ui-screenshot.svg',
  'line-art.svg',
  'pixel-safe.svg',
  'ui-disabled.svg',
  'ui-budget.svg',
]
for (const asset of requiredAssets) check(`synthetic asset exists: ${asset}`, exists(`${fixtureDir}/${asset}`))

check('photo preset fixture exists', pageCsv.includes('media.ewaPreset=photo') && pageCsv.includes('media.ewaMode=basic'))
check('ui-low-ring adaptive fixture exists', pageCsv.includes('media.ewaPreset=ui-low-ring') && pageCsv.includes('media.ewaMode=adaptive-tile'))
check('line-art adaptive fixture exists', pageCsv.includes('media.ewaPreset=line-art') && pageCsv.includes('media.ewaMode=adaptive-tile'))
check('pixel-safe fixture exists', pageCsv.includes('media.ewaPreset=pixel-safe') && pageCsv.includes('media.pixelSafe=true'))
check('disabled fixture exists', pageCsv.includes('media.ewaEnabled=false'))
check('budget downgrade fixture exists', pageCsv.includes('Set vt ewa tier low') || pageCsv.includes('vt:ewa-tier low'))

for (const token of ['vt:ewa-debug', 'vt:ewa-compare', 'vt:ewa-rollout', 'vt:ewa-mode', 'vt:ewa-tier', 'vt:ewa-health']) {
  check(`debug guide contains ${token}`, pageMd.includes(token) || pageCsv.includes(token))
}

const seoPath = 'src/content/generated/portfolio-seo-manifest.json'
if (exists(seoPath)) {
  const seo = JSON.parse(read(seoPath))
  const pages = Array.isArray(seo.pages) ? seo.pages : []
  check('fixture page is not indexable in SEO manifest', !pages.some((entry) => String(entry.href || entry.slug || '').includes('/qa/ewa-gallery') && entry.indexable !== false))
}

const pageSearchPath = 'src/content/generated/page-search-index.json'
if (exists(pageSearchPath)) {
  const search = JSON.parse(read(pageSearchPath))
  const pages = Array.isArray(search.pages) ? search.pages : []
  check('fixture page is excluded from page search index', !pages.some((entry) => String(entry.href || entry.slug || '').includes('/qa/ewa-gallery')))
}

const tagIndexPath = 'src/content/generated/portfolio-tag-index.json'
if (exists(tagIndexPath)) {
  const tags = JSON.parse(read(tagIndexPath))
  check('fixture page is not part of portfolio tag index', !JSON.stringify(tags).includes('qa/ewa-gallery'))
}

check('fixture page is not a work page', !/work:\n/.test(pageMd) && !pageMd.includes('kind: work'))
check('source contains no [object Object]', !pageCsv.includes('[object Object]') && !pageMd.includes('[object Object]'))

if (failed) process.exit(1)
console.log('[smoke:ewa-fixture-gallery] OK')
