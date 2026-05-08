import type { LoadedMarkdownPage } from '@/markdown/types'
import { resolvePageSeo, routePathFromSlug } from '@/site/seo'

export type PageMeta = {
  title: string
  description: string
  canonicalUrl: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  ogType: 'website' | 'article'
  twitterCard: string
  robots: string
}

export function createPageMeta(page: LoadedMarkdownPage): PageMeta {
  const fm = page.frontmatter
  const seo = resolvePageSeo({
    title: fm.title,
    seoTitle: fm.seoTitle,
    ogTitle: fm.ogTitle,
    description: fm.description,
    seoDescription: fm.seoDescription,
    ogDescription: fm.ogDescription,
    summary: fm.summary,
    routePath: routePathFromSlug(page.slug),
    contentDir: page.contentDir,
    ogImage: fm.ogImage,
    cover: fm.cover,
    thumbnail: fm.thumbnail,
    cardCover: fm.cardCover,
    canonical: fm.canonical,
    noindex: fm.noindex,
    draft: fm.draft,
    status: fm.status,
    visibility: fm.visibility,
    robots: fm.robots,
    kind: fm.kind,
  })

  return {
    title: seo.fullTitle,
    description: seo.description,
    canonicalUrl: seo.canonicalUrl,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImage: seo.ogImageUrl,
    ogType: seo.ogType,
    twitterCard: seo.twitterCard,
    robots: seo.robots,
  }
}
