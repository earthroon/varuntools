#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const root = process.cwd()
const failures = []
const objectLeakToken = '[' + 'object Object' + ']'

function fail(message) {
  failures.push(message)
}

function fullPath(relativePath) {
  return path.join(root, relativePath)
}

function read(relativePath) {
  return fs.readFileSync(fullPath(relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(fullPath(relativePath))
}

const generator = spawnSync('node', ['scripts/generate-robots.mjs'], {
  cwd: root,
  encoding: 'utf8',
})
if (generator.status !== 0) fail(`seo:generate-robots failed: ${generator.stderr || generator.stdout}`)

for (const file of [
  'scripts/generate-robots.mjs',
  'generated/robots.txt',
  'public/robots.txt',
  'docs/authoring/sitemap-robots-generation.md',
  'docs/migration/commit-132.md',
  'BAKE_REPORT_COMMIT_132.md',
]) {
  if (!exists(file)) fail(`Missing required file: ${file}`)
}

if (exists('generated/robots.txt')) {
  const robots = read('generated/robots.txt')
  for (const token of [
    'User-agent: *',
    'Allow: /',
    'Disallow: /checkout/',
    'Disallow: /qa/',
    'Disallow: /works/editorial-showcase',
    'Disallow: /products/dummy-catalog',
    'Disallow: /products/spec-playground',
    'Disallow: /claim',
    'Sitemap: https://varun.tools/sitemap.xml',
  ]) {
    if (!robots.includes(token)) fail(`generated/robots.txt missing ${token}`)
  }
  if (robots.includes(objectLeakToken)) fail('Object serialization leak detected in generated/robots.txt')
}

if (exists('public/robots.txt') && exists('generated/robots.txt')) {
  if (read('public/robots.txt') !== read('generated/robots.txt')) {
    fail('public/robots.txt does not match generated/robots.txt mirror output')
  }
}

const pkg = JSON.parse(read('package.json'))
const requiredScripts = {
  'seo:generate-robots': 'node scripts/generate-robots.mjs',
  'seo:generate': 'npm run seo:generate-sitemap && npm run seo:generate-robots',
  'smoke:robots-output': 'node scripts/smoke-robots-output.mjs',
}
for (const [name, command] of Object.entries(requiredScripts)) {
  if (pkg.scripts?.[name] !== command) fail(`package.json missing ${name}`)
}
if (!read('scripts/check-launch.mjs').includes('smoke-robots-output.mjs')) {
  fail('scripts/check-launch.mjs does not include smoke-robots-output')
}

for (const file of [
  'scripts/generate-robots.mjs',
  'scripts/smoke-robots-output.mjs',
  'docs/authoring/sitemap-robots-generation.md',
  'docs/migration/commit-132.md',
  'BAKE_REPORT_COMMIT_132.md',
  'package.json',
  'scripts/check-launch.mjs',
]) {
  if (exists(file) && read(file).includes(objectLeakToken)) fail(`Object serialization leak detected in ${file}`)
}

if (failures.length > 0) {
  console.error('[smoke:robots-output] failed')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('[smoke:robots-output] OK')
console.log('- generated robots output mirrors public/robots.txt')
console.log('- forbidden route disallow rules are present')
