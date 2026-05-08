import type { ProductFrontmatter } from '@/types/content'

export type ProductSpecItem = { label: string; value?: string | number; quantity?: string | number; note?: string }
export type ProductVariantItem = { id?: string; label: string; status?: string; note?: string }
export type ProductDeliveryInfo = { method?: string; estimate?: string; format?: string; provider?: string; note?: string }

export type ProductSpecsResolved = {
  meta: ProductSpecItem[]
  specs: ProductSpecItem[]
  variants: ProductVariantItem[]
  includedItems: ProductSpecItem[]
  compatibility: string[]
  requirements: string[]
  delivery: ProductDeliveryInfo | null
  notes: ProductSpecItem[]
}

function text(value: unknown): string {
  return String(value ?? '').trim()
}

function arrayOfObjects(value: unknown): ProductSpecItem[] {
  return Array.isArray(value)
    ? value.filter((item): item is ProductSpecItem => Boolean(item && typeof item === 'object' && 'label' in item))
    : []
}

function arrayOfVariants(value: unknown): ProductVariantItem[] {
  return Array.isArray(value)
    ? value.filter((item): item is ProductVariantItem => Boolean(item && typeof item === 'object' && 'label' in item))
    : []
}

function arrayOfStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : []
}

export function resolveProductSpecs(product: ProductFrontmatter | null | undefined): ProductSpecsResolved {
  if (!product) {
    return { meta: [], specs: [], variants: [], includedItems: [], compatibility: [], requirements: [], delivery: null, notes: [] }
  }

  const meta: ProductSpecItem[] = []
  if (product.sku) meta.push({ label: 'SKU', value: product.sku })
  if (product.category) meta.push({ label: 'Category', value: product.category })
  if (product.subcategory) meta.push({ label: 'Subcategory', value: product.subcategory })
  if (product.collection) meta.push({ label: 'Collection', value: product.collection })
  if (product.series) meta.push({ label: 'Series', value: product.series })
  if (product.material) meta.push({ label: 'Material', value: product.material })
  if (product.size) meta.push({ label: 'Size', value: product.size })
  if (product.license) meta.push({ label: 'License', value: product.license })
  if (product.releaseDate) meta.push({ label: 'Release', value: product.releaseDate })
  if (product.usageScope) meta.push({ label: 'Usage scope', value: product.usageScope })

  const deliveryObject = product.delivery && typeof product.delivery === 'object' && !Array.isArray(product.delivery)
    ? product.delivery
    : null
  const delivery: ProductDeliveryInfo | null = deliveryObject || {
    method: product.shippingRequired ? 'shipping' : product.type === 'digital' ? 'digital-download' : product.type || '',
    estimate: product.deliveryEstimate || '',
    provider: product.downloadProvider || product.checkoutProvider || '',
    note: product.digitalDeliveryNote || product.shippingNote || '',
  }

  const notes: ProductSpecItem[] = []
  if (product.shippingNote) notes.push({ label: 'Shipping', value: product.shippingNote })
  if (product.digitalDeliveryNote) notes.push({ label: 'Digital delivery', value: product.digitalDeliveryNote })
  if (product.refundNote) notes.push({ label: 'Refund', value: product.refundNote })
  if (product.policyNote) notes.push({ label: 'Policy', value: product.policyNote })
  if (product.updatePolicy) notes.push({ label: 'Updates', value: product.updatePolicy })
  if (product.caution) notes.push({ label: 'Caution', value: product.caution })

  return {
    meta,
    specs: arrayOfObjects(product.specs),
    variants: arrayOfVariants(product.variants),
    includedItems: arrayOfObjects(product.includedItems),
    compatibility: arrayOfStrings(product.compatibility),
    requirements: arrayOfStrings(product.requirements),
    delivery,
    notes,
  }
}
