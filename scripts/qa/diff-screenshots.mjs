#!/usr/bin/env node
// Contract: qa:diff never modifies baseline. Use qa:baseline for explicit promotion.
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { getScreenshotPlan, screenshotBaselineRoot, screenshotDiffRoot, screenshotReportJson, screenshotReportMarkdown } from './visual-routes.mjs'
import { comparePngFiles, ensureDir, sha256File } from './png-diff-lib.mjs'
const root = process.cwd()
const args = new Set(process.argv.slice(2))
const strict = args.has('--strict')
const summaryOnly = args.has('--summary')
const warningThreshold = Number(process.env.QA_DIFF_WARNING_THRESHOLD || '0.001')
const errorThreshold = Number(process.env.QA_DIFF_ERROR_THRESHOLD || '0.01')
const channelThreshold = Number(process.env.QA_DIFF_CHANNEL_THRESHOLD || '12')
function percent(v) { return v == null ? 'n/a' : `${(v * 100).toFixed(4)}%` }
function classify(r) { if (r.kind === 'missing-current' || r.kind === 'dimension-mismatch' || r.kind === 'compare-error') return 'error'; if (r.kind === 'missing-baseline') return 'warning'; if (!r.mismatchRatio) return 'pass'; return r.mismatchRatio > errorThreshold ? 'error' : 'warning' }
if (!summaryOnly) fs.rmSync(path.join(root, screenshotDiffRoot), { recursive: true, force: true })
const results = []
for (const item of getScreenshotPlan()) {
  const cur = item.relativePath
  const base = `${screenshotBaselineRoot}/${item.viewport.name}/${item.route.name}.png`
  const diff = `${screenshotDiffRoot}/${item.viewport.name}/${item.route.name}.png`
  const currentPath = path.join(root, cur), baselinePath = path.join(root, base)
  const row = { viewport: item.viewport.name, route: item.route.name, path: item.route.path, current: cur, baseline: base, diff }
  if (!fs.existsSync(currentPath)) { results.push({ ...row, kind: 'missing-current', status: 'error', message: 'Current screenshot is missing.' }); continue }
  if (!fs.existsSync(baselinePath)) { results.push({ ...row, kind: 'missing-baseline', status: 'warning', message: 'Baseline screenshot is missing.' }); continue }
  try {
    const c = summaryOnly ? { reason: sha256File(baselinePath) === sha256File(currentPath) ? 'match' : 'binary-mismatch', mismatchPixels: null, mismatchRatio: null } : comparePngFiles(baselinePath, currentPath, path.join(root, diff), { channelThreshold })
    const out = { ...row, kind: c.reason === 'dimension-mismatch' ? 'dimension-mismatch' : c.reason, width: c.width, height: c.height, baselineWidth: c.baselineWidth, baselineHeight: c.baselineHeight, mismatchPixels: c.mismatchPixels, mismatchRatio: c.mismatchRatio, message: c.reason === 'match' ? 'No visual difference detected.' : c.reason }
    out.status = classify(out); results.push(out)
  } catch (error) { results.push({ ...row, kind: 'compare-error', status: 'error', message: error.message }) }
}
const counts = results.reduce((a, r) => (a[r.status] = (a[r.status] || 0) + 1, a), {})
const report = { schema: 'varuntools.visualDiffReport.v1', generatedAt: new Date().toISOString(), thresholds: { channelThreshold, warningThreshold, errorThreshold, strict }, roots: { current: 'artifacts/qa/screenshots/current', baseline: screenshotBaselineRoot, diff: screenshotDiffRoot }, counts: { pass: counts.pass || 0, warning: counts.warning || 0, error: counts.error || 0 }, results }
ensureDir(path.dirname(path.join(root, screenshotReportJson)))
fs.writeFileSync(path.join(root, screenshotReportJson), `${JSON.stringify(report, null, 2)}\n`)
fs.writeFileSync(path.join(root, screenshotReportMarkdown), render(report))
console.log(`[qa:diff] pass=${report.counts.pass} warning=${report.counts.warning} error=${report.counts.error}`)
console.log(`[qa:diff] wrote ${screenshotReportJson}`)
console.log(`[qa:diff] wrote ${screenshotReportMarkdown}`)
if (report.counts.error) process.exit(1)
if (strict && report.counts.warning) process.exit(1)
function render(r) {
  const lines = ['# Visual Regression Report', '', `Generated: ${r.generatedAt}`, '', '## Summary', '', `- PASS: ${r.counts.pass}`, `- WARNING: ${r.counts.warning}`, `- ERROR: ${r.counts.error}`, '', '| Status | Viewport | Route | Mismatch | Note |', '|---|---|---|---:|---|']
  for (const item of r.results) lines.push(`| ${item.status} | ${item.viewport} | ${item.path} | ${percent(item.mismatchRatio)} | ${String(item.message || item.kind).replace(/\|/g, '\\|')} |`)
  lines.push('', '## Baseline Contract', '', '- `qa:diff` never modifies baseline files.', '- Use `npm run qa:baseline` only when current screenshots are intentionally accepted as the new baseline.', '- Missing baseline is a warning in normal mode and a failure in strict mode.', '')
  return `${lines.join('\n')}\n`
}
