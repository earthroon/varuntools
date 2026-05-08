import type { LegacyTransformReport } from './types'

export type LegacyBoxWarningCode =
  | 'empty_box_callout'
  | 'invalid_box_type'
  | 'unsupported_box_syntax'

export type LegacyBoxWarning = {
  code: LegacyBoxWarningCode
  line: number
  message: string
}

export type LegacyBoxResult = {
  content: string
  report: LegacyTransformReport
  converted: number
  warnings: LegacyBoxWarning[]
}

const FENCE_RE = /^\s*(```|~~~)/
const CALLOUT_RE = /^\s*>\s*\[!(?<type>note|tip|warning|danger|quote|decision|ssot)\]\s*(?<title>.*)$/i
const BLOCKQUOTE_LINE_RE = /^\s*>\s?(?<body>.*)$/

function isFenceStart(line: string): boolean {
  return FENCE_RE.test(line)
}

function isBlank(line: string): boolean {
  return line.trim().length === 0
}

function stripBodyLine(line: string): string | null {
  const match = line.match(BLOCKQUOTE_LINE_RE)
  return match?.groups?.body ?? null
}

function makeDirective(type: string, title: string, bodyLines: string[]): string {
  const lines = ['::markdown-box', `type: ${type}`]
  if (title.trim()) lines.push(`title: ${title.trim()}`)
  lines.push('::')
  lines.push(...bodyLines)
  lines.push('::')
  return lines.join('\n')
}

export function applyLegacyBoxAdapter(content: string): LegacyBoxResult {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const output: string[] = []
  const warnings: LegacyBoxWarning[] = []
  const report: LegacyTransformReport = { changed: false, items: [] }
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

    const callout = line.match(CALLOUT_RE)
    if (!callout?.groups?.type) {
      output.push(line)
      i += 1
      continue
    }

    const type = callout.groups.type.toLowerCase()
    const title = callout.groups.title.trim()
    const bodyLines: string[] = []
    let nextIndex = i + 1

    while (nextIndex < lines.length) {
      const nextLine = lines[nextIndex] || ''
      if (isBlank(nextLine)) break
      const bodyLine = stripBodyLine(nextLine)
      if (bodyLine === null) break
      bodyLines.push(bodyLine)
      nextIndex += 1
    }

    if (!title && !bodyLines.some((item) => item.trim())) {
      warnings.push({
        code: 'empty_box_callout',
        line: i + 1,
        message: 'Legacy markdown-box callout did not include a title or body.',
      })
      output.push(line)
      i += 1
      continue
    }

    const directive = makeDirective(type, title, bodyLines)
    output.push(directive)
    report.changed = true
    report.items.push({
      kind: 'box-legacy-callout',
      line: i + 1,
      token: `[!${type}]`,
      output: directive,
    })
    converted += 1
    i = nextIndex
  }

  return { content: output.join('\n'), report, converted, warnings }
}
