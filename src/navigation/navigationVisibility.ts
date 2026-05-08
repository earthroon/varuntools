import type { NavigationItem } from './navigationTypes'

type InventoryLikePage = {
  routePath: string
  visibility?: string
  status?: string
  noindex?: boolean
  section?: string
  source?: string
}

export function isPageEligibleForPublicNavigation(page: InventoryLikePage): boolean {
  if (page.visibility && page.visibility !== 'public') return false
  if (page.status && page.status !== 'active') return false
  if (page.noindex) return false
  if (page.section === 'checkout' || page.section === 'qa') return false
  if (/dummy|playground|spec/i.test(page.source || page.routePath)) return false
  return true
}

export function isNavigationItemPublicSurface(item: NavigationItem): boolean {
  return item.surface.some((surface) => surface === 'header' || surface === 'footer' || surface === 'section')
}
