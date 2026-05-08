import type { DirectiveFieldValue, ParsedDirective } from '../directiveTypes'
import { attrValue } from '../directiveHtml'

function normalizeBoolean(value: DirectiveFieldValue | undefined, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return fallback
}

function normalizeString(value: DirectiveFieldValue | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function renderInquiryFormDirective(directive: ParsedDirective): string {
  const attrs = { ...directive.attrs }
  const htmlAttrs = [
    'data-vt-component="inquiry-form"',
    normalizeString(attrs.title) ? `data-title="${attrValue(normalizeString(attrs.title))}"` : '',
    normalizeString(attrs.intro) ? `data-intro="${attrValue(normalizeString(attrs.intro))}"` : '',
    `data-require-nickname="${attrValue(normalizeBoolean(attrs.requireNickname, true))}"`,
    `data-require-gate-code="${attrValue(normalizeBoolean(attrs.requireGateCode, true))}"`,
    `data-require-email="${attrValue(normalizeBoolean(attrs.requireEmail, false))}"`,
    normalizeString(attrs.submitLabel) ? `data-submit-label="${attrValue(normalizeString(attrs.submitLabel))}"` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return `<inquiry-form ${htmlAttrs}></inquiry-form>`
}
