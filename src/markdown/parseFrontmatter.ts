import type { MarkdownFrontmatter } from '@/types/content'
import type { ParsedMarkdownPage } from './types'

function unquote(value: string): string {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim()
  if (trimmed === '') return ''
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed)
  return unquote(trimmed)
}

function parseInlineArray(value: string): unknown[] | null {
  const trimmed = value.trim()
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return null
  const body = trimmed.slice(1, -1).trim()
  if (!body) return []
  return body.split(',').map((part) => parseScalar(part.trim()))
}

function countIndent(line: string): number {
  return line.match(/^\s*/)?.[0].length || 0
}

function parseFrontmatterBlock(block: string): MarkdownFrontmatter {
  const data: Record<string, unknown> = {}
  const lines = block.split(/\r?\n/)

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index]
    if (!rawLine.trim() || rawLine.trimStart().startsWith('#')) continue

    const pair = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!pair) continue

    const [, key, rawValue] = pair
    const inlineArray = parseInlineArray(rawValue)
    if (inlineArray) {
      data[key] = inlineArray
      continue
    }

    if (rawValue.trim() !== '') {
      data[key] = parseScalar(rawValue)
      continue
    }

    const items: unknown[] = []
    const objectValue: Record<string, unknown> = {}
    let cursor = index + 1

    while (cursor < lines.length) {
      const childRaw = lines[cursor]
      if (!childRaw.trim()) {
        cursor += 1
        continue
      }

      const indent = countIndent(childRaw)
      if (indent === 0) break

      const item = childRaw.match(/^\s+-\s*(.*)$/)
      if (item) {
        items.push(parseScalar(item[1]))
        cursor += 1
        continue
      }

      const child = childRaw.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/)
      if (child) {
        const [, childKey, childRawValue] = child
        const childInlineArray = parseInlineArray(childRawValue)
        objectValue[childKey] = childInlineArray || parseScalar(childRawValue)
        cursor += 1
        continue
      }

      break
    }

    if (items.length > 0) {
      data[key] = items
      index = cursor - 1
    } else if (Object.keys(objectValue).length > 0) {
      data[key] = objectValue
      index = cursor - 1
    } else {
      data[key] = ''
    }
  }

  return data as MarkdownFrontmatter
}

export function parseFrontmatter(raw: string): ParsedMarkdownPage {
  const normalized = String(raw || '')
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)

  if (!match) {
    return {
      frontmatter: {} as MarkdownFrontmatter,
      content: normalized,
    }
  }

  return {
    frontmatter: parseFrontmatterBlock(match[1]),
    content: match[2],
  }
}
