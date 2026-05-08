import type { ParsedDirective } from '../directiveTypes'
import { attrsToHtml, escapeHtml } from '../directiveHtml'

function renderInvalidDirective(name: string, reason: string): string {
  return `<div class="vt-directive-error" data-directive="${escapeHtml(name)}" data-reason="${escapeHtml(reason)}">Invalid ${escapeHtml(name)} directive: ${escapeHtml(reason)}</div>`
}

export function renderWorkCardDirective(directive: ParsedDirective): string {
  const attrs = { ...directive.attrs }

  const hasSlug = typeof attrs.slug === 'string' && attrs.slug.length > 0
  const hasManualTitle = typeof attrs.title === 'string' && attrs.title.length > 0

  if (!hasSlug && !hasManualTitle) {
    return renderInvalidDirective('work-card', 'missing_slug_or_title')
  }

  return `<work-card ${attrsToHtml(attrs)}></work-card>`
}
