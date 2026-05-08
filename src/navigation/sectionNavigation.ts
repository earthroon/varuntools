import { pageIndex } from './pageIndex'
import type { NavigationItem, NavigationSectionId, SectionNavigationGroup } from './navigationTypes'

function byOrder(a: NavigationItem, b: NavigationItem): number {
  return a.order - b.order || a.label.localeCompare(b.label)
}

export const headerNavigation = pageIndex
  .filter((item) => item.surface.includes('header'))
  .slice()
  .sort(byOrder)

export const footerNavigation = pageIndex
  .filter((item) => item.surface.includes('footer'))
  .slice()
  .sort(byOrder)

export const utilityNavigation = pageIndex
  .filter((item) => item.surface.includes('utility'))
  .slice()
  .sort(byOrder)

export const sectionNavigation = pageIndex.reduce<Record<NavigationSectionId, SectionNavigationGroup>>(
  (groups, item) => {
    const group = groups[item.section]
    if (item.surface.includes('section')) {
      group.items.push(item)
      group.items.sort(byOrder)
    }
    return groups
  },
  {
    home: { id: 'home', label: 'Home', items: [] },
    works: { id: 'works', label: 'Works', description: 'Portfolio and case-study pages.', items: [] },
    products: { id: 'products', label: 'Products', description: 'Store and product discovery pages.', items: [] },
    tools: { id: 'tools', label: 'Tools', description: 'Interactive utility pages.', items: [] },
    lab: { id: 'lab', label: 'Lab', description: 'Public experiments that are safe to browse.', items: [] },
    inquiry: { id: 'inquiry', label: 'Inquiry', description: 'Contact and intake surfaces.', items: [] },
    policies: { id: 'policies', label: 'Policies', description: 'Operational policy pages. Hidden/noindex pages are excluded by default.', items: [] },
    utility: { id: 'utility', label: 'Utility', items: [] },
  },
)
