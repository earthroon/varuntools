export type NavigationSectionId =
  | 'home'
  | 'works'
  | 'products'
  | 'tools'
  | 'lab'
  | 'inquiry'
  | 'policies'
  | 'utility'

export type NavigationSurface =
  | 'header'
  | 'footer'
  | 'section'
  | 'utility'
  | 'hidden'

export type NavigationItem = {
  id: string
  label: string
  href: string
  section: NavigationSectionId
  surface: NavigationSurface[]
  order: number
  description?: string
  featured?: boolean
  external?: boolean
}

export type SectionNavigationGroup = {
  id: NavigationSectionId
  label: string
  description?: string
  items: NavigationItem[]
}

export type NavigationActiveMatch =
  | 'exact'
  | 'startsWith'
