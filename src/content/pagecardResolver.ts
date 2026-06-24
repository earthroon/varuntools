import type { LoadedMarkdownPage } from '@/markdown/types'
import { getCollectionKey, resolveContentCategory, resolveContentKind, resolvePublicExposure } from '@/content/exposureTaxonomy'

export type PagecardGridSort = 'manual' | 'title' | 'order' | 'date'

export type PagecardGridItemInput = {
  href: string
  title?: string
  description?: string
  thumbnail?: string
  tag?: string
}

export type PagecardResolvedItem = {
  href: string
  title: string
  description: string
  thumbnail: string
  tag: string
  order: number
  date: string
  contentDir: string
  unresolved: boolean
}

export type PagecardQueryOptions = {
  query?: string
  tag?: string
  section?: string
  featured?: boolean
  limit?: number
  sort?: PagecardGridSort
}

function trimSlashes(value: string): string {
  return value.trim().replace(/^\/+/, '').replace(/\/+$/, '')
}

export function normalizePagecardHref(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//.test(trimmed)) return trimmed
  if (trimmed === '/') return '/'
  return `/${trimSlashes(trimmed)}`
}

function hrefToSlug(href: string): string {
  const normalized = normalizePagecardHref(href)
  if (normalized === '/') return 'home'
  return trimSlashes(normalized)
}

function fallbackTitleFromHref(href: string): string {
  const slug = hrefToSlug(href)
  const last = slug.split('/').filter(Boolean).pop() || slug || 'Untitled'
  return last
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function pageToCard(page: LoadedMarkdownPage): PagecardResolvedItem {
  const frontmatter = page.frontmatter
  const href = page.slug === 'home' ? '/' : `/${page.slug}`
  const kind = resolveContentKind(page)
  const category = resolveContentCategory(page)
  const collection = getCollectionKey(page)

  return {
    href,
    title: frontmatter.cardTitle || frontmatter.title || fallbackTitleFromHref(href),
    description:
      frontmatter.cardDescription ||
      frontmatter.summary ||
      frontmatter.description ||
      '',
    thumbnail:
      frontmatter.cardCover ||
      frontmatter.cover ||
      frontmatter.ogImage ||
      '',
    tag:
      frontmatter.cardIcon ||
      kind ||
      category ||
      collection ||
      (Array.isArray(frontmatter.tags) ? frontmatter.tags[0] : '') ||
      'page',
    order: typeof frontmatter.order === 'number' ? frontmatter.order : 9999,
    date: frontmatter.date || frontmatter.updated || '',
    contentDir: page.contentDir,
    unresolved: false,
  }
}

export function resolvePagecardByHref(
  pages: LoadedMarkdownPage[],
  href: string,
): PagecardResolvedItem | null {
  const slug = hrefToSlug(href)
  const page = pages.find((item) => item.slug === slug)
  return page ? pageToCard(page) : null
}

export function resolveManualPagecard(
  pages: LoadedMarkdownPage[],
  input: PagecardGridItemInput,
): PagecardResolvedItem | null {
  const href = normalizePagecardHref(input.href)
  if (!href) return null

  const registry = resolvePagecardByHref(pages, href)
  if (!registry && !input.title) return null

  return {
    href,
    title: input.title || registry?.title || fallbackTitleFromHref(href),
    description: input.description || registry?.description || '',
    thumbnail: input.thumbnail || registry?.thumbnail || '',
    tag: input.tag || registry?.tag || '',
    order: registry?.order ?? 9999,
    date: registry?.date || '',
    contentDir: registry?.contentDir || '',
    unresolved: !registry,
  }
}

function pageMatchesQuery(page: LoadedMarkdownPage, options: PagecardQueryOptions): boolean {
  const frontmatter = page.frontmatter
  const href = `/${page.slug}`
  const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : []

  const exposure = resolvePublicExposure(page)

  if (!exposure.route) return false

  if (options.featured && frontmatter.featured !== true) return false

  if (options.section) {
    const section = trimSlashes(options.section)
    const collection = getCollectionKey(page)
    if (collection !== section && !page.slug.startsWith(`${section}/`) && page.slug !== section) return false
  }

  if (options.tag) {
    const tag = options.tag.trim()
    if (frontmatter.kind !== tag && !tags.includes(tag)) return false
  }

  if (options.query) {
    const query = options.query.trim().toLowerCase()
    const haystack = [
      href,
      page.slug,
      frontmatter.title,
      frontmatter.summary,
      frontmatter.description,
      frontmatter.kind,
      frontmatter.category,
      resolveContentKind(page),
      resolveContentCategory(page),
      getCollectionKey(page),
      ...tags,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (!haystack.includes(query)) return false
  }

  return true
}

function sortResolvedItems(
  items: PagecardResolvedItem[],
  sort: PagecardGridSort = 'manual',
): PagecardResolvedItem[] {
  const copy = [...items]

  if (sort === 'title') {
    return copy.sort((a, b) => a.title.localeCompare(b.title))
  }

  if (sort === 'order') {
    return copy.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
  }

  if (sort === 'date') {
    return copy.sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order)
  }

  return copy
}

export function resolvePagecardsByQuery(
  pages: LoadedMarkdownPage[],
  options: PagecardQueryOptions,
): PagecardResolvedItem[] {
  const limit = options.limit && Number.isFinite(options.limit)
    ? Math.max(1, Math.min(24, Math.floor(options.limit)))
    : 24

  const cards = pages
    .filter((page) => pageMatchesQuery(page, options))
    .map(pageToCard)

  return sortResolvedItems(cards, options.sort).slice(0, limit)
}
