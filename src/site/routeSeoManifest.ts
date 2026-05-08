import type { RouteSeoManifest } from './seoTypes'

export const routeSeoManifest: RouteSeoManifest = {
  '/': {
    route: '/',
    title: 'VARUN.tools',
    description: '감정과 구조를 실제 도구, 글쓰기, 인터페이스로 구현하는 포트폴리오.',
    og: { type: 'website' },
  },
  '/works': {
    route: '/works',
    title: 'Works | VARUN.tools',
    description: '감정, 구조, 기술을 하나의 작동 흐름으로 엮은 대표 작업 모음.',
    og: { type: 'website' },
  },
  '/works/varuntools-showroom': {
    route: '/works/varuntools-showroom',
    title: 'VarunTools Showroom | VARUN.tools',
    description: 'VARUN.tools의 포트폴리오, 탐색, 조판, 문의 시스템을 하나의 쇼룸으로 정리한 작업.',
    og: { type: 'article' },
  },
  '/products': {
    route: '/products',
    title: 'Products | VARUN.tools',
    description: '디지털 템플릿, 도구, 리소스를 탐색할 수 있는 제품 섹션.',
    og: { type: 'website' },
  },
  '/products/categories': {
    route: '/products/categories',
    title: 'Product Categories | VARUN.tools',
    description: 'VARUN.tools 제품 카테고리를 기준으로 템플릿과 리소스를 살펴본다.',
    og: { type: 'website' },
  },
  '/products/categories/templates': {
    route: '/products/categories/templates',
    title: 'Templates | VARUN.tools',
    description: '작업 흐름과 콘텐츠 구성을 돕는 템플릿 카테고리.',
    og: { type: 'website' },
  },
  '/wiper': {
    route: '/wiper',
    title: 'Wiper | VARUN.tools',
    description: '작업 흐름을 정리하고 불필요한 흔적을 닦아내는 도구 페이지.',
    og: { type: 'article' },
  },
  '/lab-markdown-gallery': {
    route: '/lab-markdown-gallery',
    title: 'Markdown Gallery | VARUN.tools',
    description: '마크다운 기반 콘텐츠 표현과 렌더링 패턴을 확인하는 실험실.',
    og: { type: 'article' },
  },
}

export const publicSeoRoutes = Object.keys(routeSeoManifest)
