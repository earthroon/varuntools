import {
  productCategories,
  productCollections,
  productStatuses,
  productSubcategories,
  productTypes,
  type StoreTaxonomyItem,
} from '@/config/storeTaxonomy'

export type StoreTaxonomyGroup = 'type' | 'category' | 'subcategory' | 'collection' | 'status'

const GROUPS: Record<StoreTaxonomyGroup, StoreTaxonomyItem[]> = {
  type: productTypes,
  category: productCategories,
  subcategory: productSubcategories,
  collection: productCollections,
  status: productStatuses,
}

function normalizeKebabish(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function normalizeTaxonomyValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  return normalizeKebabish(String(value))
}

export function isKnownTaxonomyValue(group: StoreTaxonomyGroup, value: string): boolean {
  const normalized = normalizeTaxonomyValue(value)
  if (!normalized) return false
  return GROUPS[group].some((item) => item.id === normalized)
}

export function isKnownProductType(value: string): boolean { return isKnownTaxonomyValue('type', value) }
export function isKnownProductCategory(value: string): boolean { return isKnownTaxonomyValue('category', value) }
export function isKnownProductSubcategory(value: string): boolean { return isKnownTaxonomyValue('subcategory', value) }
export function isKnownProductCollection(value: string): boolean { return isKnownTaxonomyValue('collection', value) }

function fallbackLabel(value?: string): string {
  const normalized = normalizeTaxonomyValue(value)
  if (!normalized) return ''
  return normalized.split('-').filter(Boolean).map((part) => part.slice(0, 1).toLocaleUpperCase() + part.slice(1)).join(' ')
}

export function resolveTaxonomyLabel(group: StoreTaxonomyGroup, value?: string): string {
  const normalized = normalizeTaxonomyValue(value)
  if (!normalized) return ''
  return GROUPS[group].find((item) => item.id === normalized)?.label || fallbackLabel(normalized)
}

export function resolveProductTypeLabel(value?: string): string { return resolveTaxonomyLabel('type', value) || 'Product' }
export function resolveProductCategoryLabel(value?: string): string { return resolveTaxonomyLabel('category', value) || 'Uncategorized' }
export function resolveProductSubcategoryLabel(value?: string): string { return resolveTaxonomyLabel('subcategory', value) }
export function resolveProductCollectionLabel(value?: string): string { return resolveTaxonomyLabel('collection', value) || 'Collection' }

function optionsFor(group: StoreTaxonomyGroup, includeHidden = false): StoreTaxonomyItem[] {
  return [...GROUPS[group]].filter((item) => includeHidden || item.visible !== false).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
}

export function getProductTypeOptions(includeHidden = false): StoreTaxonomyItem[] { return optionsFor('type', includeHidden) }
export function getProductCategoryOptions(includeHidden = false): StoreTaxonomyItem[] { return optionsFor('category', includeHidden) }
export function getProductSubcategoryOptions(includeHidden = false): StoreTaxonomyItem[] { return optionsFor('subcategory', includeHidden) }
export function getProductCollectionOptions(includeHidden = false): StoreTaxonomyItem[] { return optionsFor('collection', includeHidden) }
export function getProductStatusOptions(includeHidden = false): StoreTaxonomyItem[] { return optionsFor('status', includeHidden) }

export function sortByTaxonomyOrder(group: StoreTaxonomyGroup, values: string[]): string[] {
  const normalized = Array.from(new Set(values.map(normalizeTaxonomyValue).filter(Boolean)))
  const orderMap = new Map(GROUPS[group].map((item) => [item.id, item.order]))
  return normalized.sort((a, b) => {
    const oa = orderMap.get(a) ?? 9999
    const ob = orderMap.get(b) ?? 9999
    return oa - ob || a.localeCompare(b)
  })
}
