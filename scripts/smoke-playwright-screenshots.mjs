#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { screenshotOutputRoot, visualRoutes, visualViewports } from './qa/visual-routes.mjs'

const root = process.cwd()
const requiredFiles = [
  'playwright.config.mjs',
  'scripts/qa/visual-routes.mjs',
  'scripts/qa/capture-screenshots.mjs',
  'docs/qa/playwright-screenshot-harness.md',
  'docs/migration/commit-61.md',
]
const requiredRoutes = ['/', '/products', '/products/dummy-catalog', '/inquiry', '/lab-markdown-gallery', '/policies']
const requiredViewports = ['desktop-1440', 'mobile-390', 'mobile-360']
function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  if (!fs.existsSync(fullPath)) throw new Error(`Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}
function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) throw new Error(`${label} is missing required text: ${needle}`)
}
for (const file of requiredFiles) read(file)
if (!Array.isArray(visualRoutes) || visualRoutes.length === 0) throw new Error('visualRoutes must be a non-empty array')
if (!Array.isArray(visualViewports) || visualViewports.length === 0) throw new Error('visualViewports must be a non-empty array')
for (const route of requiredRoutes) {
  if (!visualRoutes.some((item) => item.path === route)) throw new Error(`visualRoutes missing required route: ${route}`)
}
for (const viewport of requiredViewports) {
  if (!visualViewports.some((item) => item.name === viewport)) throw new Error(`visualViewports missing required viewport: ${viewport}`)
}
const packageJson = JSON.parse(read('package.json'))
if (packageJson.scripts?.['qa:screenshots'] !== 'node scripts/qa/capture-screenshots.mjs') throw new Error('package.json missing qa:screenshots script')
if (packageJson.scripts?.['smoke:playwright-screenshots'] !== 'node scripts/smoke-playwright-screenshots.mjs') throw new Error('package.json missing smoke:playwright-screenshots script')
const checkLaunch = read('scripts/check-launch.mjs')
assertIncludes(checkLaunch, 'scripts/smoke-playwright-screenshots.mjs', 'check-launch')
assertIncludes(checkLaunch, 'smoke:playwright-screenshots', 'check-launch')
const capture = read('scripts/qa/capture-screenshots.mjs')
assertIncludes(capture, screenshotOutputRoot, 'capture-screenshots')
assertIncludes(capture, '--dry-run', 'capture-screenshots')
assertIncludes(capture, '--base-url=', 'capture-screenshots')
assertIncludes(capture, 'reducedMotion', 'capture-screenshots')
assertIncludes(capture, 'fullPage: true', 'capture-screenshots')
if (capture.includes('toHaveScreenshot') || capture.includes('expect(')) throw new Error('Commit 61 must not introduce visual diff assertions')
const docs = read('docs/qa/playwright-screenshot-harness.md')
for (const phrase of ['qa:screenshots', screenshotOutputRoot, 'visual regression', 'baseline', 'diff', 'not introduced']) assertIncludes(docs, phrase, 'playwright-screenshot-harness')
const gitignore = read('.gitignore')
for (const ignoredPath of ['artifacts/qa/screenshots/current/', 'artifacts/qa/screenshots/diff/', 'artifacts/qa/screenshots/tmp/']) assertIncludes(gitignore, ignoredPath, '.gitignore')
console.log('[smoke:playwright-screenshots] OK Playwright screenshot harness is present and wired')
