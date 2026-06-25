import type { DirectiveFieldValue, ParsedDirective } from '../directiveTypes'
import { attrValue, renderInvalidDirective } from '../directiveHtml'

type PagecardItem = {
  href: string
  title?: string
  description?: string
  thumbnail?: string
  tag?: string
}

const VALID_COLUMNS = new Set(['auto', 'compact', 'wide'])
const VALID_SORT = new Set(['manual', 'title', 'order', 'date'])

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

function stripQuote(value: string): string {
  const trimmed = value.trim()
  const first = trimmed.charAt(0)
  const last = trimmed.charAt(trimmed.length - 1)
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function parseInlineObject(value: string): PagecardItem | null {
  const inner = value.trim().replace(/^\{/, '').replace(/\}$/, '').trim()
  if (!inner) return null

  const item: PagecardItem = { href: '' }
  for (const part of inner.split(',')) {
    const [rawKey, ...rest] = part.split(':')
    const key = rawKey?.trim()
    const val = stripQuote(rest.join(':'))
    if (!key || !val) continue
    if (key === 'href' || key === 'title' || key === 'description' || key === 'thumbnail' || key === 'tag') {
      item[key] = val
    }
  }

  return item.href ? item : null
}

function parseItemsFromBody(body: string): PagecardItem[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const items: PagecardItem[] = []
  let current: PagecardItem | null = null

  function commit() {
    if (current?.href) items.push(current)
    current = null
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line === 'items:') continue

    const bullet = line.match(/^-\s*(.*)$/)
    if (bullet) {
      commit()
      const value = bullet[1].trim()
      const inline = value.startsWith('{') ? parseInlineObject(value) : null
      if (inline) {
        current = inline
      } else if (/^href:/i.test(value)) {
        current = { href: stripQuote(value.replace(/^href:\s*/i, '')) }
      } else {
        current = { href: stripQuote(value) }
      }
      continue
    }

    const field = line.match(/^(href|title|description|thumbnail|tag):\s*(.*)$/)
    if (field && current) {
      const key = field[1] as keyof PagecardItem
      current[key] = stripQuote(field[2])
    }
  }

  commit()
  return items.filter((item) => item.href)
}

function normalizeLegacyHref(id: string, href: string): string {
  const explicitHref = stripQuote(href || '')
  if (explicitHref) return explicitHref

  const cleanId = stripQuote(id || '')
  if (!cleanId) return ''
  if (/^(https?:\/\/|\/)/.test(cleanId)) return cleanId

  return '/page/' + cleanId.replace(/^\/+/, '')
}

function parseLegacyPipeItem(value: string): PagecardItem | null {
  const [id = '', title = '', description = '', href = '', tag = ''] = value
    .split('|')
    .map((part) => stripQuote(part))

  const normalizedHref = normalizeLegacyHref(id, href)
  if (!normalizedHref) return null

  return {
    href: normalizedHref,
    title: title || undefined,
    description: description || undefined,
    tag: tag || undefined,
  }
}

function parseItemsAttr(value: DirectiveFieldValue | undefined): PagecardItem[] {
  if (typeof value !== 'string' || !value.trim()) return []

  return value
    .split(',')
    .map((raw) => {
      const item = raw.trim()
      if (!item) return null
      if (item.includes('|')) return parseLegacyPipeItem(item)
      return { href: stripQuote(item) }
    })
    .filter((item): item is PagecardItem => Boolean(item?.href))
}

function escapeJsonAttr(value: unknown): string {
  return attrValue(JSON.stringify(value))
}

export function renderPagecardGridDirective(directive: ParsedDirective): string {
  const attrs = { ...directive.attrs }
  const items = [
    ...parseItemsAttr(attrs.items),
    ...parseItemsFromBody(directive.body),
  ]

  const query = typeof attrs.query === 'string' ? attrs.query.trim() : ''
  const tag = typeof attrs.tag === 'string' ? attrs.tag.trim() : ''
  const section = typeof attrs.section === 'string' ? attrs.section.trim() : ''
  const featured = normalizeBoolean(attrs.featured)
  const hasSource = items.length > 0 || Boolean(query || tag || section || featured === true)

  if (!hasSource) {
    return renderInvalidDirective('pagecard-grid', 'missing_source')
  }

  const limit = normalizeLimit(attrs.limit)
  const sort = typeof attrs.sort === 'string' && VALID_SORT.has(attrs.sort) ? attrs.sort : 'manual'
  const columns = typeof attrs.columns === 'string' && VALID_COLUMNS.has(attrs.columns) ? attrs.columns : 'auto'

  const htmlAttrs = [
    `data-items="${escapeJsonAttr(items)}"`,
    query ? `data-query="${attrValue(query)}"` : '',
    tag ? `data-tag="${attrValue(tag)}"` : '',
    section ? `data-section="${attrValue(section)}"` : '',
    featured !== undefined ? `data-featured="${attrValue(featured)}"` : '',
    limit !== undefined ? `data-limit="${attrValue(limit)}"` : '',
    `data-sort="${attrValue(sort)}"`,
    `data-columns="${attrValue(columns)}"`,
  ]
    .filter(Boolean)
    .join(' ')

  return `<pagecard-grid ${htmlAttrs}></pagecard-grid>`
}
