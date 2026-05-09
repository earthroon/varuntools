import MarkdownIt from 'markdown-it'
import type { DirectiveFieldValue, ParsedDirective } from '../directiveTypes'
import { attrValue, renderInvalidDirective } from '../directiveHtml'

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
    const text = value.trim().toLowerCase()
    if (text === 'true') return true
    if (text === 'false') return false
  }
  return undefined
}

function numberField(value: DirectiveFieldValue | undefined): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const numeric = Number(value.trim())
    if (Number.isFinite(numeric)) return numeric
  }
  return undefined
}

function dataAttr(name: string, value: string | boolean | number | undefined): string {
  if (value === undefined || value === '') return ''
  return `data-${name}="${attrValue(value)}"`
}

export function renderDemoFrameDirective(directive: ParsedDirective): string {
  const attrs = directive.attrs
  const id = stringField(attrs.id)
  const src = stringField(attrs.src)

  if (!id && !src) {
    return renderInvalidDirective('demo-frame', 'missing_id_or_src')
  }

  const stackJson = stringField(attrs.stackJson) || stringField(attrs.stack)
  const allowFullscreen = boolField(attrs.allowFullscreen) ?? boolField(attrs.fullscreen)
  const autoResize = boolField(attrs.autoResize)
  const minHeight = numberField(attrs.minHeight)
  const maxHeight = numberField(attrs.maxHeight)
  const body = directive.body.trim()
  const html = body ? bodyRenderer.render(body) : ''

  const htmlAttrs = [
    dataAttr('id', id),
    dataAttr('src', src),
    dataAttr('title', stringField(attrs.title)),
    dataAttr('ratio', stringField(attrs.ratio)),
    dataAttr('status', stringField(attrs.status)),
    dataAttr('description', stringField(attrs.description)),
    dataAttr('stack-json', stackJson),
    dataAttr('sandbox', stringField(attrs.sandbox)),
    dataAttr('allow-fullscreen', allowFullscreen),
    dataAttr('auto-resize', autoResize),
    dataAttr('min-height', minHeight),
    dataAttr('max-height', maxHeight),
  ]
    .filter(Boolean)
    .join(' ')

  return `<demo-frame ${htmlAttrs}><template data-demo-frame-html>${html}</template></demo-frame>`
}
