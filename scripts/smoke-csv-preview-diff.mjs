#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { diffMarkdown, formatMarkdownDiff, buildCsvMarkdownReport, formatCsvMarkdownReport } from './lib/csv-diff-report.mjs'

const root = process.cwd()
const checks = []
const failures = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function run(args) { return spawnSync('node', ['scripts/csv-to-markdown.mjs', ...args], { cwd: root, encoding: 'utf8' }) }

const cliSource = fs.readFileSync(path.join(root, 'scripts/csv-to-markdown.mjs'), 'utf8')
for (const token of ['--preview', '--diff', '--check', '--write', 'formatCsvMarkdownReport', 'formatMarkdownDiff']) {
  check(`csv CLI source contains ${token}`, cliSource.includes(token))
}

const reportSource = fs.readFileSync(path.join(root, 'scripts/lib/csv-diff-report.mjs'), 'utf8')
for (const token of ['compareGeneratedMarkdown', 'diffMarkdown', 'formatCsvMarkdownReport', 'formatMarkdownDiff']) {
  check(`csv diff report source contains ${token}`, reportSource.includes(token))
}

const diff = diffMarkdown('a\nb\nc\n', 'a\nB\nc\n')
const formattedDiff = formatMarkdownDiff(diff, { currentLabel: 'current', nextLabel: 'generated' })
check('diff detects changed markdown', diff.changed === true)
check('diff output includes removed and added lines', formattedDiff.includes('- b') && formattedDiff.includes('+ B'))
check('no-change diff reports No changes', formatMarkdownDiff(diffMarkdown('same\n', 'same\n')) === 'No changes')

const report = buildCsvMarkdownReport({
  sourcePath: 'tmp/page.csv',
  outputPath: 'tmp/index.md',
  currentMarkdown: 'old',
  generatedMarkdown: 'new',
  diagnostics: [{ level: 'warning', code: 'CSV_TEST', message: 'test', rowNumber: 1, block: 'page', field: 'title', optionKey: '', hint: '' }],
  summary: { rowCount: 1, blockCounts: { page: 1 } },
})
const formattedReport = formatCsvMarkdownReport(report)
check('report marks changed state', report.changed === true && formattedReport.includes('changed: true'))
check('report includes block summary', formattedReport.includes('- page: 1'))
check('report includes diagnostics count', formattedReport.includes('- warnings: 1'))

const tmpDir = path.join(root, 'tmp', 'csv-preview-diff-smoke')
fs.rmSync(tmpDir, { recursive: true, force: true })
fs.mkdirSync(tmpDir, { recursive: true })
const csvPath = path.join(tmpDir, 'page.csv')
const outPath = path.join(tmpDir, 'index.md')
const relCsv = path.relative(root, csvPath)
const relOut = path.relative(root, outPath)
const csv = `block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Preview Diff Smoke,"Smoke description",./cover.webp,Cover,Caption,./thumb.webp,,,"work.type=case-study; work.status=published; work.role=[Design Engineer]",
paragraph,,First generated body.,,,,,,,,
`
fs.writeFileSync(path.join(tmpDir, 'cover.webp'), 'fake-webp')
fs.writeFileSync(path.join(tmpDir, 'thumb.webp'), 'fake-webp')
fs.writeFileSync(csvPath, csv, 'utf8')

const preview = run([relCsv, '--preview'])
check('--preview succeeds', preview.status === 0)
check('--preview prints markdown', preview.stdout.includes('GENERATED FROM') && preview.stdout.includes('Preview Diff Smoke'))
check('--preview does not write index.md', !fs.existsSync(outPath))

fs.writeFileSync(outPath, '---\ntitle: Old\n---\n\nOld body\n', 'utf8')
const diffRun = run([relCsv, '--diff'])
check('--diff succeeds', diffRun.status === 0)
check('--diff prints diff labels', diffRun.stdout.includes(`--- ${relOut}`) && diffRun.stdout.includes(`+++ generated from ${relCsv}`))
check('--diff prints added generated title', diffRun.stdout.includes('+ title: "Preview Diff Smoke"') || diffRun.stdout.includes('+ title: Preview Diff Smoke'))

const staleCheck = run([relCsv, '--check'])
check('--check fails when stale', staleCheck.status === 1 && staleCheck.stderr.includes('stale output'))

const writeRun = run([relCsv])
check('default write succeeds', writeRun.status === 0 && fs.existsSync(outPath))
const upToDateCheck = run([relCsv, '--check'])
check('--check succeeds when up to date', upToDateCheck.status === 0 && upToDateCheck.stdout.includes('is up to date'))

const noChangeDiff = run([relCsv, '--diff'])
check('--diff reports No changes when up to date', noChangeDiff.status === 0 && noChangeDiff.stdout.includes('No changes'))

const reportRun = run([relCsv, '--report'])
check('--report succeeds', reportRun.status === 0)
check('--report prints summary and changed state', reportRun.stdout.includes('CSV Markdown Report') && reportRun.stdout.includes('changed: false'))

const previewWrite = run([relCsv, '--preview', '--write'])
check('--preview --write succeeds', previewWrite.status === 0 && previewWrite.stdout.includes('GENERATED FROM'))
check('--preview --write writes output', fs.existsSync(outPath))

const missingOut = path.join(tmpDir, 'missing.md')
const missingDiff = run([relCsv, '--out', path.relative(root, missingOut), '--diff'])
check('--diff handles missing output safely', missingDiff.status === 0 && missingDiff.stdout.includes('generated from'))

const badCsvPath = path.join(tmpDir, 'bad.csv')
const relBad = path.relative(root, badCsvPath)
fs.writeFileSync(badCsvPath, `block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,,"Missing title",./cover.webp,Cover,Caption,./thumb.webp,,,,
`, 'utf8')
const badPreview = run([relBad, '--preview'])
check('diagnostics error makes preview fail', badPreview.status === 1 && badPreview.stderr.includes('CSV_REQUIRED_FIELD_MISSING'))

const generated = fs.readFileSync(outPath, 'utf8')
check('generated markdown has no [object Object]', !generated.includes('[object Object]'))

fs.rmSync(path.join(root, 'tmp'), { recursive: true, force: true })

if (failures.length) {
  console.error('smoke:csv-preview-diff FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`smoke:csv-preview-diff OK — ${checks.length} checks`)
