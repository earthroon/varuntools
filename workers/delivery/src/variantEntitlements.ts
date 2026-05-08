import type { ApiErrorCode, DeliveryProduct, GrantEntitlementScope, TossPayment } from './types'

export type ResolvedGrantEntitlement = {
  ok: true
  productSlug: string
  variantId: string | null
  bundleId: string | null
  licenseScope: string | null
  deliverableIds: string[]
  entitlementScope: GrantEntitlementScope
}

export type FailedGrantEntitlement = {
  ok: false
  code: ApiErrorCode
  reason: string
}

export type GrantEntitlementResult = ResolvedGrantEntitlement | FailedGrantEntitlement

function meta(payment: TossPayment, key: string): string {
  return String(payment.metadata?.[key] || '').trim()
}

export function variantIdFromPayment(payment: TossPayment): string {
  return meta(payment, 'variantId') || meta(payment, 'variant_id')
}

export function bundleIdFromPayment(payment: TossPayment): string {
  return meta(payment, 'bundleId') || meta(payment, 'bundle_id')
}

function fail(code: ApiErrorCode, reason: string): FailedGrantEntitlement {
  return { ok: false, code, reason }
}

function deliverableIdSet(product: DeliveryProduct): Set<string> {
  return new Set(product.delivery.deliverables.map((item) => item.id))
}

function resolveDeliverableSet(product: DeliveryProduct, deliverableSetId: string): string[] | null {
  const set = product.deliverableSets?.find((item) => item.id === deliverableSetId)
  if (!set) return null
  const validIds = deliverableIdSet(product)
  if (set.deliverableIds.some((id) => !validIds.has(id))) return null
  return set.deliverableIds
}

export function resolvePaymentEntitlement(
  payment: TossPayment,
  product: DeliveryProduct,
  productsBySlug: Map<string, DeliveryProduct>,
): GrantEntitlementResult {
  const variantId = variantIdFromPayment(payment)
  const bundleId = bundleIdFromPayment(payment)

  if (bundleId) {
    const bundle = product.bundles?.find((item) => item.id === bundleId)
    if (!bundle) return fail('PAYMENT_BUNDLE_UNKNOWN', `Unknown bundleId: ${bundleId}.`)
    if (bundle.status !== 'active') return fail('PAYMENT_ENTITLEMENT_INVALID', `Bundle ${bundleId} is ${bundle.status}.`)
    const scopeIds = new Set<string>()
    const deliverableSetIds = new Set<string>()
    for (const ref of bundle.variantRefs || []) {
      const refProduct = productsBySlug.get(ref.productSlug)
      if (!refProduct) return fail('PAYMENT_ENTITLEMENT_INVALID', `Bundle references unknown product ${ref.productSlug}.`)
      const refVariant = refProduct.variants?.find((item) => item.id === ref.variantId)
      if (!refVariant || refVariant.status !== 'active' || !refVariant.deliverableSetId) return fail('PAYMENT_ENTITLEMENT_INVALID', `Bundle references unavailable variant ${ref.productSlug}:${ref.variantId}.`)
      const ids = resolveDeliverableSet(refProduct, refVariant.deliverableSetId)
      if (!ids) return fail('PAYMENT_ENTITLEMENT_INVALID', `Bundle variant deliverable set is invalid for ${ref.productSlug}:${ref.variantId}.`)
      deliverableSetIds.add(`${ref.productSlug}:${refVariant.deliverableSetId}`)
      ids.forEach((id) => scopeIds.add(`${ref.productSlug}:${id}`))
    }
    return {
      ok: true,
      productSlug: product.slug,
      variantId: null,
      bundleId,
      licenseScope: 'bundle',
      deliverableIds: [...scopeIds],
      entitlementScope: { productSlug: product.slug, variantId: null, bundleId, deliverableSetIds: [...deliverableSetIds], deliverableIds: [...scopeIds], licenseScope: 'bundle' },
    }
  }

  if (variantId) {
    const variant = product.variants?.find((item) => item.id === variantId)
    if (!variant) return fail('PAYMENT_VARIANT_UNKNOWN', `Unknown variantId: ${variantId}.`)
    if (variant.status !== 'active') return fail('PAYMENT_ENTITLEMENT_INVALID', `Variant ${variantId} is ${variant.status}.`)
    if (!variant.deliverableSetId) return fail('PAYMENT_ENTITLEMENT_INVALID', `Variant ${variantId} is missing deliverableSetId.`)
    const deliverableIds = resolveDeliverableSet(product, variant.deliverableSetId)
    if (!deliverableIds) return fail('PAYMENT_ENTITLEMENT_INVALID', `Variant ${variantId} deliverable set is invalid.`)
    return {
      ok: true,
      productSlug: product.slug,
      variantId,
      bundleId: null,
      licenseScope: variant.licenseScope || null,
      deliverableIds,
      entitlementScope: { productSlug: product.slug, variantId, bundleId: null, deliverableSetIds: [variant.deliverableSetId], deliverableIds, licenseScope: variant.licenseScope || null },
    }
  }

  const deliverableIds = product.delivery.deliverables.map((item) => item.id)
  return {
    ok: true,
    productSlug: product.slug,
    variantId: null,
    bundleId: null,
    licenseScope: null,
    deliverableIds,
    entitlementScope: { productSlug: product.slug, variantId: null, bundleId: null, deliverableSetIds: [], deliverableIds, licenseScope: null },
  }
}

export function parseGrantEntitlementScope(raw: string | null | undefined): GrantEntitlementScope | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<GrantEntitlementScope>
    if (!Array.isArray(parsed.deliverableIds)) return null
    return {
      productSlug: String(parsed.productSlug || ''),
      variantId: parsed.variantId ? String(parsed.variantId) : null,
      bundleId: parsed.bundleId ? String(parsed.bundleId) : null,
      deliverableSetIds: Array.isArray(parsed.deliverableSetIds) ? parsed.deliverableSetIds.map(String) : [],
      deliverableIds: parsed.deliverableIds.map(String),
      licenseScope: parsed.licenseScope ? String(parsed.licenseScope) : null,
    }
  } catch {
    return null
  }
}

// GRANT_DELIVERABLE_MISMATCH remains the download redemption failure when entitlement scope excludes a deliverable.
