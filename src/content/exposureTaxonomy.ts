import type { LoadedMarkdownPage } from '@/markdown/types'

export type PublicVisibility = 'public' | 'hidden' | 'private' | 'draft'

export type PublicExposure = {
  route: boolean
  home: boolean
  collection: string
  search: boolean
  sitemap: boolean
  nav: boolean
  featured: boolean
  routeOnly: boolean
}

export type ResolvedPublicExposure = PublicExposure & {
  category: string
  kind: string
  visibility: PublicVisibility
  status: string
  resolvedSurfaces: string[]
  blockedReasons: string[]
}

export type PublicExposureIssue = {
  severity: 'warning' | 'error'
  code: string
  message: string
}

export const PUBLIC_CATEGORY_KEYS = [
  'work',
  'tool',
  'lab',
  'product',
  'case-study',
  'post',
  'page',
] as const

export const PUBLIC_KIND_KEYS = [
  'work',
  'tool',
  'lab',
  'product',
  'case-study',
  'post',
  'page',
  'doc',
  'catalog',
  'commission',
] as const

const KNOWN_CATEGORIES = new Set<string>(PUBLIC_CATEGORY_KEYS)
const KNOWN_KINDS = new Set<string>(PUBLIC_KIND_KEYS)

const DEFAULT_EXPOSURE_BY_KIND: Record<string, PublicExposure> = {
  work: { route: true, home: false, collection: 'works', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  tool: { route: true, home: false, collection: 'tools', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  lab: { route: true, home: false, collection: 'lab', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  product: { route: true, home: false, collection: 'products', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  'case-study': { route: true, home: false, collection: 'works', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  post: { route: true, home: false, collection: 'post', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  page: { route: true, home: false, collection: 'page', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  doc: { route: true, home: false, collection: 'docs', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  catalog: { route: true, home: false, collection: 'products', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
  commission: { route: true, home: false, collection: 'works', search: true, sitemap: true, nav: false, featured: false, routeOnly: false },
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return fallback
}

function normalizeSlug(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}

function firstSlugPart(page: LoadedMarkdownPage): string {
  const slug = normalizeSlug(page.slug || page.contentDir || '')
  return slug.split('/').filter(Boolean)[0] || 'page'
}

function categoryFromSlug(page: LoadedMarkdownPage): string {
  const first = firstSlugPart(page)
  if (first === 'works') return 'work'
  if (first === 'products') return 'product'
  if (first === 'tools' || first === 'wiper') return 'tool'
  if (first === 'lab' || first === 'lab-markdown-gallery') return 'lab'
  if (first === 'post') return 'post'
  if (first === 'case-study' || first === 'case-studies') return 'case-study'
  return first === 'home' ? 'page' : first
}

function normalizeCategory(value: string): string {
  const normalized = normalizeSlug(value || '')
  if (!normalized) return 'page'
  return KNOWN_CATEGORIES.has(normalized) ? normalized : normalized
}

function normalizeKind(value: string): string {
  const normalized = normalizeSlug(value || '')
  if (!normalized) return 'page'
  if (normalized === 'works') return 'work'
  if (normalized === 'products') return 'product'
  if (normalized === 'tools') return 'tool'
  return KNOWN_KINDS.has(normalized) ? normalized : normalized
}

export function resolveContentCategory(page: LoadedMarkdownPage): string {
  const fm = page.frontmatter as Record<string, unknown>
  return normalizeCategory(
    readString(fm.category) ||
    readString(fm.section) ||
    categoryFromSlug(page),
  )
}

export function resolveContentKind(page: LoadedMarkdownPage): string {
  const fm = page.frontmatter as Record<string, unknown>
  return normalizeKind(
    readString(fm.kind) ||
    readString(fm.type) ||
    resolveContentCategory(page) ||
    categoryFromSlug(page),
  )
}

export function resolveVisibility(page: LoadedMarkdownPage): PublicVisibility {
  const fm = page.frontmatter as Record<string, unknown>
  const raw = readString(fm.visibility).toLowerCase()
  if (raw === 'hidden' || raw === 'private' || raw === 'draft') return raw
  if (fm.draft === true) return 'draft'
  if (readString(fm.status) === 'draft') return 'draft'
  return 'public'
}

function mergeExposure(kind: string, rawExposure: Record<string, unknown>): PublicExposure {
  const base = DEFAULT_EXPOSURE_BY_KIND[kind] || DEFAULT_EXPOSURE_BY_KIND.page
  const rawCollection = readString(rawExposure.collection)
  return {
    route: readBoolean(rawExposure.route, base.route),
    home: readBoolean(rawExposure.home, base.home),
    collection: rawCollection || base.collection,
    search: readBoolean(rawExposure.search, base.search),
    sitemap: readBoolean(rawExposure.sitemap, base.sitemap),
    nav: readBoolean(rawExposure.nav, base.nav),
    featured: readBoolean(rawExposure.featured, base.featured),
    routeOnly: readBoolean(rawExposure.routeOnly, base.routeOnly),
  }
}

function surfacesOf(exposure: PublicExposure): string[] {
  const surfaces: string[] = []
  if (exposure.route) surfaces.push('route')
  if (exposure.collection && exposure.collection !== 'none') surfaces.push(`collection:${exposure.collection}`)
  if (exposure.home) surfaces.push('home')
  if (exposure.search) surfaces.push('search')
  if (exposure.sitemap) surfaces.push('sitemap')
  if (exposure.nav) surfaces.push('nav')
  if (exposure.featured) surfaces.push('featured')
  if (exposure.routeOnly) surfaces.push('routeOnly')
  return surfaces
}

export function resolvePublicExposure(page: LoadedMarkdownPage): ResolvedPublicExposure {
  const fm = page.frontmatter as Record<string, unknown>
  const category = resolveContentCategory(page)
  const kind = resolveContentKind(page)
  const visibility = resolveVisibility(page)
  const status = readString(fm.status) || 'active'
  const rawExposure = readRecord(fm.exposure)
  const merged = mergeExposure(kind, rawExposure)
  const blockedReasons: string[] = []

  if (visibility !== 'public') {
    merged.route = false
    merged.home = false
    merged.search = false
    merged.sitemap = false
    merged.nav = false
    merged.featured = false
    blockedReasons.push(`visibility:${visibility}`)
  }

  if (status === 'archived' || status === 'trashed') {
    merged.route = false
    merged.home = false
    merged.search = false
    merged.sitemap = false
    merged.nav = false
    merged.featured = false
    blockedReasons.push(`status:${status}`)
  }

  return {
    category,
    kind,
    visibility,
    status,
    ...merged,
    resolvedSurfaces: surfacesOf(merged),
    blockedReasons,
  }
}

export function isPublicRouteEligible(page: LoadedMarkdownPage): boolean {
  return resolvePublicExposure(page).route
}

export function isSearchIndexEligible(page: LoadedMarkdownPage): boolean {
  return resolvePublicExposure(page).search
}

export function isSitemapEligible(page: LoadedMarkdownPage): boolean {
  return resolvePublicExposure(page).sitemap
}

export function isHomepageEligible(page: LoadedMarkdownPage): boolean {
  return resolvePublicExposure(page).home
}

export function getCollectionKey(page: LoadedMarkdownPage): string {
  const exposure = resolvePublicExposure(page)
  return exposure.collection && exposure.collection !== 'none'
    ? exposure.collection
    : exposure.kind
}

export function findExposureIssues(page: LoadedMarkdownPage): PublicExposureIssue[] {
  const exposure = resolvePublicExposure(page)
  const issues: PublicExposureIssue[] = []
  const discoverySurfaces = exposure.resolvedSurfaces.filter((surface) => surface !== 'route' && surface !== 'routeOnly')

  if (exposure.visibility === 'public' && !KNOWN_CATEGORIES.has(exposure.category)) {
    issues.push({ severity: 'error', code: 'PUBLIC_CATEGORY_UNKNOWN', message: `Unknown public category: ${exposure.category}` })
  }

  if (exposure.visibility === 'public' && !KNOWN_KINDS.has(exposure.kind)) {
    issues.push({ severity: 'error', code: 'PUBLIC_KIND_UNKNOWN', message: `Unknown public kind: ${exposure.kind}` })
  }

  if (exposure.visibility === 'public' && exposure.route && discoverySurfaces.length === 0 && !exposure.routeOnly) {
    issues.push({ severity: 'error', code: 'ORPHAN_PUBLISHED_MARKDOWN', message: 'Public route has no collection/search/sitemap/nav/home/featured discovery surface.' })
  }

  if (exposure.home && (!exposure.collection || exposure.collection === 'none')) {
    issues.push({ severity: 'error', code: 'HOMEPAGE_EXPOSURE_REQUEST_UNRESOLVED', message: 'Homepage exposure requires a concrete collection key.' })
  }

  return issues
}
