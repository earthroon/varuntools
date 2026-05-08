import type { LegacyTransformReport } from './types'

export type LegacyPagecardWarningCode =
  | 'empty_pagecard_group'
  | 'invalid_pagecard_href'
  | 'ambiguous_pagecard_group'
  | 'unsupported_pagecard_syntax'

export type LegacyPagecardWarning = {
  code: LegacyPagecardWarningCode
  line: number
  message: string
}

export type LegacyPagecardResult = {
  content: string
  report: LegacyTransformReport
  converted: number
  warnings: LegacyPagecardWarning[]
}

const FENCE_RE = /^\s*(```|~~~)/
const BLOCKQUOTE_WIKILINK_RE = /^\s*>\s*\[\[(?<href>[^\]]+)\]\]\s*$/
const PAGECARD_CALLOUT_RE = /^\s*>\s*\[!pagecards\]\s*$/i
const BLOCKQUOTE_HREF_RE = /^\s*>\s*(?<href>\/[A-Za-z0-9가-힣._~/-]+)\s*$/
const LIST_MARKER_RE = /^\s*\[pagecards\]\s*$/i
const LIST_HREF_RE = /^\s*-\s*(?<href>\/[A-Za-z0-9가-힣._~/-]+)\s*$/

function isFenceStart(line: string): boolean {
  return FENCE_RE.test(line)
}

function isBlank(line: string): boolean {
  return line.trim().length === 0
}

function isValidHref(href: string): boolean {
  return /^\/[A-Za-z0-9가-힣._~/-]+$/.test(href.trim())
}

function makeDirective(items: string[]): string {
  return ['::pagecard-grid', 'items:', ...items.map((item) => `  - ${item}`), '::'].join('\n')
}

function readBlockquoteWikilinks(lines: string[], startIndex: number): { items: string[]; nextIndex: number } | null {
  const first = lines[startIndex] || ''
  if (!BLOCKQUOTE_WIKILINK_RE.test(first)) return null

  const items: string[] = []
  let i = startIndex
  while (i < lines.length) {
    const match = (lines[i] || '').match(BLOCKQUOTE_WIKILINK_RE)
    if (!match?.groups?.href) break
    const href = match.groups.href.trim()
    if (!isValidHref(href)) break
    items.push(href)
    i += 1
  }

  return items.length ? { items, nextIndex: i } : null
}

function readCallout(lines: string[], startIndex: number): { items: string[]; nextIndex: number } | null {
  if (!PAGECARD_CALLOUT_RE.test(lines[startIndex] || '')) return null

  const items: string[] = []
  let i = startIndex + 1
  while (i < lines.length) {
    const line = lines[i] || ''
    if (isBlank(line)) break
    const match = line.match(BLOCKQUOTE_HREF_RE)
    if (!match?.groups?.href) break
    const href = match.groups.href.trim()
    if (!isValidHref(href)) break
    items.push(href)
    i += 1
  }

  return { items, nextIndex: i }
}

function readList(lines: string[], startIndex: number): { items: string[]; nextIndex: number } | null {
  if (!LIST_MARKER_RE.test(lines[startIndex] || '')) return null

  const items: string[] = []
  let i = startIndex + 1
  while (i < lines.length) {
    const line = lines[i] || ''
    if (isBlank(line)) break
    const match = line.match(LIST_HREF_RE)
    if (!match?.groups?.href) break
    const href = match.groups.href.trim()
    if (!isValidHref(href)) break
    items.push(href)
    i += 1
  }

  return { items, nextIndex: i }
}

export function applyLegacyPagecardAdapter(content: string): LegacyPagecardResult {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const output: string[] = []
  const warnings: LegacyPagecardWarning[] = []
  const report: LegacyTransformReport = {
    changed: false,
    items: [],
  }

  let converted = 0
  let inFence = false
  let i = 0

  while (i < lines.length) {
    const line = lines[i] || ''

    if (isFenceStart(line)) {
      inFence = !inFence
      output.push(line)
      i += 1
      continue
    }

    if (inFence) {
      output.push(line)
      i += 1
      continue
    }

    const group = readBlockquoteWikilinks(lines, i) || readCallout(lines, i) || readList(lines, i)

    if (!group) {
      output.push(line)
      i += 1
      continue
    }

    if (!group.items.length) {
      warnings.push({
        code: 'empty_pagecard_group',
        line: i + 1,
        message: 'Legacy pagecard marker did not include any valid href entries.',
      })
      output.push(...lines.slice(i, group.nextIndex))
      i = Math.max(group.nextIndex, i + 1)
      continue
    }

    const directive = makeDirective(group.items)
    output.push(directive)
    report.changed = true
    report.items.push({
      kind: 'pagecard-legacy-marker',
      line: i + 1,
      token: 'pagecards',
      output: directive,
    })
    converted += 1
    i = group.nextIndex
  }

  return {
    content: output.join('\n'),
    report,
    converted,
    warnings,
  }
}
