export type ProductPriceInput = {
  price?: number | string
  currency?: string
  priceVisible?: boolean
}

function normalizeNumericPrice(price: number | string): number | null {
  if (typeof price === 'number') return Number.isFinite(price) ? price : null
  const normalized = price.trim().replace(/,/g, '')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function formatProductPrice(options: ProductPriceInput): string {
  if (options.priceVisible === false) return ''
  if (options.price === undefined || options.price === null || options.price === '') return ''

  const currency = (options.currency || 'KRW').trim().toUpperCase()
  const numericPrice = normalizeNumericPrice(options.price)

  if (currency === 'KRW' && numericPrice !== null) {
    return `₩${new Intl.NumberFormat('ko-KR').format(numericPrice)}`
  }

  if (currency === 'USD' && numericPrice !== null) {
    return `$${numericPrice.toFixed(2)}`
  }

  return `${String(options.price).trim()} ${currency}`.trim()
}

export function formatProductStatus(status?: string): string {
  switch (status) {
    case 'available':
      return '판매중'
    case 'coming-soon':
      return '준비 중'
    case 'sold-out':
      return '품절'
    case 'draft':
      return '초안'
    case 'hidden':
      return '숨김'
    default:
      return '준비 중'
  }
}

export function formatProductType(type?: string): string {
  switch (type) {
    case 'physical':
      return '실물 상품'
    case 'digital':
      return '디지털 상품'
    case 'service':
      return '서비스'
    case 'bundle':
      return '묶음 상품'
    case 'external':
      return '외부 상품'
    default:
      return '상품'
  }
}
