import { pageIndex } from './pageIndex'
import type { NavigationItem, NavigationSectionId, NavigationSurface, SectionNavigationGroup } from './navigationTypes'

function byOrder(a: NavigationItem, b: NavigationItem): number {
  return a.order - b.order || a.label.localeCompare(b.label)
}

function hasSurface(item: NavigationItem, surface: NavigationSurface): boolean {
  return item.surface.includes(surface)
}

export const headerNavigation = pageIndex
  .filter((item) => hasSurface(item, 'header'))
  .slice()
  .sort(byOrder)

export const footerNavigation = pageIndex
  .filter((item) => hasSurface(item, 'footer'))
  .slice()
  .sort(byOrder)

export const utilityNavigation = pageIndex
  .filter((item) => hasSurface(item, 'utility'))
  .slice()
  .sort(byOrder)

export const sectionNavigation = pageIndex.reduce<Record<NavigationSectionId, SectionNavigationGroup>>(
  (groups, item) => {
    const group = groups[item.section]
    if (hasSurface(item, 'section')) {
      group.items.push(item)
      group.items.sort(byOrder)
    }
    return groups
  },
  {
    home: { id: 'home', label: '홈', items: [] },
    works: { id: 'works', label: '작업', description: '포트폴리오와 케이스 스터디 페이지.', items: [] },
    products: { id: 'products', label: '상품', description: '스토어와 상품 탐색 페이지.', items: [] },
    tools: { id: 'tools', label: '도구', description: '직접 조작할 수 있는 유틸리티 페이지.', items: [] },
    lab: { id: 'lab', label: '실험실', description: '공개 가능한 실험 페이지.', items: [] },
    inquiry: { id: 'inquiry', label: '문의', description: '연락과 문의 접수 화면.', items: [] },
    policies: { id: 'policies', label: '정책', description: '운영 정책 페이지. 숨김/noindex 페이지는 기본 목록에서 제외합니다.', items: [] },
    utility: { id: 'utility', label: '유틸리티', items: [] },
  },
)
