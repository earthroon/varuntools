import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'CMS-208J'

function assertOk(condition, code, message) {
  if (!condition) {
    throw new Error(`${PATCH_ID}_${code}: ${message}`)
  }
}

const slug = '9999999999999999'
const source = path.join('src', 'content', 'pages', 'page', slug, 'index.md')
const directoryRoute = path.join('dist', 'page', slug, 'index.html')
const htmlRoute = path.join('dist', 'page', `${slug}.html`)
const receipt = path.join('dist', 'dynamic-content-routes-receipt.json')

assertOk(fs.existsSync(source), 'SOURCE_PAGE_MISSING', `${source} must exist`)
assertOk(fs.existsSync(directoryRoute), 'DIRECTORY_ROUTE_MISSING', `${directoryRoute} must exist`)
assertOk(fs.existsSync(htmlRoute), 'HTML_ROUTE_MISSING', `${htmlRoute} must exist`)
assertOk(fs.existsSync(receipt), 'RECEIPT_MISSING', `${receipt} must exist`)

const html = fs.readFileSync(directoryRoute, 'utf8')
assertOk(html.includes('/assets/'), 'ROUTE_SHELL_ASSETS_MISSING', 'materialized route must contain Vite asset references')

console.log('PASS_CMS_208J_DYNAMIC_CONTENT_ROUTES')
