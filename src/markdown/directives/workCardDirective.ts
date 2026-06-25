import type { ParsedDirective } from '../directiveTypes'
import { attrsToHtml, escapeHtml } from '../directiveHtml'

function renderInvalidDirective(name: string, reason: string): string {
  return `<div class="vt-directive-error" data-directive="${escapeHtml(name)}" data-reason="${escapeHtml(reason)}">Invalid ${escapeHtml(name)} directive: ${escapeHtml(reason)}</div>`
}

function stringAttr(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function renderWorkCardDirective(directive: ParsedDirective): string {
  const attrs = { ...directive.attrs }

  const legacyId = typeof attrs.id === 'string' ? attrs.id.trim() : ''
  const explicitSlug = typeof attrs.slug === 'string' ? attrs.slug.trim() : ''
  const normalizedSlug = explicitSlug || legacyId

  if (normalizedSlug) attrs.slug = normalizedSlug
  if (typeof attrs.summary === 'string' && attrs.summary.trim() && typeof attrs.description !== 'string') {
    attrs.description = attrs.summary
  }

  const hasSlug = typeof attrs.slug === 'string' && attrs.slug.length > 0
  const hasManualTitle = typeof attrs.title === 'string' && attrs.title.length > 0

  if (!hasSlug && !hasManualTitle) {
    return renderInvalidDirective('work-card', 'missing_slug_or_title')
  }

  return `<work-card ${attrsToHtml(attrs)}></work-card>`
}
