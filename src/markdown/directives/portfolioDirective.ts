import MarkdownIt from 'markdown-it'
import type { ParsedDirective } from '../directiveTypes'
import { attrsToHtml, escapeHtml, renderInvalidDirective } from '../directiveHtml'
import { parseGalleryStripItems } from '../galleryStripItems'

const bodyRenderer = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

function stringField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value === undefined || value === null ? '' : String(value).trim()
}

function templateHtml(name: string, directive: ParsedDirective, templateName = 'data-portfolio-html'): string {
  const html = directive.body.trim() ? bodyRenderer.render(directive.body.trim()) : ''
  return `<${name} ${attrsToHtml(directive.attrs)}><template ${templateName}>${html}</template></${name}>`
}


function normalizeHeadingLevel(value: string): 'major' | 'middle' | 'minor' {
  return value === 'major' || value === 'minor' ? value : 'middle'
}

function normalizeHeadingTag(value: string, level: 'major' | 'middle' | 'minor'): 'h1' | 'h2' | 'h3' | 'h4' {
  if (value === 'h1' || value === 'h2' || value === 'h3' || value === 'h4') return value
  if (level === 'major') return 'h2'
  if (level === 'minor') return 'h4'
  return 'h3'
}

function normalizeHeadingAlign(value: string): 'left' | 'center' {
  return value === 'center' ? 'center' : 'left'
}

function normalizeColumnCount(value: string): 2 | 3 {
  return value === '3' ? 3 : 2
}

function normalizeColumnGap(value: string): 'sm' | 'md' | 'lg' {
  return value === 'sm' || value === 'lg' ? value : 'md'
}

function normalizeColumnCollapse(value: string): 'mobile' | 'tablet' | 'never' {
  return value === 'tablet' || value === 'never' ? value : 'mobile'
}

function splitEditorialColumns(body: string): string[] {
  const normalized = body.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const canonical = normalized
    .split(/^---\s*$/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  if (canonical.length >= 2) return canonical

  const legacy: string[] = []
  let current: string[] = []

  for (const line of normalized.split('\n')) {
    if (/^###\s+/.test(line) && current.some((item) => item.trim())) {
      legacy.push(current.join('\n').trim())
      current = []
    }

    current.push(line)
  }

  if (current.some((item) => item.trim())) legacy.push(current.join('\n').trim())

  return legacy.length >= 2 ? legacy : canonical
}

export function renderEditorialTitleDirective(directive: ParsedDirective): string {
  const title = stringField(directive.attrs.title)
  if (!title) return renderInvalidDirective('editorial-title', 'missing_title')

  const level = normalizeHeadingLevel(stringField(directive.attrs.level))
  const attrs = {
    ...directive.attrs,
    level,
    as: normalizeHeadingTag(stringField(directive.attrs.as), level),
    align: normalizeHeadingAlign(stringField(directive.attrs.align)),
  }

  return `<editorial-title ${attrsToHtml(attrs)}></editorial-title>`
}

export function renderEditorialColumnsDirective(directive: ParsedDirective): string {
  const cols = normalizeColumnCount(stringField(directive.attrs.cols || directive.attrs.columns))
  const chunks = splitEditorialColumns(directive.body)
  if (chunks.length < 2) return renderInvalidDirective('editorial-columns', 'missing_columns')
  if (chunks.length > cols) return renderInvalidDirective('editorial-columns', 'too_many_columns')

  const attrs = {
    ...directive.attrs,
    cols,
    gap: normalizeColumnGap(stringField(directive.attrs.gap)),
    collapse: normalizeColumnCollapse(stringField(directive.attrs.collapse)),
    balance: directive.attrs.balance === true || stringField(directive.attrs.balance) === 'true',
  }
  const templates = chunks
    .map((chunk) => `<template data-editorial-column-html>${bodyRenderer.render(chunk)}</template>`)
    .join('')

  return `<editorial-columns ${attrsToHtml(attrs)}>${templates}</editorial-columns>`
}

export function renderPortfolioHeroDirective(directive: ParsedDirective): string {
  const title = stringField(directive.attrs.title)
  if (!title && !directive.body.trim()) return renderInvalidDirective('portfolio-hero', 'missing_title_or_body')
  return templateHtml('portfolio-hero', directive)
}

function hasWorkSummaryAttrs(directive: ParsedDirective): boolean {
  return ['problem', 'solution', 'impact', 'summary'].some((key) => stringField(directive.attrs[key]))
}

export function renderWorkSummaryDirective(directive: ParsedDirective): string {
  if (!stringField(directive.attrs.title) && !directive.body.trim() && !hasWorkSummaryAttrs(directive)) return renderInvalidDirective('work-summary', 'missing_title_or_body')
  return templateHtml('work-summary', directive)
}

export function renderRoleStackDirective(directive: ParsedDirective): string {
  return templateHtml('role-stack', directive)
}

export function renderCaseSectionDirective(directive: ParsedDirective): string {
  const type = stringField(directive.attrs.type)
  if (!type) return renderInvalidDirective('case-section', 'missing_type')
  if (!directive.body.trim() && !stringField(directive.attrs.title)) return renderInvalidDirective('case-section', 'missing_body_or_title')
  return templateHtml('case-section', directive)
}

export function renderMetricCardDirective(directive: ParsedDirective): string {
  if (!stringField(directive.attrs.title) && !stringField(directive.attrs.value)) return renderInvalidDirective('metric-card', 'missing_title_or_value')
  return templateHtml('metric-card', directive)
}

export function renderToolStackDirective(directive: ParsedDirective): string {
  return templateHtml('tool-stack', directive)
}

export function renderQuoteBlockDirective(directive: ParsedDirective): string {
  if (!directive.body.trim()) return renderInvalidDirective('quote-block', 'missing_body')
  return templateHtml('quote-block', directive)
}

export function renderCaseGalleryDirective(directive: ParsedDirective): string {
  const items = parseGalleryStripItems(directive.body)
  if (!items.length) return renderInvalidDirective('case-gallery', 'missing_items')
  return `<case-gallery ${attrsToHtml(directive.attrs)}><template data-case-gallery-items>${escapeHtml(directive.body)}</template></case-gallery>`
}

export function renderCaseGalleryItemDirective(directive: ParsedDirective): string {
  const src = stringField(directive.attrs.src)
  if (!src) return renderInvalidDirective('case-gallery-item', 'missing_src')
  return `<case-gallery-item ${attrsToHtml(directive.attrs)}></case-gallery-item>`
}

export function renderRelatedWorksDirective(directive: ParsedDirective): string {
  return templateHtml('related-works', directive, 'data-related-works-body')
}
