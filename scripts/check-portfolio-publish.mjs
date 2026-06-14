#!/usr/bin/env node
import process from 'node:process'
import { buildPortfolioPublishReport, writePortfolioPublishReport } from './lib/portfolio-publish-gate.mjs'

function parseArgs(argv) {
  const options = { includeDraft: false, strictWarnings: false, json: false, report: false, work: '', status: '' }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--include-draft') options.includeDraft = true
    else if (arg === '--strict-warnings') options.strictWarnings = true
    else if (arg === '--json') options.json = true
    else if (arg === '--report') options.report = true
    else if (arg === '--work') options.work = argv[++i] || ''
    else if (arg === '--status') options.status = argv[++i] || ''
  }
  return options
}

const options = parseArgs(process.argv.slice(2))
let report = buildPortfolioPublishReport(options)
if (options.work) {
  const normalized = options.work.replace(/^\/+/, '')
  report = { ...report, works: report.works.filter((work) => work.slug === normalized || work.slug === `works/${normalized.replace(/^works\//, '')}`) }
  const summary = report.works.reduce((acc, work) => {
    acc.checked += 1
    if (work.passed) acc.passed += 1
    else acc.failed += 1
    acc.errors += work.errors.length
    acc.warnings += work.warnings.length
    acc.infos += work.infos.length
    return acc
  }, { checked: 0, passed: 0, failed: 0, errors: 0, warnings: 0, infos: 0 })
  report.summary = summary
}
const outPath = writePortfolioPublishReport(report, options)

if (options.json) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(`[check:publish] wrote ${outPath}`)
  console.log(`[check:publish] checked=${report.summary.checked} passed=${report.summary.passed} failed=${report.summary.failed} errors=${report.summary.errors} warnings=${report.summary.warnings}`)
  for (const work of report.works) {
    const status = work.passed ? 'PASS' : 'FAIL'
    console.log(`[check:publish] ${status} ${work.slug} errors=${work.errors.length} warnings=${work.warnings.length}`)
  }
}

if (report.summary.failed > 0 || report.summary.errors > 0) process.exit(1)
