export type SiteConfig = {
  name: string
  origin: string
  defaultTitle: string
  titleTemplate: string
  description: string
  defaultDescription: string
  defaultOgImage: string
  language: string
  twitterCard: 'summary' | 'summary_large_image'
}

export const siteConfig: SiteConfig = {
  name: 'VARUNTOOLS',
  origin: 'https://varun.tools',
  defaultTitle: 'VARUNTOOLS',
  titleTemplate: '%s · VARUNTOOLS',
  description: '도구, 작업, 실험을 정리하는 VARUNTOOLS 쇼룸입니다.',
  defaultDescription: '도구, 작업, 실험을 정리하는 VARUNTOOLS 쇼룸입니다.',
  defaultOgImage: '/og/default-og.svg',
  language: 'ko-KR',
  twitterCard: 'summary_large_image',
}

export const SITE_CONFIG = siteConfig
