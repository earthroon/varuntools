#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { validateCsvAssetReferences } from './lib/csv-asset-guard.mjs'

const root = process.cwd()
const tmp = path.join(root, '.tmp-smoke-csv-asset-guard')
fs.rmSync(tmp, { recursive: true, force: true })
fs.mkdirSync(path.join(tmp, 'images'), { recursive: true })
fs.mkdirSync(path.join(root, 'public', 'assets'), { recursive: true })
fs.writeFileSync(path.join(tmp, 'images', 'cover.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>')
fs.writeFileSync(path.join(tmp, 'images', 'after.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>')
fs.writeFileSync(path.join(root, 'public', 'assets', 'csv-asset-guard.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>')

function rows(csv) {
  const csvPath = path.relative(root, path.join(tmp, 'page.csv'))
  return csvRowsToObjects(parseCsv(csv.trim() + '\n'), { sourcePath: csvPath })
}

function diagnosticsFor(csv, options = {}) {
  return validateCsvAssetReferences(rows(csv), {
    sourcePath: path.relative(root, path.join(tmp, 'page.csv')),
    sourceCsvPath: path.relative(root, path.join(tmp, 'page.csv')),
    projectRoot: root,
    strict: Boolean(options.strict),
  })
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function hasCode(diagnostics, code, level) {
  return diagnostics.some((diagnostic) => diagnostic.code === code && (!level || diagnostic.level === level))
}

const header = 'block,title,body,src,alt,caption,thumb,layout,kind,options,meta'

let diagnostics = diagnosticsFor(`${header}\nimage,,,./images/cover.svg,대표 이미지,캡션,,,,,`)
assert(!diagnostics.some((diagnostic) => diagnostic.level === 'error'), 'existing local image should pass without errors')

diagnostics = diagnosticsFor(`${header}\nimage,,,./images/missing.svg,대표 이미지,캡션,,,,,`)
assert(hasCode(diagnostics, 'CSV_ASSET_MISSING', 'error'), 'missing local image should return CSV_ASSET_MISSING')

diagnostics = diagnosticsFor(`${header}\nimage,,,javascript:alert(1),대표 이미지,캡션,,,,,`)
assert(hasCode(diagnostics, 'CSV_ASSET_UNSAFE_PROTOCOL', 'error'), 'javascript URL should be blocked')

diagnostics = diagnosticsFor(`${header}\nimage,,,data:image/svg+xml;base64,대표 이미지,캡션,,,,,`)
assert(hasCode(diagnostics, 'CSV_ASSET_DATA_URL_BLOCKED', 'error'), 'data URL should be blocked')

diagnostics = diagnosticsFor(`${header}\nimage,,,https://example.com/cover.webp,대표 이미지,캡션,,,,,`)
assert(hasCode(diagnostics, 'CSV_ASSET_EXTERNAL_URL_NOT_ALLOWED', 'warning'), 'external URL should warn in loose mode')

diagnostics = diagnosticsFor(`${header}\nimage,,,https://example.com/cover.webp,대표 이미지,캡션,,,,,`, { strict: true })
assert(hasCode(diagnostics, 'CSV_ASSET_EXTERNAL_URL_NOT_ALLOWED', 'error'), 'external URL should error in strict mode')

diagnostics = diagnosticsFor(`${header}\nimage,,,./images/cover.svg,,캡션,,,,,`)
assert(hasCode(diagnostics, 'CSV_ASSET_ALT_MISSING', 'warning'), 'image without alt should warn in loose mode')

diagnostics = diagnosticsFor(`${header}\nimage,,,./images/cover.svg,,캡션,,,,,`, { strict: true })
assert(hasCode(diagnostics, 'CSV_ASSET_ALT_MISSING', 'error'), 'image without alt should error in strict mode')

diagnostics = diagnosticsFor(`${header}\nbefore-after,,,./images/cover.svg,비포,캡션,,,,after=./images/after.svg,`)
assert(!diagnostics.some((diagnostic) => diagnostic.level === 'error'), 'before-after with src and after should pass')

diagnostics = diagnosticsFor(`${header}\ncase-gallery-start,갤러리,,,,,,,,,\ncase-gallery-item,,,./images/cover.svg,대표,캡션,,,,,\ncase-gallery-end,,,,,,,,,,`)
assert(!diagnostics.some((diagnostic) => diagnostic.level === 'error'), 'case-gallery-item src should be checked and pass')

diagnostics = diagnosticsFor(`${header}\nimage,,,/assets/csv-asset-guard.svg,대표,캡션,,,,,`)
assert(!diagnostics.some((diagnostic) => diagnostic.level === 'error'), 'public absolute asset should resolve under public/')

diagnostics = diagnosticsFor(`${header}\nimage,,,../../../../etc/passwd,대표,캡션,,,,,`)
assert(hasCode(diagnostics, 'CSV_ASSET_PATH_OUTSIDE_ROOT', 'error'), 'path traversal should be blocked')

const reportCsvPath = path.join(tmp, 'page.csv')
fs.writeFileSync(reportCsvPath, `${header}\npage,Asset Guard,Asset report,./images/cover.svg,대표,캡션,./images/cover.svg,,,,\nimage,,,./images/cover.svg,대표,캡션,,,,,\n`)
const report = spawnSync('node', ['scripts/csv-to-markdown.mjs', path.relative(root, reportCsvPath), '--report'], { cwd: root, encoding: 'utf8' })
assert(report.status === 0, `csv report should exit 0: ${report.stderr}`)
assert(report.stdout.includes('assets:'), 'report should include asset summary')
assert(!report.stdout.includes('[object Object]'), 'report should not contain [object Object]')

fs.rmSync(tmp, { recursive: true, force: true })
console.log('[smoke:csv-asset-guard] OK')
