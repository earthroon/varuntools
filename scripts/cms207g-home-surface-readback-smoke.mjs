#!/usr/bin/env node
import childProcess from 'node:child_process'

const PASS_STATUS = 'PASS_CMS_207G_HOME_SURFACE_READBACK'

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

let html = ''
try {
  html = git(['show', 'origin/gh-pages:index.html'])
} catch (error) {
  fail('failed to read origin/gh-pages:index.html: ' + (error instanceof Error ? error.message : String(error)))
}

const requiredMarkers = [
  'data-vacms-home-static-prerender="true"',
  'data-vacms-home-recent-feed="true"',
  'data-vacms-home-recent-card="true"',
  '/post/',
]

for (const marker of requiredMarkers) {
  if (!html.includes(marker)) {
    fail('origin/gh-pages:index.html missing marker: ' + marker)
  }
}

console.log(PASS_STATUS)