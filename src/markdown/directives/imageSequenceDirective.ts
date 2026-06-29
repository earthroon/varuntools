import type { DirectiveFieldValue, ParsedDirective } from '../directiveTypes'
import { attrsToHtml, escapeHtml, renderInvalidDirective } from '../directiveHtml'

export type ImageSequenceDirectiveItem = {
  assetId?: string
  src: string
  alt: string
  caption?: string
  width?: number
  height?: number
  filename?: string
  mimeType?: string
}

const IMAGE_SEQUENCE_LAYOUTS = new Set(['crop-strip'])
const IMAGE_SEQUENCE_ITEM_KEYS = new Set(['assetId', 'src', 'alt', 'caption', 'width', 'height', 'filename', 'mimeType'])

function normalizeLine(value: string): string {
  return String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function sanitizeText(value: unknown): string {
  return normalizeLine(String(value ?? '')).replace(/\n/g, ' ').trim()
}

function optionalText(value: unknown): string | undefined {
  const clean = sanitizeText(value)
  return clean || undefined
}

function normalizePositiveInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  const rounded = Math.floor(parsed)
  return rounded > 0 ? rounded : undefined
}

function normalizeBooleanAttr(value: unknown, fallback: boolean): boolean | null {
  if (value === undefined || value === null || value === '') return fallback
  if (typeof value === 'boolean') return value

  const clean = sanitizeText(value).toLowerCase()
  if (clean === 'true' || clean === '1' || clean === 'yes') return true
  if (clean === 'false' || clean === '0' || clean === 'no') return false

  return null
}

function normalizeLayout(value: unknown): 'crop-strip' | null {
  const clean = sanitizeText(value || 'crop-strip')
  return IMAGE_SEQUENCE_LAYOUTS.has(clean) ? 'crop-strip' : null
}

function parseItemAttrs(chunk: string): Record<string, string> {
  const attrs: Record<string, string> = {}

  for (const line of normalizeLine(chunk).split('\n')) {
    const match = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/u)
    if (!match) continue

    const key = match[1]
    if (!IMAGE_SEQUENCE_ITEM_KEYS.has(key)) continue

    attrs[key] = match[2] ?? ''
  }

  return attrs
}

function parseImageSequenceItems(body: string): { items: ImageSequenceDirectiveItem[]; errors: string[] } {
  const items: ImageSequenceDirectiveItem[] = []
  const errors: string[] = []

  const chunks = normalizeLine(body)
    .split(/^---\s*$/mu)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  for (const chunk of chunks) {
    const attrs = parseItemAttrs(chunk)
    if (!Object.keys(attrs).length) continue

    const item: ImageSequenceDirectiveItem = {
      assetId: optionalText(attrs.assetId),
      src: sanitizeText(attrs.src),
      alt: sanitizeText(attrs.alt),
      caption: optionalText(attrs.caption),
      width: normalizePositiveInteger(attrs.width),
      height: normalizePositiveInteger(attrs.height),
      filename: optionalText(attrs.filename),
      mimeType: optionalText(attrs.mimeType),
    }

    if (!item.src) errors.push('missing_item_src')
    if (!item.alt) errors.push('missing_item_alt')
    if (attrs.width !== undefined && item.width === undefined) errors.push('invalid_item_width')
    if (attrs.height !== undefined && item.height === undefined) errors.push('invalid_item_height')

    items.push(item)
  }

  return { items, errors: Array.from(new Set(errors)) }
}

export function renderImageSequenceDirective(directive: ParsedDirective): string {
  const layout = normalizeLayout(directive.attrs.layout)
  if (!layout) return renderInvalidDirective('image-sequence', 'invalid_layout')

  const reserved = normalizeBooleanAttr(directive.attrs.reserved, true)
  if (reserved === null) return renderInvalidDirective('image-sequence', 'invalid_reserved')

  const lazy = normalizeBooleanAttr(directive.attrs.lazy, true)
  if (lazy === null) return renderInvalidDirective('image-sequence', 'invalid_lazy')

  const fade = normalizeBooleanAttr(directive.attrs.fade, true)
  if (fade === null) return renderInvalidDirective('image-sequence', 'invalid_fade')

  const width = normalizePositiveInteger(directive.attrs.width)
  if (directive.attrs.width !== undefined && width === undefined) return renderInvalidDirective('image-sequence', 'invalid_width')

  const height = normalizePositiveInteger(directive.attrs.height)
  if (directive.attrs.height !== undefined && height === undefined) return renderInvalidDirective('image-sequence', 'invalid_height')

  const parsed = parseImageSequenceItems(directive.body)
  if (!parsed.items.length) return renderInvalidDirective('image-sequence', 'missing_items')
  if (parsed.errors.length) return renderInvalidDirective('image-sequence', parsed.errors[0])

  const htmlAttrs: Record<string, DirectiveFieldValue> = {
    layout,
    reserved,
    lazy,
    fade,
  }

  if (width !== undefined) htmlAttrs.width = width
  if (height !== undefined) htmlAttrs.height = height

  const items = parsed.items.map((item) => ({
    assetId: item.assetId,
    src: item.src,
    alt: item.alt,
    caption: item.caption,
    width: item.width,
    height: item.height,
    filename: item.filename,
    mimeType: item.mimeType,
  }))

  return '<image-sequence ' + attrsToHtml(htmlAttrs) + '><template data-image-sequence-items>' + escapeHtml(JSON.stringify(items)) + '</template></image-sequence>'
}

