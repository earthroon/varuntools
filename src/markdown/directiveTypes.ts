export type DirectiveName =
  | 'video'
  | 'video-player'
  | 'before-after'
  | 'image-card'
  | 'captioned-image'
  | 'note'
  | 'warning'
  | 'tip'
  | 'section-gap'
  | 'section-break'
  | 'featured-works'
  | 'work-card'
  | 'pagecard-grid'
  | 'pagecard'
  | 'markdown-box'
  | 'gallery-strip'
  | 'home-section'
  | 'product-cta'
  | 'product-trust'
  | 'product-specs'
  | 'product-catalog'
  | 'product-variants'
  | 'store-nav'
  | 'inquiry-form'
  | 'claim-portal'
  | 'portfolio-hero'
  | 'work-summary'
  | 'role-stack'
  | 'case-section'
  | 'metric-card'
  | 'tool-stack'
  | 'quote-block'
  | 'case-gallery'
  | 'case-gallery-item'
  | 'related-works'
  | 'editorial-title'
  | 'editorial-columns'
  | 'field-spec'
  | 'demo-frame'
  | 'image-sequence'

export type DirectiveFieldValue = string | boolean | number

export type ParsedDirective = {
  name: DirectiveName
  rawName: string
  attrs: Record<string, DirectiveFieldValue>
  body: string
  raw: string
}

export type DirectiveParseResult =
  | {
      ok: true
      directive: ParsedDirective
    }
  | {
      ok: false
      reason: string
      raw: string
    }

export const KNOWN_DIRECTIVES: readonly DirectiveName[] = [
  'video',
  'video-player',
  'before-after',
  'image-card',
  'captioned-image',
  'note',
  'warning',
  'tip',
  'section-gap',
  'section-break',
  'featured-works',
  'work-card',
  'pagecard-grid',
  'pagecard',
  'markdown-box',
  'gallery-strip',
  'home-section',
  'product-cta',
  'product-trust',
  'product-specs',
  'product-catalog',
  'product-variants',
  'store-nav',
  'inquiry-form',
  'claim-portal',
  'portfolio-hero',
  'work-summary',
  'role-stack',
  'case-section',
  'metric-card',
  'tool-stack',
  'quote-block',
  'case-gallery',
  'case-gallery-item',
  'related-works',
  'editorial-title',
  'editorial-columns',
  'field-spec',
  'demo-frame',
  'image-sequence',
]
