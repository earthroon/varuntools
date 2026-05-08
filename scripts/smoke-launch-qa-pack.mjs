#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const requiredFiles = [
  'docs/qa/launch-qa-matrix.md',
  'docs/qa/manual-screenshot-checklist.md',
  'docs/qa/qa-run-template.md',
  'docs/migration/commit-60.md',
]
const requiredViewports = ['1440', '1280', '1024', '768', '430', '390', '360']
const requiredRoutes = ['/', '/products', '/products/dummy-catalog', '/inquiry', '/lab-markdown-gallery', '/policies', '/policies/store', '/policies/shipping', '/policies/refund', '/policies/privacy', '/policies/digital-download']
const requiredStatuses = ['PASS', 'WARNING', 'BLOCKER', 'N/A']
const requiredPhrases = ['Command Palette', 'Product catalog', 'Inquiry form', 'gateCode', 'Media breakout rail', 'screenshot folder']
function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  if (!fs.existsSync(fullPath)) throw new Error(`Missing required QA file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}
function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) throw new Error(`${label} is missing required text: ${needle}`)
}
for (const file of requiredFiles) read(file)
const matrix = read('docs/qa/launch-qa-matrix.md')
const checklist = read('docs/qa/manual-screenshot-checklist.md')
const template = read('docs/qa/qa-run-template.md')
const launchChecklist = read('docs/authoring/launch-checklist.md')
const packageJson = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')
for (const viewport of requiredViewports) {
  assertIncludes(matrix, viewport, 'launch-qa-matrix')
  assertIncludes(checklist, viewport, 'manual-screenshot-checklist')
  assertIncludes(template, viewport, 'qa-run-template')
}
for (const route of requiredRoutes) {
  assertIncludes(matrix, route, 'launch-qa-matrix')
  assertIncludes(checklist, route, 'manual-screenshot-checklist')
  assertIncludes(template, route, 'qa-run-template')
}
for (const status of requiredStatuses) {
  assertIncludes(matrix, status, 'launch-qa-matrix')
  assertIncludes(template, status, 'qa-run-template')
}
for (const phrase of requiredPhrases) assertIncludes(matrix, phrase, 'launch-qa-matrix')
assertIncludes(checklist, '{viewport}-{route-slug}-{state}.png', 'manual-screenshot-checklist')
assertIncludes(checklist, 'No required page has horizontal overflow at 360', 'manual-screenshot-checklist')
assertIncludes(template, 'Overall result: PASS / PASS WITH WARNINGS / BLOCKED', 'qa-run-template')
assertIncludes(launchChecklist, 'smoke:launch-qa', 'launch-checklist')
if (packageJson.scripts?.['smoke:launch-qa'] !== 'node scripts/smoke-launch-qa-pack.mjs') throw new Error('package.json is missing smoke:launch-qa script')
if (!checkLaunch.includes('scripts/smoke-launch-qa-pack.mjs') || !checkLaunch.includes('smoke:launch-qa')) throw new Error('scripts/check-launch.mjs is missing smoke:launch-qa step')
console.log('[smoke:launch-qa] OK launch QA pack is present and wired')
