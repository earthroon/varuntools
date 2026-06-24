export type ReservedRouteName = 'home' | 'index' | 'works' | 'works-tags' | 'search' | 'content-index' | 'not-found'

export type ReservedRoute = {
  name: ReservedRouteName
  path: string
  reason: string
}

export const RESERVED_ROUTES: ReservedRoute[] = [
  {
    name: 'home',
    path: '',
    reason: 'site-home',
  },
  {
    name: 'index',
    path: 'index',
    reason: 'public-content-index-page',
  },
  {
    name: 'works',
    path: 'works',
    reason: 'works-collection-page',
  },
  {
    name: 'works-tags',
    path: 'works/tags',
    reason: 'works-tag-landing-prefix',
  },
  {
    name: 'content-index',
    path: 'index',
    reason: 'public-content-index-page',
  },
  {
    name: 'search',
    path: 'search',
    reason: 'site-search-page',
  },
  {
    name: 'not-found',
    path: '404',
    reason: 'not-found-page',
  },
]

export function normalizeRoutePath(path: string): string {
  return path.trim().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}

export function isReservedRoute(path: string): boolean {
  const normalized = normalizeRoutePath(path)
  return RESERVED_ROUTES.some((route) => route.path === normalized)
}

export function getReservedRoutePaths(): string[] {
  return RESERVED_ROUTES.map((route) => route.path)
}

