import type { ParsedDirective } from '../directiveTypes'
import { attrsToHtml, renderInvalidDirective } from '../directiveHtml'
import { isCaptionTag, parseCaptionTag } from '../captionTag'

export function renderCaptionedImageDirective(directive: ParsedDirective): string {
  const attrs = { ...directive.attrs }

  if (!attrs.src || typeof attrs.src !== 'string') {
    return renderInvalidDirective('captioned-image', 'missing_src')
  }

  if (attrs.lightbox !== undefined && typeof attrs.lightbox !== 'boolean') {
    return renderInvalidDirective('captioned-image', 'invalid_lightbox')
  }

  if (attrs.tag !== undefined && typeof attrs.tag !== 'string') {
    return renderInvalidDirective('captioned-image', 'invalid_tag')
  }

  if (attrs.tag && typeof attrs.tag === 'string' && !isCaptionTag(attrs.tag)) {
    return renderInvalidDirective('captioned-image', `unknown_tag:${attrs.tag}`)
  }

  if (attrs.caption !== undefined && typeof attrs.caption !== 'string') {
    return renderInvalidDirective('captioned-image', 'invalid_caption')
  }

  if (typeof attrs.caption === 'string') {
    const parsed = parseCaptionTag(attrs.caption)
    attrs.caption = parsed.caption
    if (!attrs.tag && parsed.tag) attrs.tag = parsed.tag
  }

  if (attrs.lightbox === undefined) {
    attrs.lightbox = true
  }

  return `<captioned-image ${attrsToHtml(attrs)}></captioned-image>`
}
