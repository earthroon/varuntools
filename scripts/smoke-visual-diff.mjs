#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { screenshotBaselineManifest, screenshotBaselineRoot, screenshotDiffRoot, screenshotOutputRoot, screenshotReportJson, screenshotReportMarkdown, visualRoutes, visualViewports } from './qa/visual-routes.mjs'
const root = process.cwd()
function read(p) { const f = path.join(root, p); if (!fs.existsSync(f)) throw new Error(`Missing required file: ${p}`); return fs.readFileSync(f, 'utf8') }
function inc(h, n, l) { if (!h.includes(n)) throw new Error(`${l} is missing required text: ${n}`) }
for (const file of ['scripts/qa/png-diff-lib.mjs','scripts/qa/promote-baseline.mjs','scripts/qa/diff-screenshots.mjs','docs/qa/visual-regression-baseline.md','docs/migration/commit-62.md']) read(file)
if (!fs.existsSync(path.join(root, screenshotBaselineRoot))) throw new Error(`Missing baseline directory: ${screenshotBaselineRoot}`)
const vr = read('scripts/qa/visual-routes.mjs')
for (const token of [screenshotOutputRoot, screenshotBaselineRoot, screenshotDiffRoot, screenshotReportJson, screenshotReportMarkdown, screenshotBaselineManifest]) inc(vr, token, 'visual-routes')
const pkg = JSON.parse(read('package.json'))
for (const [script, command] of Object.entries({'qa:baseline':'node scripts/qa/promote-baseline.mjs','qa:diff':'node scripts/qa/diff-screenshots.mjs','qa:diff:strict':'node scripts/qa/diff-screenshots.mjs --strict','qa:diff:summary':'node scripts/qa/diff-screenshots.mjs --summary','smoke:visual-diff':'node scripts/smoke-visual-diff.mjs'})) if (pkg.scripts?.[script] !== command) throw new Error(`package.json missing ${script}: ${command}`)
const check = read('scripts/check-launch.mjs'); inc(check, 'scripts/smoke-visual-diff.mjs', 'check-launch'); inc(check, 'smoke:visual-diff', 'check-launch')
const gi = read('.gitignore')
for (const ignored of ['artifacts/qa/screenshots/current/','artifacts/qa/screenshots/diff/','artifacts/qa/screenshots/tmp/','artifacts/qa/screenshots/report.json','artifacts/qa/screenshots/report.md']) inc(gi, ignored, '.gitignore')
if (gi.includes('artifacts/qa/screenshots/baseline/')) throw new Error('.gitignore must not ignore the baseline directory')
const diff = read('scripts/qa/diff-screenshots.mjs')
for (const phrase of ['missing-baseline','missing-current','dimension-mismatch','qa:diff never modifies baseline','QA_DIFF_WARNING_THRESHOLD']) inc(diff, phrase, 'diff-screenshots')
const baseline = read('scripts/qa/promote-baseline.mjs')
for (const phrase of [screenshotOutputRoot, screenshotBaselineRoot, screenshotBaselineManifest]) inc(baseline, phrase, 'promote-baseline')
const docs = read('docs/qa/visual-regression-baseline.md')
for (const phrase of ['qa:baseline','qa:diff','qa:diff:strict','baseline is never updated by qa:diff','missing baseline']) inc(docs, phrase, 'visual-regression-baseline docs')
if (!Array.isArray(visualRoutes) || visualRoutes.length < 6) throw new Error('visualRoutes unexpectedly small')
if (!Array.isArray(visualViewports) || visualViewports.length < 3) throw new Error('visualViewports unexpectedly small')
console.log('[smoke:visual-diff] OK visual diff baseline harness is present and wired')
