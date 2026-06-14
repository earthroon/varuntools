#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { runLegacyAdaptersOnRaw } from './lib/legacy-markdown-audit.mjs'

const projectRoot = process.cwd()
const fixtureRoot = path.join(projectRoot, 'src', 'markdown', '__fixtures__')

function readFixture(name) {
  return readFileSync(path.join(fixtureRoot, name), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const mixed = runLegacyAdaptersOnRaw(readFixture('legacy-audit-mixed.md'))
assert(mixed.changed, 'mixed fixture should change')
assert(mixed.totalConverted >= 4, `mixed fixture should convert at least 4 groups, got ${mixed.totalConverted}`)
assert(mixed.totalWarnings === 0, `mixed fixture should not warn, got ${mixed.totalWarnings}`)
assert(mixed.markdown.includes('::section-gap'), 'mixed fixture should include section-gap directive')
assert(mixed.markdown.includes('::before-after'), 'mixed fixture should include before-after directive')
assert(mixed.markdown.includes('::pagecard-grid'), 'mixed fixture should include pagecard-grid directive')
assert(mixed.markdown.includes('::markdown-box'), 'mixed fixture should include markdown-box directive')

const clean = runLegacyAdaptersOnRaw(readFixture('legacy-audit-clean.md'))
assert(!clean.changed, 'clean fixture should not change')
assert(clean.totalConverted === 0, 'clean fixture should convert 0 groups')
assert(clean.totalWarnings === 0, 'clean fixture should warn 0 times')

const warning = runLegacyAdaptersOnRaw(readFixture('legacy-audit-warning.md'))
assert(warning.totalWarnings > 0, 'warning fixture should produce warnings')

console.log('[VARUNTOOLS][legacy-smoke] OK')
console.log(`mixed converted: ${mixed.totalConverted}, warnings: ${mixed.totalWarnings}`)
console.log(`clean converted: ${clean.totalConverted}, warnings: ${clean.totalWarnings}`)
console.log(`warning converted: ${warning.totalConverted}, warnings: ${warning.totalWarnings}`)
