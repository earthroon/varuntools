import type { ProductFrontmatter } from '@/types/content'
import type { ProductVariantPublic } from '@/types/productEntitlements'

function clean(value: unknown): string {
  return String(value ?? '').trim()
}

export function getPublicProductVariants(product: ProductFrontmatter | null | undefined): ProductVariantPublic[] {
  const variants = Array.isArray(product?.variants) ? product!.variants : []
  return variants
    .map((variant) => ({
      id: clean(variant.id),
      label: clean(variant.label),
      status: clean(variant.status || 'draft'),
      licenseScope: clean(variant.licenseScope),
      price: variant.price,
      currency: clean(variant.currency),
      checkoutMode: clean(variant.checkoutMode),
      checkoutUrl: clean(variant.checkoutUrl),
      default: Boolean(variant.default),
    }))
    .filter((variant) => variant.id && variant.label)
}

export function getDefaultVariantId(product: ProductFrontmatter | null | undefined): string {
  const explicit = clean(product?.defaultVariantId)
  if (explicit) return explicit
  const variants = getPublicProductVariants(product)
  return variants.find((variant) => variant.default)?.id || variants[0]?.id || ''
}

export function isVariantPurchasable(variant: ProductVariantPublic): boolean {
  return variant.status === 'active' && Boolean(clean(variant.checkoutUrl)) && variant.checkoutMode !== 'disabled'
}

export function publicVariantNotice(): string {
  return 'Variant selection changes checkout handoff only. The server-side webhook still verifies payment metadata and creates the final grant entitlement.'
}
