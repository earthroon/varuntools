import type { DirectiveFieldValue } from './directiveTypes'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function attrValue(value: DirectiveFieldValue): string {
  return escapeHtml(String(value))
}

export function normalizeDataAttrName(key: string): string {
  return key
    .trim()
    .replace(/_/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .toLowerCase()
}

export function attrsToHtml(attrs: Record<string, DirectiveFieldValue>): string {
  return Object.entries(attrs)
    .map(([key, value]) => {
      const safeKey = normalizeDataAttrName(key)
      if (!safeKey) return ''
      return `data-${safeKey}="${attrValue(value)}"`
    })
    .filter(Boolean)
    .join(' ')
}

export function renderInvalidDirective(name: string, reason: string): string {
  return `<div class="vt-directive-error" data-directive="${escapeHtml(name)}" data-reason="${escapeHtml(reason)}">Invalid ${escapeHtml(name)} directive: ${escapeHtml(reason)}</div>`
}

export function renderRawDirective(raw: string, reason: string): string {
  return `<pre class="vt-directive-raw" data-reason="${escapeHtml(reason)}"><code>${escapeHtml(raw)}</code></pre>`
}

export function escapedBodyToHtml(body: string): string {
  return escapeHtml(body).replace(/\n/g, '<br>')
}
