#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const failures = []

const roots = [
  'src/markdown',
  'src/components/markdown',
  'src/content',
]

const extensions = new Set(['.ts', '.tsx', '.vue'])

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walk(fullPath, files)
      continue
    }

    if (extensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

function normalizePath(value) {
  return value.split(path.sep).join('/')
}

function checkFile(file) {
  const text = fs.readFileSync(file, 'utf8')
  const rel = normalizePath(file)

  const patterns = [
    ['D1Database', /\bD1Database\b/u],
    ['R2Bucket', /\bR2Bucket\b/u],
    ['env.DB', /\benv\.DB\b/u],
    ['env.BUCKET', /\benv\.BUCKET\b/u],
    ['db.prepare(', /\bdb\s*\.\s*prepare\s*\(/u],
    ['database.prepare(', /\bdatabase\s*\.\s*prepare\s*\(/u],
    ['bucket.get(', /\bbucket\s*\.\s*get\s*\(/u],
    ['bucket.put(', /\bbucket\s*\.\s*put\s*\(/u],
    ['bucket.list(', /\bbucket\s*\.\s*list\s*\(/u],
    ['listObjects(', /\blistObjects\s*\(/u],
    ['getObject(', /\bgetObject\s*\(/u],
    ['putObject(', /\bputObject\s*\(/u],
    ['SQL SELECT FROM', /\bSELECT\b[\s\S]{0,120}\bFROM\b/u],
  ]

  for (const [label, pattern] of patterns) {
    if (pattern.test(text)) {
      failures.push(rel + ' public D1/R2 coupling pattern: ' + label)
    }
  }
}

for (const root of roots) {
  for (const file of walk(root)) {
    checkFile(file)
  }
}

if (failures.length) {
  console.error('FAIL_VARUNTOOLS_CMS_NO_PUBLIC_D1_R2_COUPLING')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log('PASS_VARUNTOOLS_CMS_NO_PUBLIC_D1_R2_COUPLING')
