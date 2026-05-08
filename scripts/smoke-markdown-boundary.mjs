import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const fixturesRoot = path.join(root, 'src', 'markdown', '__fixtures__')
const VUE_DIRECTIVES = new Set([
  'captioned-image',
  'before-after',
  'pagecard-grid',
  'markdown-box',
  'section-gap',
  'section-break',
  'image-card',
  'featured-works',
  'work-card',
  'video',
  'note',
  'warning',
  'tip',
])

function readFixture(name) {
  return readFileSync(path.join(fixturesRoot, name), 'utf8')
}

function extractMarkdownBoxBody(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex((line) => line.trim() === '::markdown-box')
  if (start < 0) return ''

  let separator = start + 1
  while (separator < lines.length && lines[separator].trim() !== '::') separator += 1
  if (separator >= lines.length) return ''

  let nestedDepth = 0
  let end = -1
  for (let i = separator + 1; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (/^::[a-z0-9-]+\s*$/.test(line)) {
      nestedDepth += 1
      continue
    }
    if (line === '::') {
      if (nestedDepth > 0) {
        nestedDepth -= 1
        continue
      }
      end = i
      break
    }
  }

  if (end < 0) return ''
  return lines.slice(separator + 1, end).join('\n').trim()
}

function scan(body) {
  const warnings = []
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  let inFence = false
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] || ''
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const match = line.trim().match(/^::(?<directive>[a-zA-Z][\w-]*)\s*$/)
    const directive = match?.groups?.directive
    if (!directive) continue
    const code = directive === 'markdown-box'
      ? 'nested_markdown_box'
      : VUE_DIRECTIVES.has(directive)
        ? 'nested_vue_directive_in_markdown_box'
        : 'unknown_nested_directive'
    warnings.push({ code, directive })
  }
  return warnings
}

function renderLikeMarkdownBox(body) {
  const warnings = scan(body)
  if (!warnings.length) return '<markdown-box><template data-markdown-box-html></template></markdown-box>'
  const unique = [...new Set(warnings.map((warning) => warning.directive))].sort().join(',')
  return `<div class="vt-directive-error" data-directive="markdown-box" data-reason="nested_directive_not_supported:${unique}">Invalid markdown-box directive: nested_directive_not_supported:${unique}</div>`
}

const cases = [
  { file: 'markdown-box-safe-body.md', expectWarnings: false },
  { file: 'markdown-box-nested-pagecard.md', expectWarnings: true, directive: 'pagecard-grid' },
  { file: 'markdown-box-nested-before-after.md', expectWarnings: true, directive: 'before-after' },
  { file: 'markdown-box-nested-box.md', expectWarnings: true, directive: 'markdown-box' },
]

const failures = []
for (const test of cases) {
  const body = extractMarkdownBoxBody(readFixture(test.file))
  const warnings = scan(body)
  const rendered = renderLikeMarkdownBox(body)
  if (test.expectWarnings && warnings.length === 0) failures.push(`${test.file}: expected nested directive warning`)
  if (!test.expectWarnings && warnings.length > 0) failures.push(`${test.file}: expected no warning, got ${warnings.map((w) => w.directive).join(', ')}`)
  if (test.directive && !warnings.some((warning) => warning.directive === test.directive)) failures.push(`${test.file}: missing directive warning for ${test.directive}`)
  if (test.expectWarnings && !rendered.includes('vt-directive-error')) failures.push(`${test.file}: expected directive error placeholder`)
  if (!test.expectWarnings && rendered.includes('vt-directive-error')) failures.push(`${test.file}: unexpected directive error placeholder`)
}

if (failures.length) {
  console.error('[VARUNTOOLS][markdown-boundary-smoke] FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('[VARUNTOOLS][markdown-boundary-smoke] OK')
console.log(`Checked ${cases.length} markdown-box boundary fixtures.`)
