import type { ParsedDirective } from '../directiveTypes'
import { renderBeforeAfterDirective } from './beforeAfterDirective'
import { renderCalloutDirective } from './calloutDirective'
import { renderCaptionedImageDirective } from './captionedImageDirective'
import { renderFeaturedWorksDirective } from './featuredWorksDirective'
import { renderImageCardDirective } from './imageCardDirective'
import { renderSectionBreakDirective } from './sectionBreakDirective'
import { renderSectionGapDirective } from './sectionGapDirective'
import { renderVideoDirective } from './videoDirective'
import { renderVideoPlayerDirective } from './videoPlayerDirective'
import { renderWorkCardDirective } from './workCardDirective'
import { renderPagecardGridDirective } from './pagecardGridDirective'
import { renderPagecardDirective } from './pagecardDirective'
import { renderMarkdownBoxDirective } from './markdownBoxDirective'
import { renderFieldSpecDirective } from './fieldSpecDirective'
import { renderDemoFrameDirective } from './demoFrameDirective'
import { renderGalleryStripDirective } from './galleryStripDirective'
import { renderHomeSectionDirective } from './homeSectionDirective'
import { renderProductCtaDirective } from './productCtaDirective'
import { renderProductTrustDirective } from './productTrustDirective'
import { renderProductSpecsDirective } from './productSpecsDirective'
import { renderProductCatalogDirective } from './productCatalogDirective'
import { renderProductVariantDirective } from './productVariantDirective'
import { renderStoreNavigationDirective } from './storeNavigationDirective'
import { renderInquiryFormDirective } from './inquiryFormDirective'
import { renderClaimPortalDirective } from './claimPortalDirective'
import {
  renderCaseGalleryDirective,
  renderEditorialColumnsDirective,
  renderEditorialTitleDirective,
  renderCaseGalleryItemDirective,
  renderCaseSectionDirective,
  renderMetricCardDirective,
  renderPortfolioHeroDirective,
  renderQuoteBlockDirective,
  renderRelatedWorksDirective,
  renderRoleStackDirective,
  renderToolStackDirective,
  renderWorkSummaryDirective,
} from './portfolioDirective'

export function renderDirective(directive: ParsedDirective): string {
  switch (directive.name) {
    case 'video':
      return renderVideoDirective(directive)

    case 'video-player':
      return renderVideoPlayerDirective(directive)

    case 'before-after':
      return renderBeforeAfterDirective(directive)

    case 'image-card':
      return renderImageCardDirective(directive)

    case 'captioned-image':
      return renderCaptionedImageDirective(directive)

    case 'note':
    case 'warning':
    case 'tip':
      return renderCalloutDirective(directive)

    case 'section-gap':
      return renderSectionGapDirective(directive)

    case 'section-break':
      return renderSectionBreakDirective(directive)

    case 'featured-works':
      return renderFeaturedWorksDirective(directive)

    case 'work-card':
      return renderWorkCardDirective(directive)

    case 'pagecard-grid':
      return renderPagecardGridDirective(directive)

    case 'pagecard':
      return renderPagecardDirective(directive)

    case 'markdown-box':
      return renderMarkdownBoxDirective(directive)

    case 'gallery-strip':
      return renderGalleryStripDirective(directive)

    case 'home-section':
      return renderHomeSectionDirective(directive)

    case 'product-cta':
      return renderProductCtaDirective(directive)

    case 'product-trust':
      return renderProductTrustDirective(directive)

    case 'product-specs':
      return renderProductSpecsDirective(directive)

    case 'product-catalog':
      return renderProductCatalogDirective(directive)

    case 'product-variants':
      return renderProductVariantDirective(directive)

    case 'store-nav':
      return renderStoreNavigationDirective(directive)

    case 'inquiry-form':
      return renderInquiryFormDirective(directive)

    case 'claim-portal':
      return renderClaimPortalDirective(directive)

    case 'portfolio-hero':
      return renderPortfolioHeroDirective(directive)

    case 'work-summary':
      return renderWorkSummaryDirective(directive)

    case 'role-stack':
      return renderRoleStackDirective(directive)

    case 'case-section':
      return renderCaseSectionDirective(directive)

    case 'metric-card':
      return renderMetricCardDirective(directive)

    case 'tool-stack':
      return renderToolStackDirective(directive)

    case 'quote-block':
      return renderQuoteBlockDirective(directive)

    case 'case-gallery':
      return renderCaseGalleryDirective(directive)

    case 'case-gallery-item':
      return renderCaseGalleryItemDirective(directive)

    case 'related-works':
      return renderRelatedWorksDirective(directive)

    case 'editorial-title':
      return renderEditorialTitleDirective(directive)

    case 'editorial-columns':
      return renderEditorialColumnsDirective(directive)

    case 'field-spec':
      return renderFieldSpecDirective(directive)

    case 'demo-frame':
      return renderDemoFrameDirective(directive)

    default:
      return directive.raw
  }
}
