#!/usr/bin/env node
// Paths: artifacts/qa/screenshots/current -> artifacts/qa/screenshots/baseline, manifest artifacts/qa/screenshots/baseline/manifest.json.
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { getScreenshotPlan, screenshotBaselineManifest, screenshotBaselineRoot, screenshotOutputRoot } from './visual-routes.mjs'
import { ensureDir, sha256File } from './png-diff-lib.mjs'
const root = process.cwd()
const currentRoot = path.join(root, screenshotOutputRoot)
const baselineRoot = path.join(root, screenshotBaselineRoot)
if (!fs.existsSync(currentRoot)) { console.error(`[qa:baseline] Missing current screenshots: ${screenshotOutputRoot}`); console.error('[qa:baseline] Run `npm run qa:screenshots` before promoting a baseline.'); process.exit(1) }
const entries = [], missing = []
fs.rmSync(baselineRoot, { recursive: true, force: true }); ensureDir(baselineRoot)
for (const item of getScreenshotPlan(screenshotOutputRoot)) {
  const src = path.join(root, item.relativePath)
  const rel = `${screenshotBaselineRoot}/${item.viewport.name}/${item.route.name}.png`
  const dst = path.join(root, rel)
  if (!fs.existsSync(src)) { missing.push(item.relativePath); continue }
  ensureDir(path.dirname(dst)); fs.copyFileSync(src, dst)
  entries.push({ viewport: item.viewport.name, route: item.route.name, path: item.route.path, file: rel, sha256: sha256File(dst) })
}
if (missing.length) { console.error(`[qa:baseline] Missing ${missing.length} current screenshot(s).`); for (const file of missing.slice(0, 20)) console.error(`- ${file}`); process.exit(1) }
fs.writeFileSync(path.join(root, screenshotBaselineManifest), `${JSON.stringify({ schema: 'varuntools.visualBaseline.v1', promotedAt: new Date().toISOString(), sourceRoot: screenshotOutputRoot, baselineRoot: screenshotBaselineRoot, count: entries.length, entries }, null, 2)}\n`)
console.log(`[qa:baseline] OK promoted ${entries.length} screenshots into ${screenshotBaselineRoot}`)
