import { resolveContentAssetFromDir } from '@/content/assetRegistry'
import { siteConfig } from './siteConfig'

export type PageSeoInput = {
  title?: string
  seoTitle?: string
  ogTitle?: string
  description?: string
  seoDescription?: string
  ogDescription?: string
  summary?: string
  routePath: string
  contentDir?: string
  ogImage?: string
  cover?: string
  thumbnail?: string
  cardCover?: string
  canonical?: string
  noindex?: boolean
  draft?: boolean
  status?: string
  visibility?: string
  robots?: string
  kind?: string
}

export type ResolvedPageSeo = {
  title: string
  fullTitle: string
  description: string
  canonicalUrl: string
  ogTitle: string
  ogDescription: string
  ogImageUrl: string
  ogType: 'website' | 'article'
  twitterCard: string
  robots: string
  noindex: boolean
}

function joinUrl(origin: string, inputPath: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '')
  const cleanPath = String(inputPath || '').replace(/^\/+/, '')
  return cleanPath ? `${cleanOrigin}/${cleanPath}` : cleanOrigin
}

export function normalizeRoutePath(path: string): string {
  const clean = String(path || '/').split('?')[0]?.split('#')[0] || '/'
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`
  if (withSlash === '/') return '/'
  return withSlash.replace(/\/+$/, '')
}

export function titleWithTemplate(title: string): string {
  const clean = title.trim() || siteConfig.defaultTitle
  if (clean === siteConfig.defaultTitle) return siteConfig.defaultTitle
  return siteConfig.titleTemplate.replace('%s', clean)
}

function absoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  if (/^\/\//.test(value)) return `https:${value}`
  return joinUrl(siteConfig.origin, value)
}

function resolveImageUrl(input: PageSeoInput): string {
  const candidate = input.ogImage || input.cover || input.thumbnail || input.cardCover || siteConfig.defaultOgImage

  if (/^https?:\/\//i.test(candidate) || /^\/\//.test(candidate)) return absoluteUrl(candidate)
  if (candidate.startsWith('/')) return joinUrl(siteConfig.origin, candidate)

  if (input.contentDir) {
    const resolved = resolveContentAssetFromDir(input.contentDir, candidate)
    if (resolved.found && resolved.url) return absoluteUrl(resolved.url)
  }

  return joinUrl(siteConfig.origin, siteConfig.defaultOgImage)
}

function resolveNoindex(input: PageSeoInput): boolean {
  return Boolean(
    input.noindex === true ||
      input.draft === true ||
      input.status === 'draft' ||
      input.visibility === 'hidden' ||
      String(input.robots || '').startsWith('noindex'),
  )
}

function resolveRobots(input: PageSeoInput, noindex: boolean): string {
  if (input.robots) return input.robots
  return noindex ? 'noindex,nofollow' : 'index,follow'
}

export function resolvePageSeo(input: PageSeoInput): ResolvedPageSeo {
  const rawTitle = input.seoTitle || input.ogTitle || input.title || siteConfig.defaultTitle
  const description = input.seoDescription || input.ogDescription || input.summary || input.description || siteConfig.defaultDescription
  const routePath = normalizeRoutePath(input.routePath)
  const canonicalUrl = input.canonical && /^https?:\/\//i.test(input.canonical)
    ? input.canonical
    : joinUrl(siteConfig.origin, input.canonical || routePath)
  const noindex = resolveNoindex(input)
  const ogTitle = input.ogTitle || rawTitle
  const ogDescription = input.ogDescription || description

  return {
    title: titleWithTemplate(rawTitle),
    fullTitle: titleWithTemplate(rawTitle),
    description,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImageUrl: resolveImageUrl(input),
    ogType: input.kind === 'doc' || input.kind === 'page' ? 'article' : 'website',
    twitterCard: siteConfig.twitterCard,
    robots: resolveRobots(input, noindex),
    noindex,
  }
}

export function routePathFromSlug(slug: string): string {
  return slug === 'home' ? '/' : normalizeRoutePath(slug)
}

export { siteSeoDefaults } from './seoDefaults'
export { routeSeoManifest, publicSeoRoutes } from './routeSeoManifest'
export type { RouteSeoMeta, RouteSeoManifest, SeoRobotsDirective } from './seoTypes'


export function createCanonicalUrl(route: string): string {
  const normalizedRoute = normalizeRoutePath(route)
  return joinUrl(siteConfig.origin, normalizedRoute)
}

export function absolutizeOgImage(imagePath: string): string {
  return absoluteUrl(imagePath)
}
