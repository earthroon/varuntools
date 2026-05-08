import type {
  DirectiveFieldValue,
  DirectiveName,
  DirectiveParseResult,
} from './directiveTypes'
import { KNOWN_DIRECTIVES } from './directiveTypes'

const KNOWN_DIRECTIVE_SET = new Set<string>(KNOWN_DIRECTIVES)

export function coerceValue(value: string): DirectiveFieldValue {
  const trimmed = value.trim()

  if (trimmed === 'true') return true
  if (trimmed === 'false') return false

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed)
  }

  return trimmed
}

function splitDirectiveInnerLines(lines: string[]): {
  attrLines: string[]
  bodyLines: string[]
} {
  const inner = lines.slice(1, -1)
  const bodySeparatorIndex = inner.findIndex((line) => line.trim() === '::')

  if (bodySeparatorIndex >= 0) {
    return {
      attrLines: inner.slice(0, bodySeparatorIndex),
      bodyLines: inner.slice(bodySeparatorIndex + 1),
    }
  }

  return {
    attrLines: inner,
    bodyLines: [],
  }
}

export function parseDirectiveBlock(raw: string): DirectiveParseResult {
  const normalized = raw.replace(/\r\n/g, '\n').trimEnd()
  const lines = normalized.split('\n')
  const first = lines[0]?.trim() || ''
  const last = lines[lines.length - 1]?.trim() || ''
  const match = first.match(/^::([a-z0-9-]+)\s*$/)

  if (!match) {
    return {
      ok: false,
      reason: 'missing_directive_open',
      raw,
    }
  }

  if (last !== '::') {
    return {
      ok: false,
      reason: 'missing_directive_close',
      raw,
    }
  }

  const rawName = match[1]
  if (!KNOWN_DIRECTIVE_SET.has(rawName)) {
    return {
      ok: false,
      reason: `unknown_directive:${rawName}`,
      raw,
    }
  }

  const attrs: Record<string, DirectiveFieldValue> = {}
  const bodyLines: string[] = []
  const { attrLines, bodyLines: separatedBodyLines } = splitDirectiveInnerLines(lines)

  for (const line of attrLines) {
    const attrMatch = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/)

    if (attrMatch) {
      attrs[attrMatch[1]] = coerceValue(attrMatch[2])
      continue
    }

    bodyLines.push(line)
  }

  bodyLines.push(...separatedBodyLines)

  return {
    ok: true,
    directive: {
      name: rawName as DirectiveName,
      rawName,
      attrs,
      body: bodyLines.join('\n').trim(),
      raw,
    },
  }
}
