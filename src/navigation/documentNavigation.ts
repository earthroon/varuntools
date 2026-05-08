export function normalizeRoutePath(path: string): string {
  const clean = (path || '/').split('?')[0]?.split('#')[0] || '/'
  if (clean === '/') return '/'
  return clean.replace(/\/+$/, '') || '/'
}

export function getParentPath(path: string): string | null {
  const clean = normalizeRoutePath(path)

  if (clean === '/') return null

  const parts = clean.split('/').filter(Boolean)

  if (parts.length <= 1) return '/'

  parts.pop()
  return `/${parts.join('/')}`
}

export function canUseBrowserBack(): boolean {
  return typeof window !== 'undefined' && window.history.length > 1
}
