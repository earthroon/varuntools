#!/usr/bin/env node
import fs from 'node:fs'
import process from 'node:process'

const PASS_STATUS = 'PASS_CMS_207C_STATIC_ROUTE_GUARD'
const RECEIPT_FILE = 'static-route-materialization-receipt.json'
const workflowMode = new Set(process.argv.slice(2)).has('--workflow')

function fail(code, message, extra = {}) {
  const error = new Error(message)
  error.code = code
  error.extra = extra
  throw error
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function normalizeSlash(value) {
  return String(value || '').replace(/\\/g, '/')
}

function trimSlashes(value) {
  return normalizeSlash(value).replace(/^\/+|\/+$/g, '')
}

function main() {
  if (!fs.existsSync(RECEIPT_FILE)) fail('CMS_207C_STATIC_ROUTE_RECEIPT_MISSING', RECEIPT_FILE + ' is missing')
  const receipt = readJson(RECEIPT_FILE)
  if (!receipt || receipt.ok !== true) fail('CMS_207C_STATIC_ROUTE_RECEIPT_NOT_OK', RECEIPT_FILE + ' is not ok')

  let routePath = receipt.routePath || receipt.expectedRoute?.routePath || ''
  let distPath = receipt.distStaticRoutePath || receipt.expectedRoute?.distStaticRoutePath || ''
  let sourcePath = receipt.source || receipt.expectedRoute?.sourcePath || ''

  if (workflowMode) {
    if (!fs.existsSync('vacms-materialization-receipt.json')) fail('CMS_207C_MATERIALIZATION_RECEIPT_MISSING', 'workflow guard requires vacms-materialization-receipt.json')
    const materialization = readJson('vacms-materialization-receipt.json')
    routePath = routePath || materialization.routePath
    sourcePath = sourcePath || materialization.generatedPath
  }

  if (!routePath) fail('CMS_207C_ROUTE_PATH_MISSING', 'routePath is missing from static route receipt')
  if (!distPath) distPath = 'dist/' + trimSlashes(routePath) + '/index.html'
  distPath = normalizeSlash(distPath)

  if (!fs.existsSync(distPath)) fail('CMS_207C_DIST_STATIC_ROUTE_MISSING', distPath + ' is missing')
  const html = fs.readFileSync(distPath, 'utf8')
  const routeMarker = `name="vacms-static-route" content="/${trimSlashes(routePath)}"`
  if (!html.includes(routeMarker)) fail('CMS_207C_STATIC_ROUTE_MARKER_MISSING', 'static route marker missing from ' + distPath, { routeMarker })
  if (sourcePath) {
    const sourceMarker = `name="vacms-static-route-source" content="${normalizeSlash(sourcePath)}"`
    if (!html.includes(sourceMarker)) fail('CMS_207C_STATIC_ROUTE_SOURCE_MARKER_MISSING', 'static route source marker missing from ' + distPath, { sourceMarker })
  }
  if (!html.includes('<script') || !html.includes('/assets/')) fail('CMS_207C_STATIC_ROUTE_SPA_ENTRY_MISSING', 'static route HTML does not include SPA asset entry')

  console.log(PASS_STATUS)
  console.log('routePath=/' + trimSlashes(routePath))
  console.log('distStaticRoutePath=' + distPath)
}

main()
