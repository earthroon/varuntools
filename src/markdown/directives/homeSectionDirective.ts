import type { DirectiveFieldValue, ParsedDirective } from '../directiveTypes'
import { attrValue, attrsToHtml, renderInvalidDirective } from '../directiveHtml'

const VALID_SOURCES = new Set(['products', 'works', 'tools', 'lab', 'post', 'page', 'case-study', 'all'])
const VALID_LAYOUTS = new Set(['product-grid', 'card-grid', 'compact-list'])
const VALID_EMPTY_MODES = new Set(['notice', 'hide'])

function normalizeBoolean(value: DirectiveFieldValue | undefined): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return undefined
}

function normalizeLimit(value: DirectiveFieldValue | undefined): number | undefined {
  if (value === undefined || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  return Math.max(1, Math.min(24, Math.floor(parsed)))
}

function normalizeTags(value: DirectiveFieldValue | undefined): string {
  if (typeof value !== 'string') return ''
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(',')
}

function normalizeString(value: DirectiveFieldValue | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function renderHomeSectionDirective(directive: ParsedDirective): string {
  const attrs = { ...directive.attrs }
  const source = typeof attrs.source === 'string' && VALID_SOURCES.has(attrs.source) ? attrs.source : ''
  const title = typeof attrs.title === 'string' ? attrs.title.trim() : ''

  if (!source) return renderInvalidDirective('home-section', 'invalid_source')
  if (!title) return renderInvalidDirective('home-section', 'missing_title')

  const featured = normalizeBoolean(attrs.featured)
  const showUnavailable = normalizeBoolean(attrs.showUnavailable)
  const limit = normalizeLimit(attrs.limit)
  const layout = typeof attrs.layout === 'string' && VALID_LAYOUTS.has(attrs.layout) ? attrs.layout : 'card-grid'
  const tags = normalizeTags(attrs.tags)
  const emptyMode = typeof attrs.emptyMode === 'string' && VALID_EMPTY_MODES.has(attrs.emptyMode) ? attrs.emptyMode : 'notice'
  const emptyTitle = normalizeString(attrs.emptyTitle)
  const emptyBody = normalizeString(attrs.emptyBody)
  const emptyHref = normalizeString(attrs.emptyHref)
  const emptyLabel = normalizeString(attrs.emptyLabel)

  const htmlAttrs = [
    attrsToHtml({ title, source, layout }),
    featured !== undefined ? `data-featured="${attrValue(featured)}"` : '',
    showUnavailable !== undefined ? `data-show-unavailable="${attrValue(showUnavailable)}"` : '',
    limit !== undefined ? `data-limit="${attrValue(limit)}"` : '',
    typeof attrs.status === 'string' ? `data-status="${attrValue(attrs.status)}"` : '',
    tags ? `data-tags="${attrValue(tags)}"` : '',
    `data-empty-mode="${attrValue(emptyMode)}"`,
    emptyTitle ? `data-empty-title="${attrValue(emptyTitle)}"` : '',
    emptyBody ? `data-empty-body="${attrValue(emptyBody)}"` : '',
    emptyHref ? `data-empty-href="${attrValue(emptyHref)}"` : '',
    emptyLabel ? `data-empty-label="${attrValue(emptyLabel)}"` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return `<home-section ${htmlAttrs}></home-section>`
}

