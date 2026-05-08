#!/usr/bin/env node
import path from 'node:path'
import process from 'node:process'
import {
  LEGACY_ADAPTER_NAMES,
  createFileAudit,
  walkMarkdownFiles,
} from './lib/legacy-markdown-audit.mjs'

const projectRoot = process.cwd()
const contentRoot = path.join(projectRoot, 'src', 'content', 'pages')

function parseArgs(argv) {
  const options = { json: false, quiet: false, strict: false, help: false, files: [] }
  for (const arg of argv) {
    if (arg === '--json') options.json = true
    else if (arg === '--quiet') options.quiet = true
    else if (arg === '--strict') options.strict = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`)
    else options.files.push(path.resolve(projectRoot, arg))
  }
  return options
}

function usage() {
  console.log(`Legacy Markdown Audit\n\nUsage:\n  node scripts/audit-legacy-markdown.mjs [file ...] [--json] [--quiet] [--strict]\n\nExit codes:\n  0 no warnings\n  1 warnings or strict convertible legacy\n  2 runtime error`)
}

function getFiles(options) {
  return options.files.length ? options.files : walkMarkdownFiles(contentRoot)
}

function summarize(audits) {
  return {
    filesScanned: audits.length,
    filesWithLegacySyntax: audits.filter((audit) => audit.totalConverted > 0 || audit.totalWarnings > 0).length,
    convertibleGroups: audits.reduce((sum, audit) => sum + audit.totalConverted, 0),
    warnings: audits.reduce((sum, audit) => sum + audit.totalWarnings, 0),
  }
}

function printTextReport(audits, summary, options) {
  console.log('Legacy Markdown Audit')
  console.log('')

  if (!options.quiet) {
    for (const audit of audits) {
      if (audit.totalConverted === 0 && audit.totalWarnings === 0) continue
      console.log(audit.relativeFile)
      for (const adapterName of LEGACY_ADAPTER_NAMES) {
        const adapter = audit.adapters.find((item) => item.adapter === adapterName)
        if (!adapter || (adapter.converted === 0 && adapter.warnings.length === 0)) continue
        console.log(`  ${adapterName.padEnd(16)} converted: ${String(adapter.converted).padEnd(3)} warnings: ${adapter.warnings.length}`)
        for (const warning of adapter.warnings) {
          const line = warning.line ? `:${warning.line}` : ''
          console.log(`    warning ${warning.code}${line} - ${warning.message}`)
        }
      }
      console.log('')
    }
  }

  console.log('Summary')
  console.log(`  files scanned: ${summary.filesScanned}`)
  console.log(`  files with legacy syntax: ${summary.filesWithLegacySyntax}`)
  console.log(`  convertible groups: ${summary.convertibleGroups}`)
  console.log(`  warnings: ${summary.warnings}`)
}

try {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    usage()
    process.exit(0)
  }
  const files = getFiles(options)
  const audits = files.map((file) => createFileAudit(file, projectRoot))
  const summary = summarize(audits)

  if (options.json) {
    console.log(JSON.stringify({ summary, files: audits }, null, 2))
  } else {
    printTextReport(audits, summary, options)
  }

  if (summary.warnings > 0 || (options.strict && summary.convertibleGroups > 0)) process.exit(1)
  process.exit(0)
} catch (error) {
  console.error(`[legacy-audit] ${error instanceof Error ? error.message : String(error)}`)
  process.exit(2)
}
