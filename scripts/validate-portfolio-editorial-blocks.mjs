#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = process.cwd()
const VALID_TITLE_LEVELS = new Set(['major', 'middle', 'minor'])
const VALID_TITLE_TAGS = new Set(['h1', 'h2', 'h3', 'h4'])
const VALID_COLUMN_COUNTS = new Set(['2', '3'])
const VALID_COLUMN_GAPS = new Set(['sm', 'md', 'lg'])
const VALID_COLUMN_COLLAPSE = new Set(['mobile', 'tablet', 'never'])
const EXCLUDED_DEFAULT_FILES = new Set(['src/markdown/__fixtures__/portfolio-editorial-invalid-cases.md'])
const OBJECT_LEAK_TOKEN = '[' + 'object Object' + ']'

function toPosix(file) {
  return file.split(path.sep).join('/')
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(file, files)
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(file)
  }
  return files
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function issue(issues, file, code, severity, message, line) {
  issues.push({ file, code, severity, message, line })
}

function parseAttrs(lines) {
  const attrs = new Map()
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/)
    if (!match) continue
    attrs.set(match[1], match[2].trim().replace(/^['"]|['"]$/g, ''))
  }
  return attrs
}

function splitColumns(body) {
  const normalized = body.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []
  return normalized.split(/^---\s*$/m).map((column) => column.trim())
}

function scanDirectives(file, source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const directives = []

  for (let index = 0; index < lines.length; index += 1) {
    const marker = lines[index].trim()
    if (marker !== '::editorial-title' && marker !== '::editorial-columns') continue

    const name = marker.slice(2)
    const startLine = index + 1
    const attrLines = []
    index += 1

    while (index < lines.length && lines[index].trim() !== '::') {
      attrLines.push(lines[index])
      index += 1
    }

    if (index >= lines.length) {
      directives.push({ name, startLine, attrs: parseAttrs(attrLines), body: '', unterminated: true })
      break
    }

    if (name === 'editorial-title') {
      directives.push({ name, startLine, attrs: parseAttrs(attrLines), body: '', unterminated: false })
      continue
    }

    const bodyLines = []
    index += 1
    while (index < lines.length && lines[index].trim() !== '::') {
      bodyLines.push(lines[index])
      index += 1
    }

    directives.push({
      name,
      startLine,
      attrs: parseAttrs(attrLines),
      body: bodyLines.join('\n'),
      unterminated: index >= lines.length,
    })
  }

  return directives
}

export function validatePortfolioEditorialFile(file, source) {
  const issues = []

  if (source.includes(OBJECT_LEAK_TOKEN)) {
    issue(issues, file, 'OBJECT_OBJECT_LEAK', 'error', 'The source contains a literal object-string leak.', 1)
  }

  for (const directive of scanDirectives(file, source)) {
    if (directive.unterminated) {
      issue(issues, file, 'UNTERMINATED_EDITORIAL_DIRECTIVE', 'error', `${directive.name} is missing its closing marker.`, directive.startLine)
      continue
    }

    if (directive.name === 'editorial-title') {
      const title = directive.attrs.get('title') || ''
      const level = directive.attrs.get('level') || ''
      const as = directive.attrs.get('as') || ''

      if (!title.trim()) {
        issue(issues, file, 'MISSING_EDITORIAL_TITLE', 'error', 'editorial-title requires a non-empty title.', directive.startLine)
      }
      if (!VALID_TITLE_LEVELS.has(level)) {
        issue(issues, file, 'INVALID_EDITORIAL_TITLE_LEVEL', 'error', 'editorial-title level must be major, middle, or minor.', directive.startLine)
      }
      if (as && !VALID_TITLE_TAGS.has(as)) {
        issue(issues, file, 'INVALID_EDITORIAL_TITLE_TAG', 'error', 'editorial-title as must be h1, h2, h3, or h4.', directive.startLine)
      }
      continue
    }

    const cols = directive.attrs.get('cols') || directive.attrs.get('columns') || ''
    const gap = directive.attrs.get('gap') || ''
    const collapse = directive.attrs.get('collapse') || ''
    const chunks = splitColumns(directive.body)

    if (!VALID_COLUMN_COUNTS.has(cols)) {
      issue(issues, file, 'INVALID_EDITORIAL_COLUMN_COUNT', 'error', 'editorial-columns cols must be 2 or 3.', directive.startLine)
    }
    if (gap && !VALID_COLUMN_GAPS.has(gap)) {
      issue(issues, file, 'INVALID_EDITORIAL_COLUMN_GAP', 'error', 'editorial-columns gap must be sm, md, or lg.', directive.startLine)
    }
    if (collapse && !VALID_COLUMN_COLLAPSE.has(collapse)) {
      issue(issues, file, 'INVALID_EDITORIAL_COLUMN_COLLAPSE', 'error', 'editorial-columns collapse must be mobile, tablet, or never.', directive.startLine)
    }
    if (!chunks.length || chunks.some((chunk) => !chunk.trim())) {
      issue(issues, file, 'EMPTY_EDITORIAL_COLUMN', 'warning', 'editorial-columns contains an empty column body.', directive.startLine)
    }
    if (VALID_COLUMN_COUNTS.has(cols) && chunks.length !== Number(cols)) {
      const severity = chunks.length > Number(cols) ? 'error' : 'warning'
      issue(issues, file, 'COLUMN_COUNT_MISMATCH', severity, `editorial-columns cols is ${cols}, but ${chunks.length} column bodies were found.`, directive.startLine)
    }
  }

  return issues
}

export function validatePortfolioEditorialFiles(files) {
  const issues = []
  for (const file of files) {
    if (fs.existsSync(path.join(root, file))) issues.push(...validatePortfolioEditorialFile(file, read(file)))
  }
  const errors = issues.filter((item) => item.severity === 'error')
  const warnings = issues.filter((item) => item.severity === 'warning')
  return { ok: errors.length === 0, errors, warnings }
}

function defaultFiles() {
  const files = [
    ...walk(path.join(root, 'src/content/pages')),
    ...walk(path.join(root, 'src/markdown/__fixtures__')),
  ].map((file) => toPosix(path.relative(root, file)))
  return files.filter((file) => !EXCLUDED_DEFAULT_FILES.has(file))
}

function print(result) {
  for (const item of [...result.errors, ...result.warnings]) {
    console.log(`${item.severity.toUpperCase()} ${item.code} ${item.file}${item.line ? `:${item.line}` : ''} - ${item.message}`)
  }
}

function printCodeSummary(result) {
  const codes = [...new Set([...result.errors, ...result.warnings].map((item) => item.code))]
  for (const code of codes) console.log(code)
}

function cli() {
  const args = process.argv.slice(2)
  const expectInvalidIndex = args.indexOf('--expect-invalid')

  if (expectInvalidIndex >= 0) {
    const file = args[expectInvalidIndex + 1]
    if (!file) {
      console.error('Missing file after --expect-invalid')
      process.exit(2)
    }

    const result = validatePortfolioEditorialFiles([file])
    print(result)
    printCodeSummary(result)

    if (result.errors.length === 0) {
      console.error(`[validate:portfolio-editorial] expected invalid issues in ${file}, found none`)
      process.exit(1)
    }

    console.log(`[validate:portfolio-editorial] OK expected invalid fixture produced ${result.errors.length} errors and ${result.warnings.length} warnings`)
    return
  }

  const explicitFiles = args.filter((arg) => !arg.startsWith('--'))
  const files = explicitFiles.length ? explicitFiles : defaultFiles()
  const result = validatePortfolioEditorialFiles(files)

  if (!result.ok) {
    console.error('validate:portfolio-editorial FAILED')
    print(result)
    process.exit(1)
  }

  console.log(`[validate:portfolio-editorial] OK - ${files.length} files scanned, ${result.warnings.length} warnings`)
}

const currentFile = path.resolve(fileURLToPath(import.meta.url))
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (currentFile === entryFile) cli()
