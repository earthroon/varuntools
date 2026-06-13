import type { DirectiveFieldValue, ParsedDirective } from '../directiveTypes'
import { attrValue, renderInvalidDirective } from '../directiveHtml'

function text(value: DirectiveFieldValue | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function renderPagecardDirective(directive: ParsedDirective): string {
  const id = text(directive.attrs.id)
  const title = text(directive.attrs.title)
  if (!id) return renderInvalidDirective('pagecard', 'missing_id')
  if (!title) return renderInvalidDirective('pagecard', 'missing_title')

  const attrs = [
    `data-id="${attrValue(id)}"`,
    `data-title="${attrValue(title)}"`,
    text(directive.attrs.description) ? `data-description="${attrValue(text(directive.attrs.description))}"` : '',
    text(directive.attrs.href) ? `data-href="${attrValue(text(directive.attrs.href))}"` : '',
    text(directive.attrs.tag) ? `data-tag="${attrValue(text(directive.attrs.tag))}"` : '',
    text(directive.attrs.image) ? `data-image="${attrValue(text(directive.attrs.image))}"` : '',
    text(directive.attrs.imageAssetId) ? `data-image-asset-id="${attrValue(text(directive.attrs.imageAssetId))}"` : '',
    text(directive.attrs.alt) ? `data-alt="${attrValue(text(directive.attrs.alt))}"` : '',
  ].filter(Boolean).join(' ')

  return `<pagecard ${attrs}></pagecard>`
}
