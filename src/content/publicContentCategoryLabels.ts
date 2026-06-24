export const PUBLIC_CONTENT_CATEGORY_LABELS: Record<string, string> = {
  page: '페이지',
  post: '글',
  work: '작업',
  'case-study': '사례',
  lab: '실험실',
  tool: '도구',
  product: '상품',
  doc: '문서',
  catalog: '카탈로그',
  commission: '커미션',
  checkout: '결제',
  claim: '수령',
  inquiry: '문의',
  policies: '정책',
  qa: 'QA',
}

export function getPublicContentCategoryLabel(value: string): string {
  return PUBLIC_CONTENT_CATEGORY_LABELS[value] || value
}
