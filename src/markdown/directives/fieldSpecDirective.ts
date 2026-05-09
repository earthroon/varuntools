import MarkdownIt from 'markdown-it'
import type { DirectiveFieldValue, ParsedDirective } from '../directiveTypes'
import { attrValue, escapeHtml, renderInvalidDirective } from '../directiveHtml'
import { isCaptionTag, type CaptionTag } from '../captionTag'

const bodyRenderer = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

function stringField(value: DirectiveFieldValue | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function boolField(value: DirectiveFieldValue | undefined): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return undefined
}

function readTag(attrs: Record<string, DirectiveFieldValue>): CaptionTag {
  const explicitTag = stringField(attrs.tag)
  const legacyBadge = stringField(attrs.badge)
  const requestedTag = explicitTag || legacyBadge

  if (requestedTag) {
    if (!isCaptionTag(requestedTag)) {
      throw new Error(`invalid_tag:${requestedTag}`)
    }
    return requestedTag
  }

  const required = boolField(attrs.required)
  if (required === true) return '필수'
  if (required === false) return '선택'
  return '기타'
}

function dataAttr(name: string, value: string | boolean): string {
  return `data-${name}="${attrValue(value)}"`
}

function renderMetaRow(label: string, value: string): string {
  if (!value) return ''
  return `<div class="vt-field-spec__meta-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
}

export function renderFieldSpecDirective(directive: ParsedDirective): string {
  const attrs = directive.attrs
  const name = stringField(attrs.name)

  if (!name) return renderInvalidDirective('field-spec', 'missing_name')

  let tag: CaptionTag
  try {
    tag = readTag(attrs)
  } catch (error) {
    return renderInvalidDirective('field-spec', error instanceof Error ? error.message : 'invalid_tag')
  }

  const required = boolField(attrs.required)
  const type = stringField(attrs.type)
  const defaultValue = stringField(attrs.default)
  const ssot = stringField(attrs.ssot)
  const usedBy = stringField(attrs.usedBy) || stringField(attrs.usedby)
  const note = stringField(attrs.note)
  const body = directive.body.trim()
  const html = body ? bodyRenderer.render(body) : ''
  const requiredValue = required === undefined ? '' : String(required)
  const htmlAttrs = [
    dataAttr('tag', tag),
    requiredValue ? dataAttr('required', requiredValue) : '',
  ]
    .filter(Boolean)
    .join(' ')

  const metaRows = [
    renderMetaRow('type', type),
    renderMetaRow('default', defaultValue),
    renderMetaRow('SSOT', ssot),
    renderMetaRow('used by', usedBy),
    renderMetaRow('note', note),
  ]
    .filter(Boolean)
    .join('')

  return [
    `<section class="vt-field-spec" ${htmlAttrs}>`,
    '<header class="vt-field-spec__header">',
    `<code class="vt-field-spec__name">${escapeHtml(name)}</code>`,
    `<span class="vt-field-spec__tag" data-type="${attrValue(tag)}">${escapeHtml(tag)}</span>`,
    '</header>',
    metaRows ? `<dl class="vt-field-spec__meta">${metaRows}</dl>` : '',
    html ? `<div class="vt-field-spec__body">${html}</div>` : '',
    '</section>',
  ].filter(Boolean).join('')
}
