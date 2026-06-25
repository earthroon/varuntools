import type MarkdownIt from 'markdown-it'
import { renderRawDirective } from './directiveHtml'
import { parseDirectiveBlock } from './directiveParser'
import { renderDirective } from './directives'

function readTrimmedLine(state: any, lineNumber: number): string {
  const lineStart = state.bMarks[lineNumber] + state.tShift[lineNumber]
  const lineEnd = state.eMarks[lineNumber]
  return state.src.slice(lineStart, lineEnd).trim()
}

function findGenericDirectiveEnd(state: any, startLine: number, endLine: number): number {
  let nextLine = startLine + 1
  while (nextLine < endLine) {
    if (readTrimmedLine(state, nextLine) === '::') return nextLine
    nextLine += 1
  }
  return -1
}

const BODY_DIRECTIVES = new Set(['markdown-box', 'note', 'tip', 'warning', 'gallery-strip', 'editorial-columns', 'portfolio-hero', 'work-summary', 'role-stack', 'case-section', 'metric-card', 'tool-stack', 'quote-block', 'case-gallery', 'related-works', 'field-spec'])

function findMarkdownBoxEnd(state: any, startLine: number, endLine: number): number {
  const separatorLine = findGenericDirectiveEnd(state, startLine, endLine)
  if (separatorLine < 0) return -1

  let nestedDepth = 0
  let lineNumber = separatorLine + 1
  let foundBodyLine = false

  while (lineNumber < endLine) {
    const line = readTrimmedLine(state, lineNumber)

    if (/^::[a-z0-9-]+\s*$/.test(line)) {
      nestedDepth += 1
      foundBodyLine = true
      lineNumber += 1
      continue
    }

    if (line === '::') {
      if (nestedDepth > 0) {
        nestedDepth -= 1
        foundBodyLine = true
        lineNumber += 1
        continue
      }
      return lineNumber
    }

    if (line) foundBodyLine = true
    lineNumber += 1
  }

  return foundBodyLine ? -1 : separatorLine
}

export function directivePlugin(md: MarkdownIt): void {
  md.block.ruler.before(
    'fence',
    'varun_directive',
    (state: any, startLine: number, endLine: number, silent: boolean) => {
      const start = state.bMarks[startLine] + state.tShift[startLine]
      const max = state.eMarks[startLine]
      const firstLine = state.src.slice(start, max).trim()
      const open = firstLine.match(/^::([a-z0-9-]+)\s*$/)

      if (!open) {
        return false
      }

      const directiveName = open[1]
      const endDirectiveLine = BODY_DIRECTIVES.has(directiveName)
        ? findMarkdownBoxEnd(state, startLine, endLine)
        : findGenericDirectiveEnd(state, startLine, endLine)

      if (endDirectiveLine < 0) return false
      if (silent) return true

      const rawStart = state.bMarks[startLine]
      const rawEnd = state.eMarks[endDirectiveLine]
      const raw = state.src.slice(rawStart, rawEnd)

      const token = state.push('varun_directive', '', 0)
      token.block = true
      token.map = [startLine, endDirectiveLine + 1]
      token.content = raw

      state.line = endDirectiveLine + 1
      return true
    },
  )

  md.renderer.rules.varun_directive = (tokens, idx) => {
    const raw = tokens[idx].content
    const parsed = parseDirectiveBlock(raw)

    if (!parsed.ok) {
      return renderRawDirective(raw, parsed.reason)
    }

    return renderDirective(parsed.directive)
  }
}
