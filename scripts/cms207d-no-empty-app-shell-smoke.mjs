#!/usr/bin/env node
import fs from 'node:fs'

const PASS_STATUS = 'PASS_CMS_207D_NO_EMPTY_APP_SHELL_STATIC_PAGE'
const RECEIPT_FILE = 'static-route-materialization-receipt.json'

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function main() {
  if (!fs.existsSync(RECEIPT_FILE)) throw new Error(RECEIPT_FILE + ' is missing; run materialize-static-routes first')
  const receipt = readJson(RECEIPT_FILE)
  const route = receipt.expectedRoute || receipt.routes?.[0]
  const file = receipt.distStaticRoutePath || route?.distStaticRoutePath
  if (!file || !fs.existsSync(file)) throw new Error('dist static route file is missing: ' + file)
  const html = fs.readFileSync(file, 'utf8')
  if (/<div\s+id=["']app["']\s*>\s*<\/div>/i.test(html)) throw new Error('empty app shell remains: ' + file)
  if (!html.includes('data-vacms-static-article="true"')) throw new Error('static article marker missing: ' + file)
  if (!html.includes('data-vacms-static-prerender="true"')) throw new Error('static prerender marker missing: ' + file)
  console.log(PASS_STATUS)
  console.log('file=' + file)
}

main()
