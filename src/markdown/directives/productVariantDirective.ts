import type { ParsedDirective } from '../directiveTypes'

function attr(value: unknown): string {
  return String(value ?? '').replace(/"/g, '&quot;')
}

export function renderProductVariantDirective(directive: ParsedDirective): string {
  const title = attr(directive.attrs.title || 'Choose a license option')
  const showPrice = directive.attrs.showPrice === false ? 'false' : 'true'
  return `<product-variant-selector data-title="${title}" data-show-price="${showPrice}"></product-variant-selector>`
}
