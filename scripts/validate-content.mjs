import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import parseFrontmatter from './lib/simple-frontmatter.mjs'

const projectRoot = process.cwd()
const contentRoot = path.join(projectRoot, 'src', 'content', 'pages')

const issues = []

function toProjectPath(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/')
}

function addIssue(issue) {
  issues.push({
    severity: issue.severity || 'warning',
    kind: issue.kind || 'unknown',
    file: issue.file ? toProjectPath(issue.file) : '',
    field: issue.field || '',
    value: issue.value,
    message: issue.message || '',
  })
}

function walkIndexMarkdownFiles(dir) {
  const results = []
  if (!existsSync(dir)) return results

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      results.push(...walkIndexMarkdownFiles(fullPath))
      continue
    }

    if (entry.isFile() && entry.name === 'index.md') {
      results.push(fullPath)
    }
  }

  return results.sort()
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function parseMarkdownFile(file) {
  const raw = readFileSync(file, 'utf8')
  const parsed = parseFrontmatter(raw)
  const frontmatter = isPlainObject(parsed.data) ? parsed.data : {}

  return {
    file,
    raw,
    frontmatter,
  }
}

function validateRequiredFields(page) {
  for (const field of ['title', 'slug']) {
    if (!isNonEmptyString(page.frontmatter[field])) {
      addIssue({
        severity: 'error',
        kind: 'missing-required-field',
        file: page.file,
        field,
        value: page.frontmatter[field],
        message: 'Missing required frontmatter field: ' + field,
      })
    }
  }
}

function validateSlugFormat(page) {
  const slug = page.frontmatter.slug
  if (!isNonEmptyString(slug)) return

  if (slug !== slug.trim()) {
    addIssue({
      severity: 'error',
      kind: 'invalid-slug-format',
      file: page.file,
      field: 'slug',
      value: slug,
      message: 'Slug must not contain leading or trailing whitespace.',
    })
  }

  if (slug.startsWith('/') || slug.endsWith('/')) {
    addIssue({
      severity: 'error',
      kind: 'invalid-slug-format',
      file: page.file,
      field: 'slug',
      value: slug,
      message: 'Slug must not start or end with a slash.',
    })
  }

  if (slug.includes('//')) {
    addIssue({
      severity: 'error',
      kind: 'invalid-slug-format',
      file: page.file,
      field: 'slug',
      value: slug,
      message: 'Slug must not contain duplicate slashes.',
    })
  }

  if (/\s/.test(slug)) {
    addIssue({
      severity: 'error',
      kind: 'invalid-slug-format',
      file: page.file,
      field: 'slug',
      value: slug,
      message: 'Slug must not contain whitespace.',
    })
  }

  if (!/^[A-Za-z0-9._~/-]+$/.test(slug)) {
    addIssue({
      severity: 'warning',
      kind: 'non-ascii-slug',
      file: page.file,
      field: 'slug',
      value: slug,
      message: 'Slug contains characters outside the ASCII-safe route set.',
    })
  }
}

function validateBasicEnums(page) {
  const layout = page.frontmatter.layout
  const kind = page.frontmatter.kind
  const status = page.frontmatter.status
  const visibility = page.frontmatter.visibility

  if (layout !== undefined && !['default', 'wide', 'tool'].includes(String(layout))) {
    addIssue({
      severity: 'warning',
      kind: 'unknown-layout',
      file: page.file,
      field: 'layout',
      value: layout,
      message: 'Unknown layout value.',
    })
  }

  if (kind !== undefined && !['page', 'work', 'tool', 'lab', 'doc', 'product', 'qa'].includes(String(kind))) {
    addIssue({
      severity: 'warning',
      kind: 'unknown-kind',
      file: page.file,
      field: 'kind',
      value: kind,
      message: 'Unknown kind value.',
    })
  }

  if (status !== undefined && !['draft', 'active', 'archived'].includes(String(status))) {
    addIssue({
      severity: 'warning',
      kind: 'unknown-status',
      file: page.file,
      field: 'status',
      value: status,
      message: 'Unknown status value.',
    })
  }

  if (visibility !== undefined && !['public', 'hidden', 'private', 'draft'].includes(String(visibility))) {
    addIssue({
      severity: 'warning',
      kind: 'unknown-visibility',
      file: page.file,
      field: 'visibility',
      value: visibility,
      message: 'Unknown visibility value.',
    })
  }
}

function validateDuplicateSlugs(pages) {
  const bySlug = new Map()

  for (const page of pages) {
    const slug = page.frontmatter.slug
    if (!isNonEmptyString(slug)) continue

    const list = bySlug.get(slug) || []
    list.push(page.file)
    bySlug.set(slug, list)
  }

  for (const [slug, files] of bySlug.entries()) {
    if (files.length <= 1) continue

    for (const file of files) {
      addIssue({
        severity: 'error',
        kind: 'duplicate-slug',
        file,
        field: 'slug',
        value: slug,
        message: 'Duplicate slug found: ' + slug,
      })
    }
  }
}

function validateObjectLeak(page) {
  if (page.raw.includes('[object Object]')) {
    addIssue({
      severity: 'error',
      kind: 'object-object-leak',
      file: page.file,
      field: 'body',
      value: '[object Object]',
      message: 'Rendered object placeholder leaked into markdown content.',
    })
  }
}

function printReport(pages) {
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  if (!issues.length) {
    console.log('[VARUNTOOLS][content-validation] OK')
    console.log('Checked ' + pages.length + ' markdown pages.')
    console.log('0 errors, 0 warnings.')
    return
  }

  const label = errors.length ? 'FAILED' : 'OK_WITH_WARNINGS'
  console.log('[VARUNTOOLS][content-validation] ' + label)
  console.log('Checked ' + pages.length + ' markdown pages.')
  console.log(errors.length + ' errors, ' + warnings.length + ' warnings.')
  console.log('')

  for (const issue of issues) {
    console.log(issue.severity.toUpperCase() + ' ' + issue.kind)
    console.log('  file: ' + issue.file)
    if (issue.field) console.log('  field: ' + issue.field)
    if (issue.value !== undefined) console.log('  value: ' + String(issue.value))
    console.log('  message: ' + issue.message)
    console.log('')
  }
}

const files = walkIndexMarkdownFiles(contentRoot)
const pages = files.map(parseMarkdownFile)

for (const page of pages) {
  validateRequiredFields(page)
  validateSlugFormat(page)
  validateBasicEnums(page)
  validateObjectLeak(page)
}

validateDuplicateSlugs(pages)
printReport(pages)

if (issues.some((issue) => issue.severity === 'error')) {
  process.exit(1)
}

