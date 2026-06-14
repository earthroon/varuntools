#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'

function walk(dir, matches = []) {
  if (!fs.existsSync(dir)) return matches
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(fullPath, matches)
    else if (entry.isFile() && entry.name === 'page.csv') matches.push(fullPath)
  }
  return matches
}

const root = process.cwd()
const csvFiles = walk(path.join(root, 'src', 'content', 'pages'))
let failed = false

for (const csvFile of csvFiles) {
  const relative = path.relative(root, csvFile)
  console.log(`[csv:pages] converting ${relative}`)
  const result = spawnSync('node', ['scripts/csv-to-markdown.mjs', relative], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) failed = true
}

if (failed) process.exit(1)
console.log(`[csv:pages] OK — ${csvFiles.length} page.csv files converted`)
