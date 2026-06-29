import type { ParsedDirective } from '../directiveTypes'
import { attrsToHtml, renderInvalidDirective } from '../directiveHtml'

function isTruthyAttr(value: unknown): boolean {
  if (value === true) return true
  if (typeof value !== 'string') return false

  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function isBlankString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length === 0
}

function isGhostPoster(value: unknown): boolean {
  if (typeof value !== 'string') return false

  const normalized = value.trim().toLowerCase()
  return (
    normalized === '/media/example-poster.jpg' ||
    normalized === '/media/example-poster' ||
    normalized.endsWith('/media/example-poster.jpg') ||
    normalized.endsWith('/example-poster.jpg')
  )
}

function sanitizeVideoAttrs(attrs: ParsedDirective['attrs']): ParsedDirective['attrs'] {
  const next = { ...attrs }

  if (isBlankString(next.poster) || isGhostPoster(next.poster)) {
    delete next.poster
  }

  const wantsAutoplay = isTruthyAttr(next.autoplay)
  const allowsAutoplay = isTruthyAttr(next.muted)

  if (wantsAutoplay && !allowsAutoplay) {
    next.autoplay = 'false'
  }

  return next
}

export function renderVideoPlayerDirective(directive: ParsedDirective): string {
  const { attrs } = directive
  const hasSrc = typeof attrs.src === 'string' && attrs.src.trim().length > 0
  const hasStream = typeof attrs.stream === 'string' && attrs.stream.trim().length > 0

  if (!hasSrc && !hasStream) {
    return renderInvalidDirective(directive.rawName || 'video-player', 'missing_src_or_stream')
  }

  const safeAttrs = sanitizeVideoAttrs(attrs)

  return `<video-player ${attrsToHtml(safeAttrs)}></video-player>`
}
