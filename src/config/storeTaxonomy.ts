export type StoreTaxonomyItem = {
  id: string
  label: string
  description?: string
  order: number
  visible?: boolean
}

export const productTypes: StoreTaxonomyItem[] = [
  { id: 'physical', label: '실물 상품', description: '실물 상품 / 배송 대상', order: 10 },
  { id: 'digital', label: '디지털 상품', description: '디지털 파일 / 템플릿 / 다운로드 상품', order: 20 },
  { id: 'service', label: '서비스', description: '작업 의뢰 / 상담 / 제작 서비스', order: 30 },
  { id: 'bundle', label: '묶음 상품', description: '복합 묶음 상품', order: 40 },
  { id: 'external', label: '외부 상품', description: '외부 스토어 또는 외부 링크 상품', order: 90, visible: false },
]

export const productCategories: StoreTaxonomyItem[] = [
  { id: 'stickers', label: '스티커', description: '스티커 / 소형 인쇄 굿즈', order: 10 },
  { id: 'prints', label: '인쇄물', description: '포스터 / 엽서 / 인쇄물', order: 20 },
  { id: 'templates', label: '템플릿', description: '노션 / 문서 / 작업 템플릿', order: 30 },
  { id: 'presets', label: '프리셋', description: '색상 / 필터 / 작업 프리셋', order: 40 },
  { id: 'tools', label: '도구', description: '웹 도구 / 유틸리티', order: 50 },
  { id: 'assets', label: '소재', description: '이미지 / 텍스처 / 창작 소재', order: 60 },
  { id: 'services', label: '서비스', description: '작업 의뢰 / 컨설팅 / 제작 서비스', order: 70 },
  { id: 'bundles', label: '묶음', description: '묶음 구성 상품', order: 80 },
]

export const productSubcategories: StoreTaxonomyItem[] = [
  { id: 'notion', label: '노션', description: 'Notion 기반 템플릿 / 운영 구조', order: 10 },
  { id: 'writing', label: '글쓰기', description: '글쓰기 / 문장 / 편집 워크플로우', order: 20 },
  { id: 'color', label: '색상', description: '색상 / 감정색 / 팔레트', order: 30 },
  { id: 'print', label: '인쇄', description: '인쇄 / 출력 / CMYK 보조', order: 40 },
  { id: 'web', label: '웹', description: '웹사이트 / UI / 프론트엔드', order: 50 },
  { id: 'ui-kit', label: 'UI 키트', description: 'UI 구성요소 / 디자인 키트', order: 60 },
  { id: 'texture', label: '텍스처', description: '텍스처 / 이미지 소재', order: 70 },
  { id: 'workflow', label: '워크플로우', description: '업무 흐름 / 자동화 / 운영 템플릿', order: 80 },
]

export const productCollections: StoreTaxonomyItem[] = [
  { id: 'varun-tools', label: 'VARUN Tools', description: '바룬툴즈 기본 스토어 / 도구 묶음', order: 10 },
  { id: 'dreamcolor', label: 'DreamColor', description: '감정색 / 컬러 / 프리셋 계열', order: 20 },
  { id: 'earthroon', label: 'Earthroon', description: 'Earthroon 세계관 / 브랜드 계열', order: 30 },
  { id: 'dadumdadum', label: 'Dadumdadum', description: '다듬다듬 도구 / 이미지 처리 계열', order: 40 },
  { id: 'delta-k', label: 'Delta-K', description: 'Delta-K 이론 / 도구 / 문서 계열', order: 50 },
]

export const productStatuses: StoreTaxonomyItem[] = [
  { id: 'available', label: '판매중', description: '구매 가능', order: 10 },
  { id: 'coming-soon', label: '준비 중', description: '준비 중', order: 20 },
  { id: 'sold-out', label: '품절', description: '품절', order: 30 },
  { id: 'draft', label: '초안', description: '초안 / 비공개 준비 상태', order: 80, visible: false },
  { id: 'hidden', label: '숨김', description: '카탈로그 비노출', order: 90, visible: false },
]
