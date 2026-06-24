export const PUBLIC_CONTENT_CATEGORY_LABELS: Record<string, string> = {
  page: 'page',
  post: 'post',
  work: 'works',
  'case-study': 'case-study',
  lab: 'lab',
  tool: 'tool',
  product: 'product',
  doc: 'doc',
  catalog: 'catalog',
  commission: 'commission',
  checkout: 'checkout',
  claim: 'claim',
  inquiry: 'inquiry',
  policies: 'policies',
  qa: 'qa',
}

export function getPublicContentCategoryLabel(value: string): string {
  return PUBLIC_CONTENT_CATEGORY_LABELS[value] || value
}
