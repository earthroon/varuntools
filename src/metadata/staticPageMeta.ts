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
    description: 'VARUNTOOLS의 작업과 사례를 탐색하는 작업 인덱스입니다.',
    routePath: '/works',
    kind: 'page',
  }))
}

export function createPublicContentIndexPageMeta(): PageMeta {
  return toPageMeta(resolvePageSeo({
    title: 'Index',
    description: '페이지, 글, 작업, 실험, 도구, 상품을 분류별로 탐색하는 공개 콘텐츠 인덱스입니다.',
    routePath: '/index',
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
