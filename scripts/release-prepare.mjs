#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import process from 'node:process'

const steps = [
  ['npm', ['run', 'csv:pages'], 'csv:pages'],
  ['npm', ['run', 'check:launch'], 'check:launch'],
  ['npm', ['run', 'build'], 'build'],
  ['node', ['scripts/create-spa-fallback.mjs'], 'create-spa-fallback'],
  ['npm', ['run', 'generate:sitemap'], 'generate:sitemap'],
  ['npm', ['run', 'smoke:seo'], 'smoke:seo'],
]

function run(command, args, label) {
  console.log(`[release:prepare] running ${label}`)
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.status !== 0) {
    console.error(`[release:prepare] FAILED ${label}`)
    process.exit(result.status ?? 1)
  }

  console.log(`[release:prepare] OK ${label}`)
}

for (const [command, args, label] of steps) run(command, args, label)

console.log('[release:prepare] OK release artifacts are ready')
