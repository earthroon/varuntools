#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { csvRowsToMarkdown } from './lib/csv-markdown.mjs'
import { validateCsvRows } from './lib/csv-block-schema.mjs'

const root = process.cwd()
const checks = []
const failures = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function rowsFromCsv(csv) { return csvRowsToObjects(parseCsv(csv), { sourcePath: 'portfolio-frontmatter-inline.csv' }) }
function render(csv) { return csvRowsToMarkdown(rowsFromCsv(csv), { sourceCsvPath: 'portfolio-frontmatter-inline.csv', strict: true }) }
function csvCell(value = '') {
  const text = String(value ?? '')
  if (!/[",\n]/.test(text)) return text
  return `"${text.replaceAll('"', '""')}"`
}
function csvRow(cells) {
  if (cells.length !== 11) throw new Error(`Expected 11 CSV cells, received ${cells.length}`)
  return cells.map(csvCell).join(',')
}
const header = ['block', 'title', 'body', 'src', 'alt', 'caption', 'thumb', 'layout', 'kind', 'options', 'meta']
function csv(rows) { return [header, ...rows].map(csvRow).join('\n') + '\n' }

const explicit = render(csv([
  ['page', 'Explicit Work', 'Explicit description', './cover.webp', 'Cover', 'Caption', './thumb.webp', '', '', 'slug=works/explicit; kind=work; status=active; visibility=public; work.type=case-study; work.status=published; work.featured=true; work.weight=90; work.role=[Design Engineer, Frontend]; work.stack=[Vue, TypeScript, Cloudflare Workers]; work.tags=[store, security, portfolio]; work.mood.tone=almond-paper; work.mood.density=high; work.links.demo=/demo', ''],
  ['paragraph', '', 'Body', '', '', '', '', '', '', '', ''],
]))
check('explicit work object is emitted', explicit.markdown.includes('work:\n'))
check('explicit work type emitted', explicit.markdown.includes('type: case-study'))
check('explicit work status emitted', explicit.markdown.includes('status: published'))
check('explicit work featured emitted', explicit.markdown.includes('featured: true'))
check('explicit work weight emitted', explicit.markdown.includes('weight: 90'))
check('explicit work role array emitted', explicit.markdown.includes('role:\n    - "Design Engineer"') || explicit.markdown.includes('role:\n    - Design'))
check('explicit work stack array emitted', explicit.markdown.includes('- "Cloudflare Workers"'))
check('explicit work tags emitted', explicit.markdown.includes('- portfolio'))
check('explicit nested mood emitted', explicit.markdown.includes('mood:\n    tone: almond-paper\n    density: high'))
check('explicit nested links emitted', explicit.markdown.includes('links:\n    demo: /demo'))

const legacy = render(csv([
  ['page', 'Legacy Work', 'Legacy description', './cover.webp', 'Cover', 'Caption', './thumb.webp', '', 'work', 'slug=works/legacy; kind=work; status=active; visibility=public; role=[Designer, Frontend]; stack=[Vue, TypeScript]; tags=[legacy, work]; featured=true; weight=12', ''],
  ['paragraph', '', 'Body', '', '', '', '', '', '', '', ''],
]))
check('legacy role maps into work when page kind is work', legacy.markdown.includes('work:\n') && legacy.markdown.includes('- Designer'))
check('legacy stack maps into work', legacy.markdown.includes('- TypeScript'))
check('legacy featured maps into work', legacy.markdown.includes('featured: true'))

const heroFallback = render(csv([
  ['page', 'Hero Fallback', 'Fallback description', './cover.webp', 'Cover', 'Caption', './thumb.webp', '', '', 'slug=works/hero-fallback; status=active; visibility=public', ''],
  ['portfolio-hero', 'Hero', 'Hero summary', './hero.webp', 'Hero', 'Hero image', './hero-thumb.webp', 'split', 'case-study', 'role=[Product Design, Frontend]; stack=[Vue, Workers]; year=2026; featured=true; tags=[hero, fallback]; tone=almond-paper', ''],
]))
check('portfolio-hero fallback creates work object', heroFallback.markdown.includes('work:\n'))
check('portfolio-hero fallback type uses kind', heroFallback.markdown.includes('type: case-study'))
check('portfolio-hero fallback summary uses hero body', heroFallback.markdown.includes('summary: "Hero summary"'))
check('portfolio-hero fallback year emitted', heroFallback.markdown.includes('year: 2026'))

const precedence = render(csv([
  ['page', 'Precedence', 'Description', './cover.webp', 'Cover', 'Caption', './thumb.webp', '', '', 'slug=works/precedence; status=active; visibility=public; work.type=tool; work.status=draft; work.role=[Owner]; work.stack=[TypeScript]', ''],
  ['portfolio-hero', 'Hero', 'Hero summary', './hero.webp', 'Hero', 'Hero image', './hero-thumb.webp', 'split', 'case-study', 'role=[Fallback Role]; stack=[Fallback Stack]; year=2026; featured=true', ''],
]))
check('page work namespace overrides hero type', precedence.markdown.includes('type: tool'))
check('page work namespace overrides hero status', precedence.markdown.includes('status: draft'))
check('page work namespace overrides hero role in frontmatter', precedence.markdown.split('---')[1].includes('- Owner') && !precedence.markdown.split('---')[1].includes('Fallback Role'))

const noWork = render(csv([
  ['page', 'Product-ish Page', 'Description', './cover.webp', 'Cover', 'Caption', './thumb.webp', '', '', 'slug=products/no-work; status=active; visibility=public; tags=[product]; featured=true', ''],
  ['paragraph', '', 'Body', '', '', '', '', '', '', '', ''],
]))
check('non-work page with legacy tags does not emit empty work object', !noWork.markdown.includes('\nwork:\n'))

const invalid = render(csv([
  ['page', 'Invalid Work Type', 'Description', './cover.webp', 'Cover', 'Caption', './thumb.webp', '', '', 'slug=works/invalid; status=active; visibility=public; work.type=banana; work.status=published', ''],
  ['paragraph', '', 'Body', '', '', '', '', '', '', '', ''],
]))
check('invalid work.type emits warning', invalid.warnings.some((item) => String(item).includes('work.type should be one of')))
check('generated markdown avoids object string leaks', !explicit.markdown.includes('[object Object]') && !explicit.markdown.includes('undefined') && !explicit.markdown.includes('work: {}'))
check('schema validation accepts work namespace options', !validateCsvRows(rowsFromCsv(csv([
  ['page', 'Schema', 'Description', './cover.webp', 'Cover', 'Caption', './thumb.webp', '', '', 'slug=works/schema; status=active; visibility=public; work.mood.tone=almond-paper; work.links.caseStudy=/case', ''],
]))).some((item) => item.level === 'error'))

const tmpDir = path.join(root, 'tmp', 'portfolio-frontmatter-smoke')
fs.rmSync(tmpDir, { recursive: true, force: true })
fs.mkdirSync(tmpDir, { recursive: true })
fs.writeFileSync(path.join(tmpDir, 'cover.webp'), 'fake-webp')
fs.writeFileSync(path.join(tmpDir, 'thumb.webp'), 'fake-webp')
const csvPath = path.join(tmpDir, 'page.csv')
fs.writeFileSync(csvPath, csv([
  ['page', 'CLI Work', 'CLI description', './cover.webp', 'Cover', 'Caption', './thumb.webp', '', '', 'slug=works/cli-work; status=active; visibility=public; work.type=case-study; work.role=[Design Engineer]; work.stack=[Vue]', ''],
  ['paragraph', '', 'Body', '', '', '', '', '', '', '', ''],
]), 'utf8')
const cli = spawnSync('node', ['scripts/csv-to-markdown.mjs', path.relative(root, csvPath), '--dry-run', '--strict'], { cwd: root, encoding: 'utf8' })
check('CLI strict emits work frontmatter', cli.status === 0 && cli.stdout.includes('work:') && cli.stdout.includes('case-study'))
fs.rmSync(path.join(root, 'tmp'), { recursive: true, force: true })

if (failures.length) {
  console.error('smoke:portfolio-frontmatter FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`smoke:portfolio-frontmatter OK — ${checks.length} checks`)
