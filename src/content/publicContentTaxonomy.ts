import taxonomy from '../../config/public-content-taxonomy.json'

export type PublicContentCategory =
  | 'page'
  | 'post'
  | 'work'
  | 'case-study'
  | 'lab'
  | 'tool'
  | 'product'
  | 'doc'
  | 'catalog'
  | 'commission'
  | 'checkout'
  | 'claim'
  | 'inquiry'
  | 'policies'
  | 'qa'

export type PublicContentCollection =
  | 'page'
  | 'post'
  | 'works'
  | 'lab'
  | 'tools'
  | 'products'
  | 'docs'
  | 'none'
  | string

export type PublicExposureDefault = {
  route: boolean
  home: boolean
  collection: string
  search: boolean
  sitemap: boolean
  nav: boolean
  featured: boolean
  routeOnly: boolean
}

export const PUBLIC_CONTENT_TAXONOMY = taxonomy
export const PUBLIC_CATEGORY_KEYS = taxonomy.publicCategories
export const PUBLIC_KIND_KEYS = taxonomy.publicKinds
export const PUBLIC_INDEX_CATEGORY_KEYS = taxonomy.publicIndexCategories
export const UTILITY_ROUTE_CATEGORY_KEYS = taxonomy.utilityRouteCategories
export const WORK_ROUTE_CATEGORY_KEYS = taxonomy.workRouteCategories
export const PUBLIC_CATEGORY_LABELS: Record<string, string> = taxonomy.labels

export const PUBLIC_CATEGORIES = new Set<string>(PUBLIC_CATEGORY_KEYS)
export const PUBLIC_KINDS = new Set<string>(PUBLIC_KIND_KEYS)
export const PUBLIC_INDEX_CATEGORIES = new Set<string>(PUBLIC_INDEX_CATEGORY_KEYS)
export const UTILITY_ROUTE_CATEGORIES = new Set<string>(UTILITY_ROUTE_CATEGORY_KEYS)
export const WORK_ROUTE_CATEGORIES = new Set<string>(WORK_ROUTE_CATEGORY_KEYS)

export function normalizePublicCategory(value: unknown): string {
  const normalized = String(value ?? '').trim().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
  if (!normalized) return 'page'
  if (normalized === 'works') return 'work'
  if (normalized === 'products') return 'product'
  if (normalized === 'tools') return 'tool'
  if (normalized === 'case-studies') return 'case-study'
  return normalized
}

export function isKnownPublicCategory(value: unknown): boolean {
  return PUBLIC_CATEGORIES.has(normalizePublicCategory(value))
}

export function isKnownPublicKind(value: unknown): boolean {
  return PUBLIC_KINDS.has(normalizePublicCategory(value))
}

export function isPublicIndexCategory(value: unknown): boolean {
  return PUBLIC_INDEX_CATEGORIES.has(normalizePublicCategory(value))
}

export function isUtilityRouteCategory(value: unknown): boolean {
  return UTILITY_ROUTE_CATEGORIES.has(normalizePublicCategory(value))
}

export function isWorkRouteCategory(value: unknown): boolean {
  return WORK_ROUTE_CATEGORIES.has(normalizePublicCategory(value))
}

export function collectionForCategory(value: unknown): string {
  const category = normalizePublicCategory(value)
  return (taxonomy.collections as Record<string, string>)[category] || 'page'
}

export function getPublicCategoryLabel(value: unknown): string {
  const category = normalizePublicCategory(value)
  return PUBLIC_CATEGORY_LABELS[category] || category
}

export function defaultExposureForCategory(value: unknown): PublicExposureDefault {
  const category = normalizePublicCategory(value)
  const utility = isUtilityRouteCategory(category)
  return {
    route: true,
    home: false,
    collection: collectionForCategory(category),
    search: !utility,
    sitemap: !utility,
    nav: false,
    featured: false,
    routeOnly: utility,
  }
}

export const DEFAULT_EXPOSURE_BY_KIND: Record<string, PublicExposureDefault> = Object.fromEntries(
  PUBLIC_CATEGORY_KEYS.map((category) => [category, defaultExposureForCategory(category)]),
)
