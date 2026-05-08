import type { ParsedDirective } from '../directiveTypes'
import { attrsToHtml, escapeHtml } from '../directiveHtml'

function renderInvalidDirective(name: string, reason: string): string {
  return `<div class="vt-directive-error" data-directive="${escapeHtml(name)}" data-reason="${escapeHtml(reason)}">Invalid ${escapeHtml(name)} directive: ${escapeHtml(reason)}</div>`
}

export function renderFeaturedWorksDirective(directive: ParsedDirective): string {
  const attrs = { ...directive.attrs }

  if (attrs.limit !== undefined && typeof attrs.limit !== 'number') {
    return renderInvalidDirective('featured-works', 'invalid_limit')
  }

  if (typeof attrs.limit === 'number') {
    attrs.limit = Math.max(1, Math.min(24, attrs.limit))
  }

  return `<featured-works ${attrsToHtml(attrs)}></featured-works>`
}
