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

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
  })
  if (result.status !== 0) fail(`${label} failed: ${result.stderr || result.stdout}`)
}

run('node', ['scripts/generate-content-page-inventory.mjs'], 'content:page-inventory')
run('node', ['scripts/generate-sitemap.mjs'], 'seo:generate-sitemap')

for (const file of [
  'scripts/generate-sitemap.mjs',
  'generated/page-inventory.json',
  'generated/sitemap.xml',
  'dist/sitemap.xml',
  'docs/authoring/sitemap-robots-generation.md',
  'docs/migration/commit-132.md',
  'BAKE_REPORT_COMMIT_132.md',
]) {
  if (!exists(file)) fail(`Missing required file: ${file}`)
}

if (exists('generated/sitemap.xml')) {
  const sitemap = read('generated/sitemap.xml')
  for (const token of [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '<loc>https://varun.tools/</loc>',
    '<loc>https://varun.tools/works</loc>',
    '<loc>https://varun.tools/products</loc>',
  ]) {
    if (!sitemap.includes(token)) fail(`generated/sitemap.xml missing ${token}`)
  }

  for (const forbidden of [
    '/works/editorial-showcase',
    '/products/dummy-catalog',
    '/products/spec-playground',
    '/checkout/success',
    '/checkout/fail',
    '/qa/ewa-gallery',
    '/claim',
  ]) {
    if (sitemap.includes(forbidden)) fail(`Forbidden route leaked into sitemap output: ${forbidden}`)
  }

  if (sitemap.includes(objectLeakToken)) fail('Object serialization leak detected in generated/sitemap.xml')
}

if (exists('dist/sitemap.xml') && exists('generated/sitemap.xml')) {
  if (read('dist/sitemap.xml') !== read('generated/sitemap.xml')) {
    fail('dist/sitemap.xml does not match generated/sitemap.xml mirror output')
  }
}

const pkg = JSON.parse(read('package.json'))
const requiredScripts = {
  'seo:generate-sitemap': 'node scripts/generate-sitemap.mjs',
  'seo:generate': 'npm run seo:generate-sitemap && npm run seo:generate-robots',
  'smoke:sitemap-output': 'node scripts/smoke-sitemap-output.mjs',
}
for (const [name, command] of Object.entries(requiredScripts)) {
  if (pkg.scripts?.[name] !== command) fail(`package.json missing ${name}`)
}
if (!read('scripts/check-launch.mjs').includes('smoke-sitemap-output.mjs')) {
  fail('scripts/check-launch.mjs does not include smoke-sitemap-output')
}

for (const file of [
  'scripts/generate-sitemap.mjs',
  'scripts/smoke-sitemap-output.mjs',
  'docs/authoring/sitemap-robots-generation.md',
  'docs/migration/commit-132.md',
  'BAKE_REPORT_COMMIT_132.md',
  'package.json',
  'scripts/check-launch.mjs',
]) {
  if (exists(file) && read(file).includes(objectLeakToken)) fail(`Object serialization leak detected in ${file}`)
}

if (failures.length > 0) {
  console.error('[smoke:sitemap-output] failed')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

const urlCount = (read('generated/sitemap.xml').match(/<url>/g) || []).length
console.log('[smoke:sitemap-output] OK')
console.log(`- sitemap urls: ${urlCount}`)
console.log('- forbidden routes are excluded from generated sitemap output')
