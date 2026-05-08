import type { DirectiveFieldValue, ParsedDirective } from '../directiveTypes'
import { attrsToHtml, escapeHtml } from '../directiveHtml'

const ALLOWED_SIZES = new Set(['sm', 'md', 'lg', 'xl'])

function renderInvalidDirective(name: string, reason: string): string {
  return `<div class="vt-directive-error" data-directive="${escapeHtml(name)}" data-reason="${escapeHtml(reason)}">Invalid ${escapeHtml(name)} directive: ${escapeHtml(reason)}</div>`
}

function cloneAttrs(attrs: Record<string, DirectiveFieldValue>): Record<string, DirectiveFieldValue> {
  return Object.entries(attrs).reduce<Record<string, DirectiveFieldValue>>((acc, [key, value]) => {
    acc[key] = value
    return acc
  }, {})
}

export function renderSectionGapDirective(directive: ParsedDirective): string {
  const attrs = cloneAttrs(directive.attrs)

  if (attrs.size !== undefined) {
    if (typeof attrs.size !== 'string') {
      return renderInvalidDirective('section-gap', 'invalid_size')
    }

    if (!ALLOWED_SIZES.has(attrs.size)) {
      return renderInvalidDirective('section-gap', 'invalid_size')
    }
  }

  if (attrs.height !== undefined) {
    if (typeof attrs.height !== 'number') {
      return renderInvalidDirective('section-gap', 'invalid_height')
    }

    attrs.height = Math.min(240, Math.max(12, attrs.height))
  }

  return `<section-gap ${attrsToHtml(attrs)}></section-gap>`
}
