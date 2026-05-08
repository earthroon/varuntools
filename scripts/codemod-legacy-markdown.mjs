#!/usr/bin/env node
import path from 'node:path'
import process from 'node:process'
import {
  createFileAudit,
  walkMarkdownFiles,
  writeMarkdownFile,
} from './lib/legacy-markdown-audit.mjs'

const projectRoot = process.cwd()
const contentRoot = path.join(projectRoot, 'src', 'content', 'pages')

function parseArgs(argv) {
  const options = { check: false, write: false, json: false, strict: false, help: false, files: [] }
  for (const arg of argv) {
    if (arg === '--check' || arg === '--dry-run') options.check = true
    else if (arg === '--write') options.write = true
    else if (arg === '--json') options.json = true
    else if (arg === '--strict') options.strict = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`)
    else options.files.push(path.resolve(projectRoot, arg))
  }

  if (options.check && options.write) throw new Error('--check and --write cannot be used together.')
  if (!options.check && !options.write) options.check = true
  return options
}

function usage() {
  console.log(`Legacy Markdown Codemod\n\nUsage:\n  node scripts/codemod-legacy-markdown.mjs [file ...] [--check|--write] [--json] [--strict]\n\nSafety:\n  --check is the default.\n  --write is required to modify files.\n  Files with warnings are never modified.`)
}

function getFiles(options) {
  return options.files.length ? options.files : walkMarkdownFiles(contentRoot)
}

function summarize(audits, writtenFiles) {
  return {
    filesScanned: audits.length,
    filesChangedPreview: audits.filter((audit) => audit.changed).length,
    filesWritten: writtenFiles.length,
    convertibleGroups: audits.reduce((sum, audit) => sum + audit.totalConverted, 0),
    warnings: audits.reduce((sum, audit) => sum + audit.totalWarnings, 0),
    blockedByWarnings: audits.filter((audit) => audit.changed && audit.totalWarnings > 0).length,
  }
}

function printTextReport(audits, summary, options, writtenFiles) {
  console.log(`Legacy Markdown Codemod (${options.write ? 'write' : 'check'})`)
  console.log('')

  for (const audit of audits) {
    if (!audit.changed && audit.totalWarnings === 0) continue
    console.log(audit.relativeFile)
    console.log(`  convertible groups: ${audit.totalConverted}`)
    console.log(`  warnings: ${audit.totalWarnings}`)
    if (audit.changed && audit.totalWarnings === 0) {
      console.log(`  action: ${options.write ? 'written' : 'preview-only'}`)
    } else if (audit.totalWarnings > 0) {
      console.log('  action: blocked-by-warnings')
      for (const warning of audit.warnings) {
        const line = warning.line ? `:${warning.line}` : ''
        console.log(`    warning ${warning.adapter}/${warning.code}${line} - ${warning.message}`)
      }
    }
    console.log('')
  }

  console.log('Summary')
  console.log(`  files scanned: ${summary.filesScanned}`)
  console.log(`  files changed preview: ${summary.filesChangedPreview}`)
  console.log(`  files written: ${summary.filesWritten}`)
  console.log(`  convertible groups: ${summary.convertibleGroups}`)
  console.log(`  warnings: ${summary.warnings}`)
  if (writtenFiles.length) {
    console.log('')
    console.log('Written files')
    for (const file of writtenFiles) console.log(`  ${file}`)
  }
}

try {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    usage()
    process.exit(0)
  }

  const files = getFiles(options)
  const audits = files.map((file) => createFileAudit(file, projectRoot))
  const writtenFiles = []

  if (options.write) {
    for (const audit of audits) {
      if (!audit.changed) continue
      if (audit.totalWarnings > 0) continue
      writeMarkdownFile(audit.file, audit.raw)
      writtenFiles.push(audit.relativeFile)
    }
  }

  const summary = summarize(audits, writtenFiles)

  if (options.json) {
    console.log(JSON.stringify({ mode: options.write ? 'write' : 'check', summary, files: audits, writtenFiles }, null, 2))
  } else {
    printTextReport(audits, summary, options, writtenFiles)
  }

  if (summary.warnings > 0 || (options.strict && summary.convertibleGroups > 0)) process.exit(1)
  process.exit(0)
} catch (error) {
  console.error(`[legacy-codemod] ${error instanceof Error ? error.message : String(error)}`)
  process.exit(2)
}
