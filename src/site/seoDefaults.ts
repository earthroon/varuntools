import { siteConfig } from './siteConfig'

export const siteSeoDefaults = {
  siteName: 'VARUN.tools',
  baseUrl: siteConfig.origin || 'https://varun.tools',
  defaultTitle: 'VARUN.tools',
  defaultDescription:
    '감정, 구조, 도구, 글쓰기를 연결해 실제 작동하는 인터페이스와 시스템으로 구현하는 포트폴리오.',
  defaultOgImage: siteConfig.defaultOgImage || '/og/default-og.svg',
  twitterCard: siteConfig.twitterCard || 'summary_large_image',
} as const
