#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { csvRowsToMarkdown } from './lib/csv-markdown.mjs'

const root = process.cwd()
const checks = []
const failures = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function exists(p) { return fs.existsSync(path.join(root, p)) }
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8') }

for (const file of [
  'src/content/templates/product.md',
  'src/content/templates/product.csv',
  'src/content/pages/products/index.md',
  'docs/authoring/store-authoring.md',
]) check(`${file} exists`, exists(file))

const newPage = read('scripts/new-page.mjs')
check('new-page supports products category', newPage.includes("'products'") && newPage.includes('product.md') && newPage.includes('product.csv'))

const csvSource = read('scripts/lib/csv-markdown.mjs')
for (const token of ['productRows', 'normalizeProductOptions', 'checkoutProvider', 'toss-payments', 'downloadProvider', 'cloudflare', 'showWhenUnavailable']) {
  check(`csv markdown supports ${token}`, csvSource.includes(token))
}

const validateSource = read('scripts/validate-content.mjs')
for (const token of ['validateProductFields', 'VALID_PRODUCT_TYPES', 'VALID_PRODUCT_STATUSES', 'product.checkoutProvider', 'product.downloadUrl']) {
  check(`validate-content checks ${token}`, validateSource.includes(token))
}

const pkg = JSON.parse(read('package.json'))
check('package.json has smoke:product-catalog', pkg.scripts?.['smoke:product-catalog'] === 'node scripts/smoke-product-catalog.mjs')
check('check:launch includes smoke:product-catalog', read('scripts/check-launch.mjs').includes('smoke:product-catalog'))
check('README documents product pages', read('README.md').includes('npm run new:page -- products product-slug --csv'))
check('store docs mention Toss Payments', read('docs/authoring/store-authoring.md').includes('Toss Payments'))
check('store docs mention Cloudflare', read('docs/authoring/store-authoring.md').includes('Cloudflare'))
check('Visual QA contains Product Catalog Contract', read('src/content/pages/lab-markdown-gallery/index.md').includes('Product Catalog Contract'))

const productCsv = read('src/content/templates/product.csv')
const rows = csvRowsToObjects(parseCsv(productCsv))
const generated = csvRowsToMarkdown(rows, { sourceCsvPath: 'src/content/templates/product.csv' })
check('product csv template converts without errors', generated.errors.length === 0)
check('generated markdown contains product frontmatter', generated.markdown.includes('product:'))
check('generated markdown contains toss payments provider', generated.markdown.includes('checkoutProvider: toss-payments'))
check('generated markdown contains cloudflare download provider', generated.markdown.includes('downloadProvider: cloudflare'))
check('generated markdown keeps price visible', generated.markdown.includes('priceVisible: true'))
check('generated markdown keeps unavailable visibility', generated.markdown.includes('showWhenUnavailable: true'))

fs.rmSync(path.join(root, 'tmp'), { recursive: true, force: true })
const create = spawnSync('node', ['scripts/new-page.mjs', 'products', 'product-smoke', '--csv', '--root', 'tmp/product-catalog-smoke'], { cwd: root, encoding: 'utf8' })
check('new-page products --csv succeeds', create.status === 0)
check('new-page products --csv creates page.csv', exists('tmp/product-catalog-smoke/products/product-smoke/page.csv'))
check('new-page products --csv creates generated index.md', exists('tmp/product-catalog-smoke/products/product-smoke/index.md'))
const generatedPage = exists('tmp/product-catalog-smoke/products/product-smoke/index.md') ? read('tmp/product-catalog-smoke/products/product-smoke/index.md') : ''
check('generated product page has products slug', generatedPage.includes('slug: products/product-smoke'))
check('generated product page has product object', generatedPage.includes('product:') && generatedPage.includes('checkoutProvider: toss-payments'))
fs.rmSync(path.join(root, 'tmp'), { recursive: true, force: true })

if (failures.length) {
  console.error('smoke:product-catalog FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log(`smoke:product-catalog OK — ${checks.length} checks`)
