export type PageTheme = 'default' | 'showroom'

export type PageLayout = 'default' | 'wide' | 'tool'

export type PageKind = 'page' | 'work' | 'tool' | 'lab' | 'doc' | 'product'

export type PageStatus = 'draft' | 'active' | 'archived'

export type PageVisibility = 'public' | 'hidden'

export type RobotsDirective =
  | 'index,follow'
  | 'noindex,nofollow'
  | 'noindex,follow'

export type ProductCheckoutProvider =
  | 'toss-payments'
  | 'external'
  | 'manual'
  | 'none'
  | string

export type ProductCheckoutMode =
  | 'toss-ready'
  | 'external-checkout'
  | 'manual-inquiry'
  | 'disabled'
  | string

export type ProductVariantPublicFrontmatter = {
  id?: string
  label: string
  status?: string
  licenseScope?: string
  price?: number | string
  currency?: string
  checkoutMode?: string
  checkoutUrl?: string
  default?: boolean
  note?: string
}


export type ProductFrontmatter = {
  type?: 'physical' | 'digital' | 'service' | 'bundle' | 'external' | string
  status?: 'draft' | 'coming-soon' | 'available' | 'sold-out' | 'hidden' | string
  sku?: string
  price?: number | string
  currency?: string
  priceVisible?: boolean
  stock?: string | number
  checkoutProvider?: ProductCheckoutProvider
  checkoutMode?: ProductCheckoutMode
  checkoutUrl?: string
  successUrl?: string
  failUrl?: string
  claimRedirect?: string
  externalStoreUrl?: string
  externalUrl?: string
  category?: string
  subcategory?: string
  series?: string
  collection?: string
  material?: string
  size?: string
  releaseDate?: string
  downloadProvider?: 'cloudflare' | 'external' | 'manual' | string
  downloadUrl?: string
  shippingRequired?: boolean
  showWhenUnavailable?: boolean
  policyNote?: string
  shippingNote?: string
  refundNote?: string
  digitalDeliveryNote?: string
  inquiryUrl?: string
  license?: string
  usageScope?: string
  updatePolicy?: string
  deliveryEstimate?: string
  caution?: string
  specs?: Array<{ label: string; value?: string | number; note?: string }>
  hasVariants?: boolean
  defaultVariantId?: string
  variants?: ProductVariantPublicFrontmatter[]
  includedItems?: Array<{ label: string; quantity?: string | number; note?: string }>
  compatibility?: string[]
  requirements?: string[]
  delivery?: {
    method?: string
    estimate?: string
    format?: string
    provider?: string
    mode?: string
    access?: string
    workerIntegration?: string
    note?: string
    r2?: { bucketBinding?: string; keyPrefix?: string }
    deliverables?: Array<{ id?: string; label?: string; type?: string; format?: string; r2Key?: string; fileName?: string; size?: string; checksum?: string }>
  }
}


export type PortfolioWorkFrontmatter = {
  type?: 'case-study' | 'tool' | 'visual' | 'service' | 'experiment' | 'store' | 'system' | string
  status?: 'draft' | 'published' | 'archived' | 'private' | string
  featured?: boolean
  weight?: number
  period?: string
  year?: number
  client?: string
  role?: string[] | string
  stack?: string[] | string
  tools?: string[] | string
  tags?: string[] | string
  category?: string
  summary?: string
  mood?: {
    tone?: string
    density?: string
    color?: string
  }
  links?: {
    demo?: string
    repo?: string
    caseStudy?: string
  }
}

export type MarkdownFrontmatter = {
  title: string
  slug: string
  layout?: PageLayout
  theme?: PageTheme
  description?: string
  cover?: string
  thumbnail?: string
  featured?: boolean
  order?: number
  tags?: string[]

  kind?: PageKind
  status?: PageStatus
  summary?: string
  cardTitle?: string
  cardDescription?: string
  cardCover?: string
  cardIcon?: string

  date?: string
  updated?: string
  role?: string
  client?: string
  externalUrl?: string
  license?: string
  collection?: string
  material?: string
  size?: string
  releaseDate?: string
  series?: string
  related?: string[]
  visibility?: PageVisibility

  seoTitle?: string
  seoDescription?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  canonical?: string
  robots?: RobotsDirective
  noindex?: boolean
  draft?: boolean
  product?: ProductFrontmatter
  gallery?: {
    autoMini?: boolean
  }
  work?: PortfolioWorkFrontmatter
}
