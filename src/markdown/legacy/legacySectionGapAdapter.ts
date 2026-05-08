import type { LegacyTransformReport } from './types'

const SECTION_GAP_TOKEN = '[문단끝]'

const TOKEN_ONLY_RE = /^\s*\[문단끝\]\s*$/
const TOKEN_PREFIX_RE = /^\s*\[문단끝\]\s*(.+)$/

function sectionGapDirective(): string {
  return ['::section-gap', 'size: md', '::'].join('\n')
}

function isFenceStart(line: string): boolean {
  const trimmed = line.trim()
  const fence = String.fromCharCode(96, 96, 96)
  return trimmed.startsWith(fence) || trimmed.startsWith('~~~')
}

export function applyLegacySectionGapAdapter(content: string): {
  content: string
  report: LegacyTransformReport
} {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const output: string[] = []
  const report: LegacyTransformReport = {
    changed: false,
    items: [],
  }

  let inFence = false

  lines.forEach((line, index) => {
    if (isFenceStart(line)) {
      inFence = !inFence
      output.push(line)
      return
    }

    if (inFence) {
      output.push(line)
      return
    }

    if (TOKEN_ONLY_RE.test(line)) {
      const directive = sectionGapDirective()
      output.push(directive)

      report.changed = true
      report.items.push({
        kind: 'section-gap-token',
        line: index + 1,
        token: SECTION_GAP_TOKEN,
        output: directive,
      })

      return
    }

    const prefixMatch = line.match(TOKEN_PREFIX_RE)

    if (prefixMatch) {
      const directive = sectionGapDirective()
      const rest = prefixMatch[1].trim()

      output.push(directive)
      output.push('')
      output.push(rest)

      report.changed = true
      report.items.push({
        kind: 'section-gap-token',
        line: index + 1,
        token: SECTION_GAP_TOKEN,
        output: directive,
      })

      return
    }

    output.push(line)
  })

  return {
    content: output.join('\n'),
    report,
  }
}
