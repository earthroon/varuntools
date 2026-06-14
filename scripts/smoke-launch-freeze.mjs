#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import process from 'node:process'
function fail(message) { console.error(`[smoke:launch-freeze] FAIL ${message}`); process.exit(1) }
function read(file) { if (!existsSync(file)) fail(`missing ${file}`); return readFileSync(file, 'utf8') }
for (const file of ['src/config/launchReadiness.ts','scripts/audit-launch-readiness.mjs','docs/launch/launch-content-freeze.md','docs/launch/final-asset-pass.md','docs/launch/dummy-content-cleanup.md','docs/migration/commit-66.md','BAKE_REPORT_COMMIT_66.md']) read(file)
const config = read('src/config/launchReadiness.ts')
for (const token of ["launchMode: 'prelaunch'",'allowDemoProducts: true',"demoProductSlugs: ['dummy-catalog', 'spec-playground']",'requireGoogleFormConnection: false','requirePolicyReviewFlag: false','requireOgImages: false','requireThumbnails: false','requireScreenshotBaseline: false','failOnImageWarnings: false']) if (!config.includes(token)) fail(`launchReadiness config missing ${token}`)
const audit = read('scripts/audit-launch-readiness.mjs')
for (const token of ['demo-product-public','google-form-not-ready','policy-review-missing','screenshot-baseline-missing','image-warnings-present','failOnImageWarnings']) if (!audit.includes(token)) fail(`audit-launch-readiness missing ${token}`)
const pkg = JSON.parse(read('package.json'))
if (pkg.scripts?.['audit:launch-readiness'] !== 'node scripts/audit-launch-readiness.mjs') fail('package.json missing audit:launch-readiness')
if (pkg.scripts?.['smoke:launch-freeze'] !== 'node scripts/smoke-launch-freeze.mjs') fail('package.json missing smoke:launch-freeze')
const check = read('scripts/check-launch.mjs')
if (!check.includes('scripts/audit-launch-readiness.mjs')) fail('check-launch missing audit:launch-readiness')
if (!check.includes('scripts/smoke-launch-freeze.mjs')) fail('check-launch missing smoke:launch-freeze')
if (!(check.indexOf('scripts/smoke-visual-diff.mjs') < check.indexOf('scripts/audit-launch-readiness.mjs') && check.indexOf('scripts/audit-launch-readiness.mjs') < check.indexOf('scripts/smoke-launch-freeze.mjs'))) fail('check-launch order must run visual diff smoke before launch readiness and launch freeze smoke after readiness')
const cleanup = read('docs/launch/dummy-content-cleanup.md')
for (const token of ['/products/dummy-catalog','/products/spec-playground','visibility: hidden','rm -rf']) if (!cleanup.includes(token)) fail(`dummy cleanup doc missing ${token}`)
const auditResult = spawnSync('node', ['scripts/audit-launch-readiness.mjs'], { encoding: 'utf8', shell: process.platform === 'win32' })
if (auditResult.status !== 0) { process.stdout.write(auditResult.stdout || ''); process.stderr.write(auditResult.stderr || ''); fail('audit:launch-readiness should pass in prelaunch mode') }
console.log('[smoke:launch-freeze] OK launch freeze config, docs, audit, and launch wiring are present')
