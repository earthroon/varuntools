#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { CSV_BLOCK_SCHEMAS, validateCsvRows } from './lib/csv-block-schema.mjs'
import { csvRowsToMarkdown } from './lib/csv-markdown.mjs'

const root = process.cwd()
const checks = []
const failures = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function exists(p) { return fs.existsSync(path.join(root, p)) }
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8') }
function rowsFromCsv(csv) { return csvRowsToObjects(parseCsv(csv), { sourcePath: 'inline.csv' }) }
function hasDiagnostic(diagnostics, code, level) { return diagnostics.some((item) => item.code === code && (!level || item.level === level)) }

for (const file of [
  'scripts/lib/csv-block-schema.mjs',
  'scripts/lib/csv-diagnostics.mjs',
  'scripts/lib/csv-options.mjs',
  'scripts/lib/csv-markdown.mjs',
  'scripts/csv-to-markdown.mjs',
]) check(`${file} exists`, exists(file))

for (const block of ['page', 'product', 'heading', 'paragraph', 'box', 'image', 'section-gap', 'product-cta', 'product-trust', 'before-after', 'video', 'gallery-start', 'gallery-item', 'gallery-end', 'raw']) {
  check(`CSV_BLOCK_SCHEMAS includes ${block}`, Boolean(CSV_BLOCK_SCHEMAS[block]))
}

const validRows = rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Valid Page,Valid description,,,,,,,tags=valid|csv,
paragraph,,Body text,,,,,,,,
`)
const validResult = csvRowsToMarkdown(validRows, { sourceCsvPath: 'inline.csv' })
check('valid CSV has no errors', validResult.summary.errorCount === 0)
check('result exposes diagnostics', Array.isArray(validResult.diagnostics))
check('result exposes summary block counts', validResult.summary.blockCounts.page === 1 && validResult.summary.blockCounts.paragraph === 1)

const unknownBlockDiagnostics = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
mystery,Title,Body,,,,,,,,
`))
check('unknown block is error', hasDiagnostic(unknownBlockDiagnostics, 'CSV_UNKNOWN_BLOCK', 'error'))
check('unknown block includes row number', unknownBlockDiagnostics.find((item) => item.code === 'CSV_UNKNOWN_BLOCK')?.rowNumber === 2)

const missingRequired = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
image,,,,,,,,,,
`))
check('missing required src is error', hasDiagnostic(missingRequired, 'CSV_REQUIRED_FIELD_MISSING', 'error'))
check('recommended alt warning appears', hasDiagnostic(missingRequired, 'CSV_RECOMMENDED_FIELD_MISSING', 'warning'))

const unknownOptionLoose = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
image,,,./cover.webp,Cover,Caption,,,,foo=bar,
`), { strict: false })
check('unknown option loose is warning', hasDiagnostic(unknownOptionLoose, 'CSV_UNKNOWN_OPTION', 'warning'))
const unknownOptionStrict = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
image,,,./cover.webp,Cover,Caption,,,,foo=bar,
`), { strict: true })
check('unknown option strict is error', hasDiagnostic(unknownOptionStrict, 'CSV_UNKNOWN_OPTION', 'error'))

const galleryOutside = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
gallery-item,,,./a.webp,,Caption,,,,,
`))
check('gallery item outside group is error', hasDiagnostic(galleryOutside, 'CSV_GALLERY_ITEM_OUTSIDE_GROUP', 'error'))
const galleryUnclosed = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
gallery-start,Gallery,,,,,,,,,
gallery-item,,,./a.webp,,Caption,,,,,
`))
check('gallery unclosed is error', hasDiagnostic(galleryUnclosed, 'CSV_GALLERY_UNCLOSED', 'error'))

const rawDiagnostics = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
raw,,**Raw markdown**,,,,,,,,
`))
check('raw block emits warning', hasDiagnostic(rawDiagnostics, 'CSV_RAW_BLOCK_USED', 'warning'))

const tmpDir = path.join(root, 'tmp', 'csv-diagnostics-smoke')
fs.rmSync(tmpDir, { recursive: true, force: true })
fs.mkdirSync(tmpDir, { recursive: true })
fs.writeFileSync(path.join(tmpDir, 'cover.webp'), 'fake-webp')
const csvPath = path.join(tmpDir, 'page.csv')
fs.writeFileSync(csvPath, `block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Report Page,Report description,./cover.webp,Cover,Caption,./cover.webp,,,tags=report,
image,,,./cover.webp,Cover,Caption,,,,foo=bar,
`, 'utf8')
const report = spawnSync('node', ['scripts/csv-to-markdown.mjs', path.relative(root, csvPath), '--dry-run', '--report'], { cwd: root, encoding: 'utf8' })
check('csv CLI --report succeeds in loose mode', report.status === 0)
check('csv CLI --report prints summary', report.stdout.includes('CSV Markdown Report') || report.stderr.includes('CSV Markdown Report'))
check('csv CLI diagnostics prints unknown option', report.stderr.includes('CSV_UNKNOWN_OPTION'))
const strict = spawnSync('node', ['scripts/csv-to-markdown.mjs', path.relative(root, csvPath), '--strict'], { cwd: root, encoding: 'utf8' })
check('csv CLI --strict fails unknown option', strict.status === 1 && strict.stderr.includes('CSV_UNKNOWN_OPTION'))
fs.rmSync(path.join(root, 'tmp'), { recursive: true, force: true })

const csvToMarkdownSource = read('scripts/csv-to-markdown.mjs')
check('csv CLI supports --strict', csvToMarkdownSource.includes('--strict'))
check('csv CLI supports --report', csvToMarkdownSource.includes('--report'))

if (failures.length) {
  console.error('smoke:csv-diagnostics FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`smoke:csv-diagnostics OK — ${checks.length} checks`)
