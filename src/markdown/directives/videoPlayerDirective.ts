import type { ParsedDirective } from '../directiveTypes'
import { attrsToHtml, renderInvalidDirective } from '../directiveHtml'

export function renderVideoPlayerDirective(directive: ParsedDirective): string {
  const { attrs } = directive
  const hasSrc = typeof attrs.src === 'string' && attrs.src.trim().length > 0
  const hasStream = typeof attrs.stream === 'string' && attrs.stream.trim().length > 0

  if (!hasSrc && !hasStream) {
    return renderInvalidDirective(directive.rawName || 'video-player', 'missing_src_or_stream')
  }

  return `<video-player ${attrsToHtml(attrs)}></video-player>`
}
