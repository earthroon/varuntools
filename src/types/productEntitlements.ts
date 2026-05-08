export type ProductVariantStatus = 'active' | 'draft' | 'disabled' | string

export type ProductVariantPublic = {
  id: string
  label: string
  status: ProductVariantStatus
  licenseScope?: string
  price?: number | string
  currency?: string
  checkoutMode?: string
  checkoutUrl?: string
  default?: boolean
}

export type ProductVariant = ProductVariantPublic & {
  deliverableSetId?: string
}

export type ProductDeliverableSet = {
  id: string
  label: string
  deliverableIds: string[]
}

export type ProductBundleStatus = 'active' | 'draft' | 'disabled' | string

export type ProductBundleVariantRef = {
  productSlug: string
  variantId: string
}

export type ProductBundle = {
  id: string
  label: string
  status: ProductBundleStatus
  productSlugs: string[]
  variantRefs?: ProductBundleVariantRef[]
  price?: number | string
  currency?: string
  checkoutMode?: string
  checkoutUrl?: string
}

export type PublicVariantSelection = {
  variantId: string
  checkoutUrl: string
  checkoutMode: string
  licenseScope: string
}
