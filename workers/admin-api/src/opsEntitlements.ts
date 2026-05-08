export function summarizeEntitlementScope(raw: string | null | undefined): { variantId: string | null; bundleId: string | null; deliverableCount: number; licenseScope: string | null } {
  if (!raw) return { variantId: null, bundleId: null, deliverableCount: 0, licenseScope: null }
  try {
    const parsed = JSON.parse(raw) as { variantId?: string | null; bundleId?: string | null; deliverableIds?: string[]; licenseScope?: string | null }
    return {
      variantId: parsed.variantId || null,
      bundleId: parsed.bundleId || null,
      deliverableCount: Array.isArray(parsed.deliverableIds) ? parsed.deliverableIds.length : 0,
      licenseScope: parsed.licenseScope || null,
    }
  } catch {
    return { variantId: null, bundleId: null, deliverableCount: 0, licenseScope: null }
  }
}
