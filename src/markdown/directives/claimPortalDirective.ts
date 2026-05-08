import type { DirectiveFieldValue, ParsedDirective } from '../directiveTypes'
import { attrValue } from '../directiveHtml'
function normalizeBoolean(value: DirectiveFieldValue | undefined, fallback: boolean): boolean { if (typeof value === 'boolean') return value; if (typeof value === 'string') { if (value === 'true') return true; if (value === 'false') return false } return fallback }
function normalizeString(value: DirectiveFieldValue | undefined): string { return typeof value === 'string' ? value.trim() : '' }
export function renderClaimPortalDirective(directive: ParsedDirective): string {
  const attrs = { ...directive.attrs }
  const htmlAttrs = ['data-vt-component="claim-portal"', normalizeString(attrs.title) ? `data-title="${attrValue(normalizeString(attrs.title))}"` : '', normalizeString(attrs.intro) ? `data-intro="${attrValue(normalizeString(attrs.intro))}"` : '', `data-require-claim-token="${attrValue(normalizeBoolean(attrs.requireClaimToken, true))}"`, `data-require-email="${attrValue(normalizeBoolean(attrs.requireEmail, false))}"`, `data-require-order-id="${attrValue(normalizeBoolean(attrs.requireOrderId, false))}"`, normalizeString(attrs.submitLabel) ? `data-submit-label="${attrValue(normalizeString(attrs.submitLabel))}"` : ''].filter(Boolean).join(' ')
  return `<claim-portal ${htmlAttrs}></claim-portal>`
}
