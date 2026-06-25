#!/usr/bin/env node
import childProcess from 'node:child_process'

const PASS_STATUS = 'PASS_CMS_207H_PUBLIC_CONTENT_INDEX_READBACK'

function fail(message) {
  throw new Error(message)
}

function git(args) {
  return childProcess.execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

try {
  git(['fetch', 'origin', 'gh-pages'])
} catch (error) {
  fail('failed to fetch origin gh-pages: ' + (error instanceof Error ? error.message : String(error)))
}

let raw = ''
try {
  raw = git(['show', 'origin/gh-pages:public-content-index.json'])
} catch (error) {
  fail('failed to read origin/gh-pages:public-content-index.json: ' + (error instanceof Error ? error.message : String(error)))
}

const index = JSON.parse(raw)
if (index.schemaVersion !== 'cms-public-content-index.v1') fail('gh-pages public content index schemaVersion mismatch')
if (!Array.isArray(index.entries) || !index.entries.length) fail('gh-pages public content index has no entries')
if (!index.entries.some((entry) => entry.source === 'vacms')) fail('gh-pages public content index has no VACMS source entry')
if (!index.entries.some((entry) => String(entry.href || '').startsWith('/post/'))) fail('gh-pages public content index has no /post/ entry')

console.log(PASS_STATUS)
