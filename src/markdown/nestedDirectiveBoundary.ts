export type NestedDirectiveWarningCode =
  | 'nested_vue_directive_in_markdown_box'
  | 'nested_markdown_box'
  | 'unknown_nested_directive'

export type NestedDirectiveWarning = {
  code: NestedDirectiveWarningCode
  directive: string
  line?: number
  message: string
}

export type NestedDirectiveScanResult = {
  warnings: NestedDirectiveWarning[]
}

export const VUE_MARKDOWN_DIRECTIVES = [
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
  'video-player',
  'note',
  'warning',
  'tip',
] as const

const VUE_MARKDOWN_DIRECTIVE_SET = new Set<string>(VUE_MARKDOWN_DIRECTIVES)
const DIRECTIVE_OPEN_RE = /^::(?<name>[a-zA-Z][\w-]*)\s*$/

export function scanMarkdownBoxBodyForNestedDirectives(
  body: string,
  options: { baseLine?: number } = {},
): NestedDirectiveScanResult {
  const warnings: NestedDirectiveWarning[] = []
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  let inFence = false

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] || ''
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = line.trim().match(DIRECTIVE_OPEN_RE)
    const directive = match?.groups?.name
    if (!directive) continue

    const lineNumber = (options.baseLine || 1) + index
    if (directive === 'markdown-box') {
      warnings.push({
        code: 'nested_markdown_box',
        directive,
        line: lineNumber,
        message: 'markdown-box cannot be nested inside another markdown-box.',
      })
      continue
    }

    if (VUE_MARKDOWN_DIRECTIVE_SET.has(directive)) {
      warnings.push({
        code: 'nested_vue_directive_in_markdown_box',
        directive,
        line: lineNumber,
        message: `markdown-box body does not support nested Vue markdown directive: ${directive}.`,
      })
      continue
    }

    warnings.push({
      code: 'unknown_nested_directive',
      directive,
      line: lineNumber,
      message: `markdown-box body contains an unknown directive-like block: ${directive}.`,
    })
  }

  return { warnings }
}
