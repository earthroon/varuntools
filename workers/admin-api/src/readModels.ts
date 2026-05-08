import manifestData from '../../delivery/src/generated/product-delivery-manifest.json'
import type { AdminDeliveryIncidentSummary, AdminProductOpsSummary, Env, Paginated } from './types'

function defaultVariantId(product: any): string | null {
  const variants = Array.isArray(product.variants) ? product.variants : []
  return variants.find((variant: any) => variant.default)?.id || variants[0]?.id || null
}

export async function listProductOps(_env: Env): Promise<AdminProductOpsSummary[]> {
  const products = Array.isArray((manifestData as any).products) ? (manifestData as any).products : []
  return products.map((product: any) => ({
    slug: String(product.slug || ''),
    title: String(product.title || product.slug || ''),
    sku: product.sku || null,
    readyForCatalog: Boolean(product.launch?.readyForCatalog),
    readyForCheckout: Boolean(product.launch?.readyForCheckout),
    checkoutProvider: product.checkout?.provider || null,
    checkoutMode: product.checkout?.mode || null,
    deliverableCount: Array.isArray(product.delivery?.deliverables) ? product.delivery.deliverables.length : 0,
    variantCount: Array.isArray(product.variants) ? product.variants.length : 0,
    bundleCount: Array.isArray(product.bundles) ? product.bundles.length : 0,
    defaultVariantId: defaultVariantId(product),
    isDemo: Boolean(product.isDemo),
    visibility: String(product.visibility || ''),
  }))
}

export async function listDeliveryIncidents(_env: Env): Promise<Paginated<AdminDeliveryIncidentSummary>> {
  const products = Array.isArray((manifestData as any).products) ? (manifestData as any).products : []
  const items: AdminDeliveryIncidentSummary[] = []
  for (const product of products) {
    if (product.launch?.readyForCheckout && !product.delivery?.deliverables?.length) {
      items.push({ id: `${product.slug}:deliverable-empty`, type: 'deliverable-empty', severity: 'blocker', productSlug: product.slug, message: 'Product is readyForCheckout but has no private deliverables.' })
    }
    if (Array.isArray(product.variants) && product.variants.some((variant: any) => variant.status === 'active' && !variant.deliverableSetId)) {
      items.push({ id: `${product.slug}:variant-entitlement-missing`, type: 'variant-entitlement-missing', severity: 'blocker', productSlug: product.slug, message: 'Active variant is missing deliverableSetId.' })
    }
  }
  return { items, limit: 50, offset: 0, nextCursor: null }
}
