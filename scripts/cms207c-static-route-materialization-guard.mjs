#!/usr/bin/env node
import fs from 'node:fs'

const PASS_STATUS = 'PASS_CMS_207D_STATIC_ARTICLE_MATERIALIZATION_GUARD'
const RECEIPT_FILE = 'static-route-materialization-receipt.json'

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function fail(message) {
  throw new Error(message)
}

function main() {
  if (!fs.existsSync(RECEIPT_FILE)) fail(RECEIPT_FILE + ' is missing')
  const receipt = readJson(RECEIPT_FILE)
  if (receipt.ok !== true) fail('static route receipt is not ok')
  const route = receipt.expectedRoute || receipt.routes?.[0]
  if (!route) fail('static route receipt has no route')
  const file = route.distStaticRoutePath || receipt.distStaticRoutePath
  if (!file || !fs.existsSync(file)) fail('dist static route html is missing: ' + file)
  const html = fs.readFileSync(file, 'utf8')
  const routePath = receipt.routePath || route.routePath
  if (!html.includes('name="vacms-static-route"')) fail('vacms-static-route meta marker missing')
  if (!html.includes('name="vacms-static-article-prerender" content="true"')) fail('vacms-static-article-prerender meta marker missing')
  if (!html.includes('data-vacms-static-article="true"')) fail('static article marker missing')
  if (!html.includes('data-vacms-static-prerender="true"')) fail('static prerender marker missing')
  if (/<div\s+id=["']app["']\s*>\s*<\/div>/i.test(html)) fail('empty app shell remains in static route html')
  if (/(^|\n)\s*:{2,3}\s*[a-zA-Z0-9_-]+/.test(html)) fail('raw markdown directive leaked into static route html')
  if (routePath && !html.includes(`content="${routePath}"`) && !html.includes(`data-vacms-route="${routePath}"`)) fail('route marker mismatch: ' + routePath)
  if ((receipt.renderedArticleHtmlLength ?? route.renderedArticleHtmlLength ?? 0) <= 0) fail('rendered article length is zero')
  console.log(PASS_STATUS)
  console.log('distStaticRoutePath=' + file)
}

main()
