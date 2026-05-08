import MarkdownIt from 'markdown-it'
import type { DirectiveFieldValue, ParsedDirective } from '../directiveTypes'
import { attrValue, renderInvalidDirective } from '../directiveHtml'
import { scanMarkdownBoxBodyForNestedDirectives } from '../nestedDirectiveBoundary'

const VALID_TYPES = new Set(['note', 'tip', 'warning', 'danger', 'quote', 'decision', 'ssot'])
const VALID_TONES = new Set(['neutral', 'blue', 'amber', 'red', 'green', 'ink'])

const bodyRenderer = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

function stringField(value: DirectiveFieldValue | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function boolField(value: DirectiveFieldValue | undefined, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return fallback
}

function dataAttr(name: string, value: string | boolean): string {
  return `data-${name}="${attrValue(value)}"`
}

function nestedReason(directives: string[]): string {
  const unique = [...new Set(directives)].sort()
  return `nested_directive_not_supported:${unique.join(',')}`
}

export function renderMarkdownBoxDirective(directive: ParsedDirective): string {
  const attrs = directive.attrs
  const type = stringField(attrs.type) || 'note'
  const normalizedType = VALID_TYPES.has(type) ? type : 'note'
  const tone = stringField(attrs.tone)
  const normalizedTone = tone && VALID_TONES.has(tone) ? tone : ''
  const title = stringField(attrs.title)
  const icon = stringField(attrs.icon)
  const collapsible = boolField(attrs.collapsible, false)
  const defaultOpen = boolField(attrs.defaultOpen, true)
  const body = directive.body.trim()

  if (!body && !title) {
    return renderInvalidDirective('markdown-box', 'missing_body_or_title')
  }

  const nested = scanMarkdownBoxBodyForNestedDirectives(body)
  if (nested.warnings.length) {
    return renderInvalidDirective(
      'markdown-box',
      nestedReason(nested.warnings.map((warning) => warning.directive)),
    )
  }

  const html = body ? bodyRenderer.render(body) : ''
  const htmlAttrs = [
    dataAttr('type', normalizedType),
    title ? dataAttr('title', title) : '',
    normalizedTone ? dataAttr('tone', normalizedTone) : '',
    icon ? dataAttr('icon', icon) : '',
    dataAttr('collapsible', collapsible),
    dataAttr('default-open', defaultOpen),
  ]
    .filter(Boolean)
    .join(' ')

  return `<markdown-box ${htmlAttrs}><template data-markdown-box-html>${html}</template></markdown-box>`
}
