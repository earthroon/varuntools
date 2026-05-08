import type { ParsedDirective } from '../directiveTypes'
import { attrsToHtml, escapeHtml, renderInvalidDirective } from '../directiveHtml'
import { parseGalleryStripItems } from '../galleryStripItems'

export function renderGalleryStripDirective(directive: ParsedDirective): string {
  const { attrs, body } = directive
  const items = parseGalleryStripItems(body)

  if (!items.length) {
    return renderInvalidDirective('gallery-strip', 'missing_items')
  }

  return `<gallery-strip ${attrsToHtml(attrs)}><template data-gallery-strip-items>${escapeHtml(body)}</template></gallery-strip>`
}
