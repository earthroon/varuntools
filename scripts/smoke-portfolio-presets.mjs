#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { csvRowsToMarkdown } from './lib/csv-markdown.mjs'

const root = process.cwd()
const presetRoot = path.join(root, 'src/content/templates/portfolio-presets')
const tmpRoot = path.join(root, '.tmp-portfolio-presets')
const failures = []
function check(name, condition, detail = '') {
  if (!condition) failures.push(detail ? `${name}: ${detail}` : name)
}
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }
function parseRows(file) { return csvRowsToObjects(parseCsv(read(file)), { sourcePath: file }) }
function run(args) {
  return spawnSync('node', ['scripts/new-page.mjs', ...args], { cwd: root, encoding: 'utf8' })
}
const presets = ['case-study', 'tool', 'visual', 'service', 'experiment']
for (const preset of presets) check(`${preset} preset exists`, exists(`src/content/templates/portfolio-presets/${preset}.csv`))
const presetText = Object.fromEntries(presets.map((preset) => [preset, read(`src/content/templates/portfolio-presets/${preset}.csv`)]))
check('case-study preset contains portfolio-hero', presetText['case-study'].includes('portfolio-hero'))
check('case-study preset contains problem/decision/result', ['problem', 'decision', 'result'].every((token) => presetText['case-study'].includes(token)))
check('tool preset contains tool-stack', presetText.tool.includes('tool-stack'))
check('visual preset contains case-gallery-start/item/end', ['case-gallery-start', 'case-gallery-item', 'case-gallery-end'].every((token) => presetText.visual.includes(token)))
check('service preset contains process/decision/result', ['process', 'decision', 'result'].every((token) => presetText.service.includes(token)))
check('experiment preset contains metric/tool-stack/quote', ['metric', 'tool-stack', 'quote'].every((token) => presetText.experiment.includes(token)))

fs.rmSync(tmpRoot, { recursive: true, force: true })
const result = run(['works', 'preset-case', '--csv', '--type', 'case-study', '--root', '.tmp-portfolio-presets', '--title', 'Preset Case'])
check('new-page generates case-study preset', result.status === 0, result.stderr || result.stdout)
const pageDir = path.join(tmpRoot, 'works/preset-case')
check('generated page.csv exists', fs.existsSync(path.join(pageDir, 'page.csv')))
check('generated cover.svg exists', fs.existsSync(path.join(pageDir, 'cover.svg')))
check('generated thumb.svg exists', fs.existsSync(path.join(pageDir, 'thumb.svg')))
const pageCsv = fs.readFileSync(path.join(pageDir, 'page.csv'), 'utf8')
check('generated page.csv has draft status', pageCsv.includes('work.status=draft'))
check('generated page.csv has featured false', pageCsv.includes('work.featured=false'))
check('generated page.csv has preset title', pageCsv.includes('Preset Case'))
const rows = csvRowsToObjects(parseCsv(pageCsv), { sourcePath: '.tmp-portfolio-presets/works/preset-case/page.csv' })
const generated = csvRowsToMarkdown(rows, {
  sourceCsvPath: '.tmp-portfolio-presets/works/preset-case/page.csv',
  outputMarkdownPath: '.tmp-portfolio-presets/works/preset-case/index.md',
  projectRoot: root,
})
check('generated preset renders without errors', generated.errors.length === 0, generated.errors.join('; '))
check('generated markdown contains no object leakage', !generated.markdown.includes('[object Object]'))
check('generated markdown contains portfolio hero directive', generated.markdown.includes('::portfolio-hero'))
const rerun = run(['works', 'preset-case', '--csv', '--type', 'case-study', '--root', '.tmp-portfolio-presets', '--force'])
check('existing page.csv is not overwritten', rerun.status !== 0 && rerun.stderr.includes('existing page.csv will not be overwritten'), rerun.stderr || rerun.stdout)

const pathStyle = run(['works/preset-tool', '--csv', '--type', 'tool', '--root', '.tmp-portfolio-presets'])
check('new-page supports works/slug path syntax', pathStyle.status === 0, pathStyle.stderr || pathStyle.stdout)
check('path syntax generated page.csv exists', fs.existsSync(path.join(tmpRoot, 'works/preset-tool/page.csv')))

fs.rmSync(tmpRoot, { recursive: true, force: true })

const newPageSource = read('scripts/new-page.mjs')
check('new-page supports --type option', newPageSource.includes("--type") && newPageSource.includes('portfolioPresetTypes'))
check('new-page defaults status draft', newPageSource.includes("let status = 'draft'"))
check('new-page defaults featured false', newPageSource.includes("let featured = 'false'"))
check('new-page protects page.csv overwrite', newPageSource.includes('existing page.csv will not be overwritten'))

if (failures.length) {
  console.error('smoke:portfolio-presets FAILED')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('[smoke:portfolio-presets] OK')
