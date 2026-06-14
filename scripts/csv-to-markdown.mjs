#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { csvRowsToMarkdown } from './lib/csv-markdown.mjs'
import { formatDiagnostic } from './lib/csv-diagnostics.mjs'
import { buildCsvMarkdownReport, diffMarkdown, formatCsvMarkdownReport, formatMarkdownDiff, readCurrentMarkdown } from './lib/csv-diff-report.mjs'

function usage() {
  return [
    'Usage:',
    '  npm run csv:page -- <path/to/page.csv> [--dry-run|--preview|--diff|--check|--report] [--write] [--out <path>] [--strict]',
    '',
    'Examples:',
    '  npm run csv:page -- src/content/pages/works/project-name/page.csv',
    '  npm run csv:page -- src/content/pages/works/project-name/page.csv --preview',
    '  npm run csv:page -- src/content/pages/works/project-name/page.csv --diff',
    '  npm run csv:page -- src/content/pages/works/project-name/page.csv --check',
    '  npm run csv:page -- src/content/pages/works/project-name/page.csv --strict --report',
  ].join('\n')
}

function parseArgs(argv) {
  const positional = []
  let dryRun = false
  let strict = false
  let report = false
  let preview = false
  let diff = false
  let check = false
  let write = false
  let out = ''
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dry-run') { dryRun = true; preview = true }
    else if (arg === '--preview') preview = true
    else if (arg === '--diff') diff = true
    else if (arg === '--check') check = true
    else if (arg === '--write') write = true
    else if (arg === '--strict') strict = true
    else if (arg === '--report') report = true
    else if (arg === '--out') {
      if (!argv[i + 1]) throw new Error('csv:page ERROR: --out requires a path')
      out = argv[i + 1]
      i += 1
    } else positional.push(arg)
  }
  return { csvPath: positional[0], dryRun, preview, diff, check, write, strict, report, out }
}

function printDiagnostics(diagnostics = []) {
  if (!diagnostics.length) return
  console.warn('CSV diagnostics:')
  for (const diagnostic of diagnostics) {
    const output = formatDiagnostic(diagnostic)
    if (diagnostic.level === 'error') console.error(output)
    else console.warn(output)
  }
}

function hasErrors(result) {
  return Array.isArray(result.errors) && result.errors.length > 0
}


try {
  const { csvPath, preview, diff, check, write, strict, report, out } = parseArgs(process.argv.slice(2))
  if (!csvPath) {
    console.error(usage())
    process.exit(2)
  }

  const absoluteCsvPath = path.resolve(process.cwd(), csvPath)
  if (!fs.existsSync(absoluteCsvPath)) throw new Error(`csv:page ERROR: CSV not found: ${csvPath}`)

  const source = fs.readFileSync(absoluteCsvPath, 'utf8')
  const relativeCsvPath = path.relative(process.cwd(), absoluteCsvPath)
  const rows = csvRowsToObjects(parseCsv(source), { sourcePath: relativeCsvPath })
  const outputPath = out ? path.resolve(process.cwd(), out) : path.join(path.dirname(absoluteCsvPath), 'index.md')
  const result = csvRowsToMarkdown(rows, {
    sourceCsvPath: relativeCsvPath,
    outputMarkdownPath: path.relative(process.cwd(), outputPath),
    strict,
  })

  const relativeOutputPath = path.relative(process.cwd(), outputPath)
  const currentMarkdown = readCurrentMarkdown(outputPath)
  const comparison = buildCsvMarkdownReport({
    sourcePath: relativeCsvPath,
    outputPath: relativeOutputPath,
    currentMarkdown,
    generatedMarkdown: result.markdown,
    diagnostics: result.diagnostics || [],
    summary: result.summary,
  })

  if (result.diagnostics?.length) printDiagnostics(result.diagnostics)

  const observationMode = preview || diff || check || report

  if (report) console.log(formatCsvMarkdownReport(comparison))

  if (hasErrors(result)) {
    if (!result.diagnostics?.length) {
      for (const error of result.errors) console.error(`[csv:page] error: ${error}`)
    }
    process.exit(1)
  }

  if (preview) process.stdout.write(result.markdown)

  if (diff) {
    const markdownDiff = diffMarkdown(currentMarkdown, result.markdown)
    console.log(formatMarkdownDiff(markdownDiff, {
      currentLabel: relativeOutputPath,
      nextLabel: `generated from ${relativeCsvPath}`,
    }))
  }

  if (check && comparison.changed) {
    console.error(`[csv:page] stale output: ${relativeOutputPath} differs from ${relativeCsvPath}`)
    process.exit(1)
  }

  if (check && !comparison.changed) console.log(`[csv:page] OK ${relativeOutputPath} is up to date`)

  if (!observationMode || write) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, result.markdown, 'utf8')
    console.log(`[csv:page] wrote ${relativeOutputPath}`)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
