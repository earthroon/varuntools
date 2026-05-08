import type { LoadedMarkdownPage } from './types'

export function normalizeSlugString(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}

export function normalizePageSlug(raw: unknown, fallback = 'home'): string {
  if (Array.isArray(raw)) {
    const normalized = normalizeSlugString(raw.join('/'))
    return normalized || fallback
  }

  const normalized = normalizeSlugString(String(raw || ''))
  return normalized || fallback
}

export function findMarkdownPageBySlug(
  pages: LoadedMarkdownPage[],
  slug: string,
): LoadedMarkdownPage | null {
  const normalized = normalizeSlugString(slug)
  return pages.find((page) => page.slug === normalized) || null
}
