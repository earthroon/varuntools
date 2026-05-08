import type { InquiryCategory, InquiryDraft, InquiryPrefillContext } from '@/types/inquiry'
import { INQUIRY_CATEGORIES } from './inquiryValidation'

const CATEGORY_VALUES = new Set(INQUIRY_CATEGORIES.map((category) => category.value))

function clean(value: string | null | undefined): string {
  return String(value || '').trim().slice(0, 160)
}

export function normalizeInquiryQueryCategory(value: string | null | undefined): InquiryCategory | '' {
  const normalized = clean(value).toLowerCase()
  return CATEGORY_VALUES.has(normalized as InquiryCategory) ? (normalized as InquiryCategory) : ''
}

export function createInquiryPrefillContext(search = ''): InquiryPrefillContext {
  const params = new URLSearchParams(search.startsWith('?') ? search : search ? `?${search}` : '')
  const categoryFromQuery = normalizeInquiryQueryCategory(params.get('category') || params.get('type'))
  const ref = clean(params.get('ref') || params.get('relatedProductSlug') || params.get('product'))

  return {
    ref: ref || undefined,
    categoryFromQuery: categoryFromQuery || undefined,
    prefilled: Boolean(ref || categoryFromQuery),
    source: ref || categoryFromQuery ? 'query' : 'none',
  }
}

export function applyInquiryPrefillToDraft(draft: InquiryDraft, context: InquiryPrefillContext): void {
  if (context.categoryFromQuery) draft.category = context.categoryFromQuery
  if (context.ref) draft.relatedProductSlug = context.ref
}

export function getBrowserInquiryPrefillContext(): InquiryPrefillContext {
  if (typeof window === 'undefined') return createInquiryPrefillContext('')
  return createInquiryPrefillContext(window.location.search)
}
