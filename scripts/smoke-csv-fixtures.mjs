#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { csvRowsToMarkdown } from './lib/csv-markdown.mjs'

const root = process.cwd()
const fixtureRoot = path.join(root, 'src', 'content', 'templates', 'csv-fixtures')
const failures = []
const checks = []

function check(name, condition, details = '') {
  checks.push(name)
  if (!condition) failures.push(details ? `${name}: ${details}` : name)
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function fixturePath(name, file = 'page.csv') {
  return path.join(fixtureRoot, name, file)
}

function relative(file) {
  return path.relative(root, file).replace(/\\/g, '/')
}

function renderFixture(name, options = {}) {
  const csvPath = fixturePath(name)
  const source = fs.readFileSync(csvPath, 'utf8')
  const rows = csvRowsToObjects(parseCsv(source), { sourcePath: relative(csvPath) })
  return csvRowsToMarkdown(rows, {
    sourceCsvPath: relative(csvPath),
    outputMarkdownPath: relative(path.join(path.dirname(csvPath), 'index.md')),
    projectRoot: root,
    strict: Boolean(options.strict),
  })
}

function renderInvalid(file, options = {}) {
  const csvPath = path.join(fixtureRoot, 'diagnostics-invalid', file)
  const source = fs.readFileSync(csvPath, 'utf8')
  const rows = csvRowsToObjects(parseCsv(source), { sourcePath: relative(csvPath) })
  return csvRowsToMarkdown(rows, {
    sourceCsvPath: relative(csvPath),
    outputMarkdownPath: relative(path.join(path.dirname(csvPath), `${path.basename(file, '.csv')}.md`)),
    projectRoot: root,
    strict: Boolean(options.strict),
  })
}

function hasDiagnostic(result, code, level = 'error') {
  return (result.diagnostics || []).some((diagnostic) => diagnostic.code === code && (!level || diagnostic.level === level))
}

function noErrors(result) {
  return !(result.diagnostics || []).some((diagnostic) => diagnostic.level === 'error')
}

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function walkFiles(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(full, output)
    else if (entry.isFile()) output.push(full)
  }
  return output
}

const beforeHashes = new Map(walkFiles(fixtureRoot).map((file) => [file, hashFile(file)]))

const caseStudy = renderFixture('case-study-basic', { strict: true })
check('case-study-basic renders without errors', noErrors(caseStudy))
check('case-study-basic emits work frontmatter', caseStudy.markdown.includes('work:\n  type: case-study'))
check('case-study-basic emits role array', caseStudy.markdown.includes('- "Design Engineer"') && caseStudy.markdown.includes('- Frontend'))
check('case-study-basic renders portfolio hero directive', caseStudy.markdown.includes('::portfolio-hero') && caseStudy.markdown.includes('title: Fixture Case Study'))
check('case-study-basic renders decision case-section', caseStudy.markdown.includes('::case-section') && caseStudy.markdown.includes('type: decision'))
check('case-study-basic renders metric-card', caseStudy.markdown.includes('::metric-card') && caseStudy.markdown.includes('value: 7'))
check('case-study-basic renders case gallery', caseStudy.markdown.includes('::case-gallery') && caseStudy.markdown.includes('Audit ledger'))
check('case-study-basic has no object leakage', !caseStudy.markdown.includes('[object Object]'))
check('case-study-basic expected.md exists', fs.existsSync(fixturePath('case-study-basic', 'expected.md')))

const gallery = renderFixture('gallery-heavy', { strict: true })
check('gallery-heavy renders without errors', noErrors(gallery))
check('gallery-heavy checks at least five assets', (gallery.summary?.assetSummary?.checked ?? 0) >= 5, JSON.stringify(gallery.summary?.assetSummary || {}))
check('gallery-heavy asset guard has zero errors', (gallery.summary?.assetSummary?.errors ?? 0) === 0)
check('gallery-heavy has gallery markers', gallery.markdown.includes('Standard Gallery') && gallery.markdown.includes('Case Gallery'))

const tool = renderFixture('tool-showcase', { strict: true })
check('tool-showcase renders without errors', noErrors(tool))
check('tool-showcase emits tool work type', tool.markdown.includes('type: tool'))
check('tool-showcase emits demo link', tool.markdown.includes('demo: /demo'))
check('tool-showcase emits repo link', tool.markdown.includes('repo: https://varun.tools/repo'))
check('tool-showcase preserves stack', tool.markdown.includes('- Vue') && tool.markdown.includes('- TypeScript'))

const product = renderFixture('product-page', { strict: true })
check('product-page renders without errors', noErrors(product))
check('product-page renders product metadata', product.markdown.includes('product:') && product.markdown.includes('sku: FIXTURE-001'))
check('product-page does not emit work frontmatter', !product.markdown.includes('\nwork:\n'))
check('product-page has no object leakage', !product.markdown.includes('[object Object]'))

const invalidMissing = renderInvalid('missing-required.csv', { strict: true })
check('invalid missing-required fails with CSV_REQUIRED_FIELD_MISSING', hasDiagnostic(invalidMissing, 'CSV_REQUIRED_FIELD_MISSING'))

const invalidOptions = renderInvalid('bad-options.csv', { strict: true })
check('invalid bad-options fails with CSV_UNCLOSED_OPTION_QUOTE', hasDiagnostic(invalidOptions, 'CSV_UNCLOSED_OPTION_QUOTE'))

const invalidAsset = renderInvalid('missing-asset.csv', { strict: true })
check('invalid missing-asset fails with CSV_ASSET_MISSING', hasDiagnostic(invalidAsset, 'CSV_ASSET_MISSING'))

const invalidUrl = renderInvalid('unsafe-url.csv', { strict: true })
check('invalid unsafe-url fails with CSV_ASSET_UNSAFE_PROTOCOL', hasDiagnostic(invalidUrl, 'CSV_ASSET_UNSAFE_PROTOCOL'))

for (const [file, hash] of beforeHashes) {
  check(`fixture smoke does not mutate ${relative(file)}`, hashFile(file) === hash)
}

if (failures.length) {
  console.error('smoke:csv-fixtures FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[smoke:csv-fixtures] OK - ${checks.length} checks`)
