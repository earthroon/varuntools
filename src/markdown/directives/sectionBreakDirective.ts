import type { DirectiveFieldValue, ParsedDirective } from '../directiveTypes'
import { attrsToHtml, escapeHtml } from '../directiveHtml'

const ALLOWED_TONES = new Set(['quiet', 'accent', 'ink'])

function renderInvalidDirective(name: string, reason: string): string {
  return `<div class="vt-directive-error" data-directive="${escapeHtml(name)}" data-reason="${escapeHtml(reason)}">Invalid ${escapeHtml(name)} directive: ${escapeHtml(reason)}</div>`
}

function cloneAttrs(attrs: Record<string, DirectiveFieldValue>): Record<string, DirectiveFieldValue> {
  return Object.entries(attrs).reduce<Record<string, DirectiveFieldValue>>((acc, [key, value]) => {
    acc[key] = value
    return acc
  }, {})
}

export function renderSectionBreakDirective(directive: ParsedDirective): string {
  const attrs = cloneAttrs(directive.attrs)

  if (attrs.tone !== undefined) {
    if (typeof attrs.tone !== 'string') {
      return renderInvalidDirective('section-break', 'invalid_tone')
    }

    if (!ALLOWED_TONES.has(attrs.tone)) {
      return renderInvalidDirective('section-break', 'invalid_tone')
    }
  }

  return `<section-break ${attrsToHtml(attrs)}></section-break>`
}
