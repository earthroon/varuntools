import type { ParsedDirective } from '../directiveTypes'
import { attrsToHtml, renderInvalidDirective } from '../directiveHtml'

export function renderImageCardDirective(directive: ParsedDirective): string {
  const { attrs } = directive

  if (!attrs.src || typeof attrs.src !== 'string') {
    return renderInvalidDirective('image-card', 'missing_src')
  }

  return `<image-card ${attrsToHtml(attrs)}></image-card>`
}
