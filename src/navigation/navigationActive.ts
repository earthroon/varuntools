import type { NavigationActiveMatch } from './navigationTypes'

function normalizePath(path: string): string {
  if (!path) return '/'
  const withoutQuery = path.split(/[?#]/)[0] || '/'
  if (withoutQuery.length > 1) return withoutQuery.replace(/\/+$/, '')
  return withoutQuery
}

export function isNavigationItemActive(
  currentPath: string,
  itemHref: string,
  match: NavigationActiveMatch = itemHref === '/' ? 'exact' : 'startsWith',
): boolean {
  const current = normalizePath(currentPath)
  const href = normalizePath(itemHref)

  if (href === '/') return current === '/'
  if (match === 'exact') return current === href

  return current === href || current.startsWith(`${href}/`)
}
