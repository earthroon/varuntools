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
      return 'Available'
    case 'coming-soon':
      return 'Coming soon'
    case 'sold-out':
      return 'Sold out'
    case 'draft':
      return 'Draft'
    case 'hidden':
      return 'Hidden'
    default:
      return 'Coming soon'
  }
}

export function formatProductType(type?: string): string {
  switch (type) {
    case 'physical':
      return 'Physical'
    case 'digital':
      return 'Digital'
    case 'service':
      return 'Service'
    case 'bundle':
      return 'Bundle'
    case 'external':
      return 'External'
    default:
      return 'Product'
  }
}
