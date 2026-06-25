#!/usr/bin/env node
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const PASS_STATUS = 'PASS_CMS_207G_HOME_SURFACE_READBACK'
const RECEIPT_FILE = 'homepage-static-recent-feed-receipt.json'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: options.encoding ?? 'utf8',
    stdio: options.stdio ?? 'pipe',
    shell: process.platform === 'win32',
    ...options,
  })
  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
    throw new Error(`command failed: ${command} ${args.join(' ')}${detail ? `\n${detail}` : ''}`)
  }
  return result.stdout?.trim?.() ?? ''
}

function fail(message) {
  throw new Error(message)
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

const receipt = fs.existsSync(RECEIPT_FILE) ? readJson(RECEIPT_FILE) : null

run('git', ['fetch', 'origin', 'gh-pages'])
run('git', ['cat-file', '-e', 'origin/gh-pages:index.html'])
const html = run('git', ['show', 'origin/gh-pages:index.html'])

const required = [
  'data-vacms-home-static-prerender="true"',
  'data-vacms-home-recent-feed="true"',
  'data-vacms-home-recent-card="true"',
  '최근 공개',
  '/post/',
]

for (const marker of required) {
  if (!html.includes(marker)) fail('origin/gh-pages:index.html missing marker: ' + marker)
}

if (receipt?.expected?.slug && !html.includes('/' + String(receipt.expected.slug).replace(/^\/+|\/+$/g, ''))) {
  fail('origin/gh-pages:index.html missing expected VACMS post link: ' + receipt.expected.slug)
}

console.log(PASS_STATUS)
