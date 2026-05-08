import { resolvePageSeo } from '@/site/seo'
import type { PageMeta } from './pageMeta'

function toPageMeta(seo: ReturnType<typeof resolvePageSeo>): PageMeta {
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

export function createWorksPageMeta(): PageMeta {
  return toPageMeta(resolvePageSeo({
    title: 'Works',
    description: 'VARUNTOOLS의 작업, 도구, 실험, 문서를 탐색하는 인덱스입니다.',
    routePath: '/works',
    kind: 'page',
  }))
}

export function createNotFoundPageMeta(): PageMeta {
  return toPageMeta(resolvePageSeo({
    title: '404',
    description: '요청한 페이지를 찾을 수 없습니다.',
    routePath: '/404',
    noindex: true,
    kind: 'page',
  }))
}
