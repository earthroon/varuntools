#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  flattenOptionKeys,
  parseOptionString,
  parseOptionStringWithDiagnostics,
} from './lib/csv-options.mjs'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { validateCsvRows } from './lib/csv-block-schema.mjs'

const root = process.cwd()
const checks = []
const failures = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function read(p) { return fs.readFileSync(path.join(root, p), 'utf8') }
function hasDiagnostic(diagnostics, code, level) { return diagnostics.some((item) => item.code === code && (!level || item.level === level)) }
function rowsFromCsv(csv) { return csvRowsToObjects(parseCsv(csv), { sourcePath: 'inline.csv' }) }

const legacy = parseOptionString('featured=true; order=10; tags=work|design|tool')
check('legacy boolean parses', legacy.featured === true)
check('legacy number parses', legacy.order === 10)
check('legacy pipe array parses', Array.isArray(legacy.tags) && legacy.tags.join(',') === 'work,design,tool')

const quoted = parseOptionString('series="작업은 느리게; 그러나 정확하게"; quote="구조|리듬=감각"')
check('quoted semicolon preserved', quoted.series === '작업은 느리게; 그러나 정확하게')
check('quoted pipe and equals preserved', quoted.quote === '구조|리듬=감각')

const escaped = parseOptionString('summary=작업은 느리게\\; 그러나 정확하게; label=UI\\|UX; eq=a\\=b')
check('escaped semicolon preserved', escaped.summary === '작업은 느리게; 그러나 정확하게')
check('escaped pipe preserved', escaped.label === 'UI|UX')
check('escaped equals preserved', escaped.eq === 'a=b')

const arrays = parseOptionString('tags=[work, design, tool]; labels=["UI/UX", "CSV;Markdown"]; flags=[true, false, null]; weights=[1, 2, 3]')
check('bracket array parses strings', arrays.tags.join('|') === 'work|design|tool')
check('quoted array item preserves semicolon', arrays.labels[1] === 'CSV;Markdown')
check('array parses null', arrays.flags[2] === null)
check('array parses numbers', arrays.weights[2] === 3)

const nested = parseOptionString('mood.tone=almond-paper; mood.density=high')
check('nested key creates object', nested.mood?.tone === 'almond-paper' && nested.mood?.density === 'high')
check('flattenOptionKeys returns nested leaf keys', flattenOptionKeys(nested).includes('mood.tone') && flattenOptionKeys(nested).includes('mood.density'))

const nullValue = parseOptionString('client=null')
check('null scalar parses', nullValue.client === null)

const unclosed = parseOptionStringWithDiagnostics('summary="닫히지 않은 문장', { rowNumber: 2, block: 'paragraph', field: 'options' })
check('unclosed quote emits error', hasDiagnostic(unclosed.diagnostics, 'CSV_UNCLOSED_OPTION_QUOTE', 'error'))

const invalidArray = parseOptionStringWithDiagnostics('tags=[work, design', { rowNumber: 2, block: 'page', field: 'options' })
check('invalid array emits error', hasDiagnostic(invalidArray.diagnostics, 'CSV_INVALID_OPTION_ARRAY', 'error'))

const invalidEscape = parseOptionStringWithDiagnostics('summary=bad\\xescape', { rowNumber: 2, block: 'paragraph', field: 'options' })
check('invalid escape emits error', hasDiagnostic(invalidEscape.diagnostics, 'CSV_INVALID_OPTION_ESCAPE', 'error'))

const duplicateLoose = parseOptionStringWithDiagnostics('order=1; order=2', { rowNumber: 2, block: 'page', field: 'options', strict: false })
check('duplicate option loose warns', duplicateLoose.value.order === 2 && hasDiagnostic(duplicateLoose.diagnostics, 'CSV_DUPLICATE_OPTION_KEY', 'warning'))
const duplicateStrict = parseOptionStringWithDiagnostics('order=1; order=2', { rowNumber: 2, block: 'page', field: 'options', strict: true })
check('duplicate option strict errors', hasDiagnostic(duplicateStrict.diagnostics, 'CSV_DUPLICATE_OPTION_KEY', 'error'))

const nestedKnown = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Nested Page,Description,./cover.webp,Cover,Caption,./cover.webp,,,mood.tone=almond-paper; gallery.autoMini=true,
`), { strict: true })
check('known nested options pass strict', !nestedKnown.some((item) => item.level === 'error'))

const nestedUnknown = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
image,,,./cover.webp,Cover,Caption,,,,mood.tone=almond-paper,
`), { strict: true })
check('unknown nested option errors in strict', hasDiagnostic(nestedUnknown, 'CSV_UNKNOWN_OPTION', 'error'))

const syntaxRows = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Bad Options,Description,./cover.webp,Cover,Caption,./cover.webp,,,"series=""bad",
`), { strict: false })
check('invalid option syntax fails loose validation', hasDiagnostic(syntaxRows, 'CSV_UNCLOSED_OPTION_QUOTE', 'error'))

const source = read('scripts/lib/csv-options.mjs')
for (const token of ['parseOptionStringWithDiagnostics', 'tokenizeOptionSegments', 'parseArrayValue', 'CSV_DUPLICATE_OPTION_KEY', 'CSV_INVALID_OPTION_ESCAPE']) {
  check(`csv-options source contains ${token}`, source.includes(token))
}

const tmpDir = path.join(root, 'tmp', 'csv-options-smoke')
fs.rmSync(tmpDir, { recursive: true, force: true })
fs.mkdirSync(tmpDir, { recursive: true })
fs.writeFileSync(path.join(tmpDir, 'cover.webp'), 'fake-webp')
const csvPath = path.join(tmpDir, 'page.csv')
fs.writeFileSync(csvPath, `block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Options V2,"Description",./cover.webp,Cover,Caption,./cover.webp,,,"series=""작업은 느리게; 그러나 정확하게""; tags=[work, design]; mood.tone=almond-paper",
paragraph,,Body,,,,,,,,
`, 'utf8')
const convert = spawnSync('node', ['scripts/csv-to-markdown.mjs', path.relative(root, csvPath), '--dry-run', '--strict'], { cwd: root, encoding: 'utf8' })
check('CLI strict accepts options v2 sample', convert.status === 0 && convert.stdout.includes('작업은 느리게; 그러나 정확하게'))

const badCsvPath = path.join(tmpDir, 'bad.csv')
fs.writeFileSync(badCsvPath, `block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Bad,"Description",./cover.webp,Cover,Caption,./cover.webp,,,"series=""bad",
`, 'utf8')
const badConvert = spawnSync('node', ['scripts/csv-to-markdown.mjs', path.relative(root, badCsvPath), '--dry-run'], { cwd: root, encoding: 'utf8' })
check('CLI fails invalid option syntax in loose mode', badConvert.status === 1 && badConvert.stderr.includes('CSV_UNCLOSED_OPTION_QUOTE'))
fs.rmSync(path.join(root, 'tmp'), { recursive: true, force: true })

const pageCsvFiles = []
function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.isFile() && entry.name === 'page.csv') pageCsvFiles.push(full)
  }
}
walk(path.join(root, 'src/content/pages'))
for (const file of pageCsvFiles) {
  const csv = fs.readFileSync(file, 'utf8')
  const rows = csvRowsToObjects(parseCsv(csv), { sourcePath: path.relative(root, file) })
  const diagnostics = validateCsvRows(rows, { strict: true })
  check(`existing page.csv strict has no errors: ${path.relative(root, file)}`, !diagnostics.some((item) => item.level === 'error'))
}

if (failures.length) {
  console.error('smoke:csv-options FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`smoke:csv-options OK — ${checks.length} checks`)
