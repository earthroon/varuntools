import type { ParsedDirective } from '../directiveTypes'
import {
  attrsToHtml,
  escapedBodyToHtml,
  renderInvalidDirective,
} from '../directiveHtml'

export function renderCalloutDirective(directive: ParsedDirective): string {
  const { name, attrs, body } = directive
  const hasTitle = typeof attrs.title === 'string' && attrs.title.trim().length > 0
  const hasBody = body.trim().length > 0

  if (!hasTitle && !hasBody) {
    return renderInvalidDirective(name, 'missing_body_or_title')
  }

  return `<callout-box data-type="${name}" ${attrsToHtml(attrs)}>${escapedBodyToHtml(body)}</callout-box>`
}
